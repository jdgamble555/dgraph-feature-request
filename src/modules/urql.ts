import { SubscriptionClient } from "subscriptions-transport-ws";
import { pipe, mergeMap, map, fromPromise, fromValue } from 'wonka';
import {
    dedupExchange,
    cacheExchange,
    fetchExchange,
    subscriptionExchange,
    createClient,
    makeOperation
} from "@urql/core";
import * as ws from 'ws';
import type { Exchange, Operation } from '@urql/core';
import { getToken } from "./firebase";

const DGRAPH_URL = 'misty-fog.us-west-2.aws.cloud.dgraph.io/graphql';

const isServerSide = typeof window === "undefined";

const getHeaders = async () => ({ "X-Auth-Token": await getToken() });

const subscriptionClient = new SubscriptionClient(`wss://${DGRAPH_URL}`, {
    reconnect: true,
    lazy: true,
    connectionParams: async () => await getHeaders()
}, isServerSide ? ws : null);


// allow for async headers...
const fetchOptionsExchange = (fn: any): Exchange => ({ forward }) => ops$ => {
    return pipe(
        ops$,
        mergeMap((operation: Operation) => {
            const result = fn(operation.context.fetchOptions);
            return pipe(
                typeof result.then === 'function' ? fromPromise(result) : fromValue(result) as any,
                map((fetchOptions: RequestInit | (() => RequestInit)) => {
                    return makeOperation(operation.kind, operation, {
                        ...operation.context,
                        fetchOptions
                    });
                })
            );
        }),
        forward
    );
};

const client = createClient({
    url: `https://${DGRAPH_URL}`,
    exchanges: [
        dedupExchange,
        cacheExchange,
        fetchOptionsExchange(async (fetchOptions: any) => {
            return {
                ...fetchOptions,
                headers: await getHeaders()
            };
        }),
        subscriptionExchange({
            forwardSubscription(operation) {
                return subscriptionClient.request(operation);
            },
        }),
        fetchExchange
    ]
});

export default client