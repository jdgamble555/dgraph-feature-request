async function toggleVote({ args, dql, authHeader }: any) {

    const claimsBase64 = authHeader.value.split(".")[1];
    const claims = JSON.parse(atob(claimsBase64));
    const featureID = args.id;

    const q = `
    upsert {
        query {
            q1(func: eq(User.email, "${claims.email}")) {
                User as uid
            }
            q2(func: uid("${featureID}")) {
                uid
                Feature.votes @filter(eq(User.email, "${claims.email}")) {
                    r as uid
                    User.email
                }
            }
        }
        mutation @if(eq(len(r), 1)) {
            delete {
                <${featureID}> <Feature.votes> uid(User) .
                uid(User) <User.votedFor> <${featureID}> .
            }
        }
        mutation @if(eq(len(r), 0)) {
            set {
                <${featureID}> <Feature.votes> uid(User) .
                uid(User) <User.votedFor> <${featureID}> .
            }
        }
    }`;

    const m = await dql.mutate(q);
    return featureID;
}

async function deepUpdate({ event, dql, nodes, merge = true }) {

    const op = event.operation;

    if (op === 'update') {

        const uid = event[event.operation].rootUIDs[0];
        const removePatch: any = event.update.removePatch;
        const setPatch: any = event.update.setPatch;
        const type: string = event.__typename;

        // get updated keys
        let toRemove: string[];
        let toAdd: string[];

        if (removePatch) {
            toRemove = nodes.filter((v: string) => Object.keys(removePatch).includes(v));
        }
        if (setPatch) {
            toAdd = nodes.filter((v: string) => Object.keys(setPatch).includes(v));
        }

        const titleCase = (t: string) =>
            t.charAt(0).toUpperCase() + t.substring(1).toLowerCase();
        let args: any;

        if (merge) {

            if (setPatch) {
                // add inverse relationship
                await cascadeDelete({ dql, nodes, event, _add: true });
            }
            // remove objects in 'remove'
            if (toRemove) {

                // todo - upsert for xids or uids

                // get inverse relationships, delete them
                args = `{ delete { `;
                for (let i = 0; i < toRemove.length; ++i) {
                    // key input array
                    const patch: any[] = removePatch[toRemove[i]];
                    const ids = patch.map(v => Object.values(v)[0]);
                    // delete all child.parent
                    for (let j = 0; j < ids.length; ++j) {
                        args += `<${ids[j]}> * * . \n`;
                    }
                }
                args += `} }`;
            }
        } else {

            // delete all records in 'array'
            await cascadeDelete({ dql, nodes, event, _delete: true });

            // re-add everything
            for (let i = 0; i < toAdd.length; ++i) {
                args = `{ set { `;
                const child = setPatch[toAdd[i]];
                for (let j = 0; j < child.length; ++j) {
                    args += `<${uid}> <${type}.${toAdd[i].toLowerCase()}> _:new${j} . 
                    _:new${j} <${titleCase(toAdd[i])}.${type.toLowerCase()}> <${uid}> . 
                    _:new${j} <${titleCase(toAdd[i])}.${Object.keys(child[j])[0]}> "${Object.values(child[j])[0]}" . 
                    _:new${j} <dgraph.type> "${titleCase(toAdd[i])}" . \n`;
                }
                args += `} }`;
            }
        }
        // mutate
        console.log(args);
        const r = await dql.mutate(args);
        console.log(r);
    }
}

async function cascadeDelete({ event, dql, nodes, _delete = false, _add = false }) {

    const _nodes: string[] = nodes;

    const op = event.operation;

    if (op === 'delete' || op === 'add' || _delete || _add) {

        const uid = event[event.operation].rootUIDs[0];
        const invType = (event.__typename as string).toLowerCase();
        const type: string = event.__typename;

        const titleCase = (t: string) =>
            t.charAt(0).toUpperCase() + t.substring(1).toLowerCase();

        let args: any;

        if (op === 'delete' || _delete) {

            // get inverse relationships, delete them
            args = `upsert { query { `;
            for (let i = 0; i < _nodes.length; ++i) {
                const child = titleCase(_nodes[i]);
                // get all child.parent
                args += `t${i} as var(func: type(${child})) @filter(uid_in(${child}.${invType}, ${uid})) `;
                // get all parent.child
                args += `q${i}(func: uid(${uid})) { b${i} as ${titleCase(type)}.${_nodes[i].toLowerCase()} } `;
            }
            args += `} mutation { delete { `;
            for (let i = 0; i < _nodes.length; ++i) {
                // delete all child.parent
                args += `uid(t${i}) * * . \n`;
                // delete all parent.child
                args += `<${uid}> <${titleCase(type)}.${_nodes[i].toLowerCase()}> uid(b${i}) . `;
            }
            args += `} } }`;

        } else if (op === 'add' || _add) {

            // creates inverse relationships
            args = `upsert { query { q(func: uid(${uid})) { `;
            for (let i = 0; i < _nodes.length; ++i) {
                // get all 
                args += `t${i} as ${type}.${_nodes[i].toLowerCase()} `;
            }
            args += `} } mutation { set { `;
            for (let i = 0; i < _nodes.length; ++i) {
                args += `uid(t${i}) <${titleCase(_nodes[i])}.${invType}> <${uid}> . `
            }
            args += `} } }`;
        }
        console.log(args);
        const r = await dql.mutate(args);
        console.log(r);
    }
}

async function updateTimestamps({ event, dql }) {

    const op = event.operation === 'delete' ? 'delete' : 'set';
    const field = event.operation === 'add'
        ? 'createdAt'
        : 'updatedAt';
    const uid = event[event.operation].rootUIDs[0];
    const type: string = event.__typename;
    const invType = type.toLowerCase();
    const date = new Date().toISOString();
    const child = 'Timestamp';
    const invChild = child.toLowerCase();

    const args = `
        upsert {
            query {
                t as var(func: type(${child})) @filter(uid_in(${child}.${invType}, ${uid}))
            }
            mutation @if(eq(len(t), 1)) {
                ${op} {
                    <${uid}> <${type}.${invChild}> uid(t) .
                    uid(t) <${child}.${invType}> <${uid}> .
                    uid(t) <${child}.${field}> "${date}" .
                    uid(t) <dgraph.type> "${child}" .
                }  
            }
            mutation @if(eq(len(t), 0)) {
                ${op} {
                    <${uid}> <${type}.${invChild}> _:new .
                    _:new <${child}.${invType}> <${uid}> .
                    _:new <${child}.${field}> "${date}" .
                    _:new <dgraph.type> "${child}" .
                }
            }
        }`;

    const r = await dql.mutate(args);
    console.log(r);
}

async function featurePostHook({ event, dql }) {

    // update timestamps
    //await updateTimestamps({ event, dql });

    // cascade delete
    await cascadeDelete({ event, dql, nodes: ['private'] });

    // deep update
    await deepUpdate({ event, dql, nodes: ['private'], merge: false });

}

(self as any).addGraphQLResolvers({
    "Mutation.toggleVote": toggleVote
});

(self as any).addWebHookResolvers({
    "User.add": updateTimestamps,
    "User.update": updateTimestamps,
    "User.delete": updateTimestamps
});

(self as any).addWebHookResolvers({
    "Feature.add": featurePostHook,
    "Feature.update": featurePostHook,
    "Feature.delete": featurePostHook
});
