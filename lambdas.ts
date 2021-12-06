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
    console.log(m);
    return featureID;
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

(self as any).addWebHookResolvers({
    "User.add": updateTimestamps,
    "User.update": updateTimestamps,
    "User.delete": updateTimestamps
});

(self as any).addWebHookResolvers({
    "Feature.add": updateTimestamps,
    "Feature.update": updateTimestamps,
    "Feature.delete": updateTimestamps
});

(self as any).addGraphQLResolvers({
    "Mutation.toggleVote": toggleVote,
});
