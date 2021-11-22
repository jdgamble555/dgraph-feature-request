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

(self as any).addGraphQLResolvers({
    "Mutation.toggleVote": toggleVote,
});