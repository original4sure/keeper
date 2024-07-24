/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'events';
import { Options } from 'generic-pool';
import Redis, { Redis as IRedis, RedisOptions, RedisValue } from 'ioredis';
export declare class IORedisConnectionOptions {
    meh: Options;
}
/**
 * This is a an extension of keeper library.
 * This wraps ioredis giving pooling capability
 */
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
    /**
     * Use only if you know what you're doing.
     * DONT FORGET TO RELEASE CONNECTION RIGHT AFTER
     * @param priority
     * @returns
     */
    getConnection(priority?: number): Promise<Redis>;
    del(keys: string[]): Promise<number>;
    set(key: string, value: string | number | Buffer, keepttl?: boolean): Promise<any>;
    setWithSeconds(key: string, value: string | number | Buffer, secondsToken: "EX", seconds: number | string): Promise<"OK">;
    setex(key: string, ttl: number, value: number | string | Buffer): Promise<"OK">;
    get(key: string): Promise<string | null>;
    evalsha(sha1: string | Buffer, numkeys: number | string, ...args: RedisValue[]): Promise<unknown>;
    eval(script: string | Buffer, numkeys: number | string, ...args: RedisValue[]): Promise<unknown>;
    quit(): Promise<boolean>;
    mget(keys: string[]): Promise<(string | null)[]>;
    exists(keys: string[]): Promise<number>;
    /**
     * commands can be [["set", "testMulti", "5"], ["get", "testMulti"], ["incr", "testMulti"], ["decr", "testMulti"]]
     * TODO: instead of using plain array of string, expose a function just like redis.multi
     * so that a chainable object is returned and type definable
     *
     * @param commands string[][]
     * @returns
     */
    execCommands(commands: (number | string)[][]): Promise<[error: Error | null, result: unknown][] | null>;
    release(client: IRedis): Promise<void>;
    disconnect(client: IRedis): Promise<void>;
    end(): Promise<void>;
    execute<T>(fn: (client: IRedis) => Promise<T>, priority?: number): Promise<T>;
}
