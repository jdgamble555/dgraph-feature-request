import { Dgraph } from "easy-dgraph";
import client from "./urql";

// extend the original dgraph module
export class dgraph extends Dgraph {

    private _urlOpts: any;
    private _devMode: boolean;

    constructor(_type?: string, isDevMode = false) {
        super(_type);
        this._devMode = isDevMode;
    }

    networkOnly(): this {
        this._urlOpts = { requestPolicy: 'network-only' };
        return this;
    }

    async build() {
        const gq = super.build();
        if (this._devMode) {
            console.log(gq);
        }
        if (this._operation === 'mutation') {
            return await client.mutation(gq, this._urlOpts).toPromise()
                .then((r) => {
                    if (r.error) {
                        console.log(r.error.message);
                    }
                    const r1 = r.data ? Object.keys(r.data)[0] : '';
                    return r.data ? r.data[r1][Object.keys(r.data[r1])[0]][0] : null;
                });
        }
        return await client.query(gq, undefined, this._urlOpts).toPromise()
            .then((r) => {
                if (r.error) {
                    console.log(r.error.message);
                }
                return r.data ? r.data[Object.keys(r.data)[0]] : null;
            });
    }
}
