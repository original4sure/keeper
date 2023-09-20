import { IORedisPool } from "./pool";
export declare const getCachePool: (uri: string) => Promise<IORedisPool>;
export declare const Keeper: <T>(options: {
    parseJSON: boolean;
    expire: number;
    ignoreCache?: boolean;
}, cacheUri: string, keygen: (...args: any[]) => string, fn: (...args: any[]) => Promise<T>) => (...args: any[]) => Promise<T>;
