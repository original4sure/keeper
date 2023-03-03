/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'events';
import { Options } from 'generic-pool';
import Redis, { Redis as IRedis, RedisOptions } from 'ioredis';
export declare class IORedisConnectionOptions {
    meh: Options;
}
export declare class IORedisPoolOptions {
    url?: string;
    host: string | undefined;
    port: number | undefined;
    redisOptions: RedisOptions;
    poolOptions: Options;
    static fromUrl(url: string): IORedisPoolOptions;
    static fromHostAndPort(host: string, port: number): IORedisPoolOptions;
    constructor();
    withIORedisOptions(options: RedisOptions): IORedisPoolOptions;
    withPoolOptions(poolOptions: Options): IORedisPoolOptions;
}
export declare const createRedis: (opts: IORedisPoolOptions) => Redis;
export declare class IORedisPool extends EventEmitter {
    private opts;
    private pool;
    constructor(opts: IORedisPoolOptions);
    private buildPool;
    getInfo(): {
        spareResourceCapacity: number;
        size: number;
        available: number;
        borrowed: number;
        pending: number;
        max: number;
        min: number;
    };
    getConnection(priority?: number): Promise<Redis>;
    del(keys: string[]): Promise<number>;
    set(key: string, value: string | number | Buffer): Promise<"OK">;
    setWithSeconds(key: string, value: string | number | Buffer, secondsToken: "EX", seconds: number | string): Promise<"OK">;
    setex(key: string, ttl: number, value: number | string | Buffer): Promise<"OK">;
    get(key: string): Promise<string | null>;
    mget(keys: string[]): Promise<(string | null)[]>;
    exists(keys: string[]): Promise<number>;
    multi(): Promise<import("ioredis").ChainableCommander>;
    release(client: IRedis): Promise<void>;
    disconnect(client: IRedis): Promise<void>;
    end(): Promise<void>;
    execute<T>(fn: (client: IRedis) => Promise<T>, priority?: number): Promise<T>;
}
