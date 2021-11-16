async function toggleVote({ args, graphql, dql, authHeader }: any) {

    const claimsBase64 = authHeader.value.split(".")[1];
    const claims = JSON.parse(atob(claimsBase64));    
    const featureID = args.id;

    const q = `
        query { 
            getFeature(id: "${featureID}") { 
                votes(filter: { email: { eq: "${claims.email}" } }) { 
                    id
                    email
                }
            }
        }
    `;

    const r = await graphql(q);
    const feature = r.data ? r.data.getFeature.votes.length : null;
    const type = feature ? 'delete' : 'set';

    const q2 = `
        upsert {
            query {
                u(func: eq(User.email, "${claims.email}")) {
                    User as uid
                }
            }
            mutation {
                ${type} {
                    <${featureID}> <Feature.votes> uid(User) .
                    uid(User) <User.votedFor> <${featureID}> .
                }
            }
        }
    `;
    
    const m = await dql.mutate(q2);
    return m.data ? type : null;
}

(self as any).addGraphQLResolvers({
    "Mutation.toggleVote": toggleVote,
});