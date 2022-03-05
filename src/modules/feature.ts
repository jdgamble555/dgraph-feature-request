import { dgraph } from 'j-dgraph';
import { get } from 'svelte/store';

import { dgraph_config } from '../config';
import { featureStore, showSnackbarMsg, userState } from '../stores/core';

import { getToken } from './firebase';


export class Feature {

    private _dgraph: dgraph;
    private _tmp: any;

    private _q = {
        id: 1,
        name: 1,
        url: 1,
        author: { id: 1 },
        totalVotes: 1,
        description: 1,
        votes: {
            id: 1
        }
    };

    private _q2 = {
        id: 1,
        name: 1,
        url: 1,
        description: 1,
        author: { id: 1 },
        votes: {
            id: 1
        }
    };

    constructor(dev = false, fetch = null) {
        this._dgraph = new dgraph({
            isDevMode: dev,
            url: dgraph_config,
            headers: async () => ({
                "X-Auth-Token": await getToken()
            }),
            fetch
        });
    }

    subscribeFeature(uid: string) {
        return this._dgraph.type('queryFeatureSortedByVotes')
            .filter(uid)
            .customQuery(this._q)
            .buildSubscription();
    }

    async queryFeature() {
        return await this._dgraph.type('queryFeatureSortedByVotes')
            .customQuery(this._q)
            //.networkOnly()
            .build();
    }

    async updateFeature(fid: string, feature: { url: string, name: string, description: string }) {

        if (get(userState)) {

            // save original for undo
            this._tmp = get(featureStore);

            // optimistic update ui
            const f = this._tmp.map((r: any) => {
                if (r.id === fid) {
                    r.url = feature.url;
                    r.name = feature.name;
                    r.description = feature.description;
                }
                return r;
            });
            featureStore.set(f);
            // update database
            const r = await this._dgraph.type('feature')
                .update(this._q2)
                .filter({ id: fid })
                .set({
                    name: feature.name,
                    url: feature.url,
                    description: feature.description
                })
                .build();

            if (r.data.length === 0) {
                showSnackbarMsg.set('You are not authorized to perform that action!');
                featureStore.set(this._tmp);
            } else {
                showSnackbarMsg.set('Feature Updated!');
            }
        } else {
            this.loginError();
        }
    }

    async addFeature(feature: string, url: string, description: string) {

        // get user object
        const user = get(userState);

        // save original for undo
        this._tmp = get(featureStore);

        if (user) {

            // optimistic update ui first
            const f = [
                ...this._tmp,
                {
                    name: feature,
                    url,
                    id: 'x',
                    totalVotes: 1,
                    description,
                    votes: { id: user.id },
                    author: { id: user.id }
                }
            ];
            featureStore.set(f);
            // update database
            const r = await this._dgraph.type('feature')
                .add(this._q2)
                .set({
                    name: feature,
                    url,
                    description,
                    author: { id: user.id },
                    votes: { id: user.id },
                    link: { lid: 'link' }
                })
                .build();
            if (r.data.length === 0) {
                showSnackbarMsg.set('You are not authorized to perform that action!');
                featureStore.set(this._tmp);
            } else {
                showSnackbarMsg.set('Feature Added!');
            }
        } else {
            this.loginError();
        }
    }

    loginError() {
        showSnackbarMsg.set('You must be logged in for that!');
    }

    async deleteFeature(id: string) {

        //showConfirm = false;

        if (get(userState)) {

            // save original for undo
            this._tmp = get(featureStore);

            // optimistic update ui first
            const f = this._tmp.filter((r: any) => r.id !== id);
            featureStore.set(f);
            const r = await this._dgraph.type('feature').delete().filter(id).build();
            if (r.data.length === 0) {
                showSnackbarMsg.set('You are not authorized to perform that action!');
                featureStore.set(this._tmp);
            } else {
                showSnackbarMsg.set('Feature Deleted!');
            }
        } else {
            this.loginError();
        }
    }

    async toggleVote(id: string, voted: boolean) {

        if (get(userState)) {

            // save original for undo
            this._tmp = get(featureStore);

            // optimistic update ui first
            const f = this._tmp.map((f: any) => {
                if (f.id === id) {
                    if (voted) {
                        f.totalVotes--;
                    } else {
                        f.totalVotes++;
                    }
                }
                return f;
            });
            featureStore.set(f);
            // update database
            const r = await this._dgraph.type('toggleVote')
                .filter(id)
                .customMutation()
                .build();
            if (r.data.length === 0) {
                showSnackbarMsg.set('You are not authorized to perform that action!');
                featureStore.set(this._tmp);
            } else {
                showSnackbarMsg.set('Vote ' + (voted ? 'Removed!' : 'Added!'));
            }
        } else {
            this.loginError();
        }
    }

}
