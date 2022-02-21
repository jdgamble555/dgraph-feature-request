import { Feature } from '../modules/feature';

import { dev } from '$app/env';

export async function get() {
    const fService = new Feature(dev, fetch);
    return {
        body: await fService.queryFeature()
    };
}