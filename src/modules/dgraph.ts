import { Dgraph } from 'easy-dgraph';
export { EnumType } from 'easy-dgraph';
import { map, Observable } from 'rxjs';
import { pipe, toObservable } from "wonka";
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
                    if (r.data) {
                        if (r.data[r1]) {
                            if (r.data[r1].numUids === 0) {
                                return r.data[r1];
                            }
                            const r2 = r.data[r1][Object.keys(r.data[r1])[0]];
                            if (r2[0]) {
                                return r2[0];
                            }
                            return r2;
                        }
                    }
                    return null;
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
    buildSubscription() {
        this.operation('subscription');
        const gq = super.build();
        if (this._devMode) {
            console.log(gq);
        }
        return new Observable((observable: any) => {
            pipe(
                client.subscription(gq),
                toObservable
            ).subscribe(observable);
        }).pipe(
            map((r: any) => {
                if (r.error) {
                    console.log(r.error.message);
                }
                return r.data ? r.data[Object.keys(r.data)[0]] : null;
            })
        );
    }
}
