import { get } from 'svelte/store';
import { dgraph } from './dgraph';
import { showSnackbarMsg, userState, featureStore } from '../stores/core';

export class Feature {

    private _tmp: any;
    private _dev: boolean;

    constructor(dev = false) {
        this._dev = dev;
    }

    static subscribeFeature(uid: string, dev = false) {
        return new dgraph('queryFeatureSortedByVotes', dev)
            .filter(uid)
            .customQuery({
                name: 1,
                url: 1,
                id: 1,
                totalVotes: 1,
                author: { id: 1 },
                votes: { id: 1 }
            })
            .buildSubscription()
    }

    static async queryFeature(dev = false) {
        return await new dgraph('queryFeatureSortedByVotes', dev)
            .customQuery({
                id: 1,
                url: 1,
                name: 1,
                votes: { id: 1 },
                author: { id: 1 },
                totalVotes: 1
            })
            //.networkOnly()
            .build();
    }

    async updateFeature(fid: string, feature: { url: string, name: string }) {

        if (get(userState)) {

            // save original for undo
            this._tmp = get(featureStore);

            // optimistic update ui
            const f = this._tmp.map((r: any) => {
                if (r.id === fid) {
                    r.url = feature.url;
                    r.name = feature.name;
                }
                return r;
            });
            featureStore.set(f);
            // update database
            const r = await new dgraph('feature', this._dev)
                .update({ name: 1, url: 1, id: 1, votes: { id: 1 } })
                .filter(fid)
                .set({
                    name: feature.name,
                    url: feature.url
                })
                .build();

            if (r.numUids === 0) {
                showSnackbarMsg.set('You are not authorized to perform that action!');
                featureStore.set(this._tmp);
            } else {
                showSnackbarMsg.set('Feature Updated!');
            }
        } else {
            this.loginError();
        }
    }

    async addFeature(feature: string, url: string) {

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
                    votes: { id: user.id },
                    author: { id: user.id }
                }
            ];
            featureStore.set(f);
            // update database
            const r = await new dgraph('feature', this._dev)
                .add({ name: 1, url: 1, id: 1, votes: { id: 1 } })
                .set({
                    name: feature,
                    url,
                    author: { id: user.id },
                    votes: { id: user.id },
                    link: { lid: 'link' }
                })
                .build();
            if (r.numUids === 0) {
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
            const r = await new dgraph('feature', this._dev).delete().filter(id).build();
            if (r.numUids === 0) {
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
            const r = await new dgraph('toggleVote', this._dev)
                .filter(id)
                .customMutation()
                .build();
            if (r.numUids === 0) {
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
