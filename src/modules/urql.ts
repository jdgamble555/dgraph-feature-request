import { SubscriptionClient } from "subscriptions-transport-ws";
import { pipe, mergeMap, map, fromPromise, fromValue } from 'wonka';
import {
    dedupExchange,
    cacheExchange,
    fetchExchange,
    subscriptionExchange,
    createClient,
    makeOperation,
    ssrExchange
} from "@urql/core";
import * as ws from 'ws';
import type { Exchange, Operation } from '@urql/core';
import { getToken } from "./firebase";
import { dgraph_config } from '../config';

const DGRAPH_URL = dgraph_config;

const isServerSide = typeof window === "undefined";

const getHeaders = async () => ({ "X-Auth-Token": await getToken() });

const subscriptionClient = new SubscriptionClient(`wss://${DGRAPH_URL}`, {
    reconnect: true,
    lazy: true,
    connectionParams: async () => await getHeaders()
}, isServerSide ? ws : null);

export const ssr = ssrExchange({
    isClient: !isServerSide,
    initialState: !isServerSide ? window['__URQL_DATA__'] : undefined,
});

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
    fetch: fetch,
    url: `https://${DGRAPH_URL}`,
    exchanges: [
        dedupExchange,
        cacheExchange,
        ssr,
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

export const data = `
<script lang="ts"> 
  window.__URQL_DATA__ = JSON.parse(JSON.stringify(__SSR__)); 
</script>
`;

export default client