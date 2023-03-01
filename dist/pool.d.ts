/// <reference types="node" />
import { EventEmitter } from 'events';
import { Options } from 'generic-pool';
import Redis, { Redis as IRedis, RedisOptions } from 'ioredis';
export declare class IORedisConnectionOptions {
    meh: Options;
}
export type CustomRedisConstructor = new (url: string, options: RedisOptions) => IRedis;
export declare class IORedisPoolOptions {
    url?: string;
    host: string | undefined;
    port: number | undefined;
    redisOptions: RedisOptions;
    poolOptions: Options;
    customRedisConstructor?: CustomRedisConstructor;
    static fromUrl(url: string): IORedisPoolOptions;
    static fromHostAndPort(host: string, port: number): IORedisPoolOptions;
    constructor();
    withIORedisOptions(options: RedisOptions): IORedisPoolOptions;
    withPoolOptions(poolOptions: Options, customRedisConstructor?: CustomRedisConstructor): IORedisPoolOptions;
}
export declare class IORedisPool extends EventEmitter {
    private opts;
    private pool;
    constructor(opts: IORedisPoolOptions);
    private buildPool;
    getConnection(priority?: number): Promise<Redis>;
    release(client: IRedis): Promise<void>;
    disconnect(client: IRedis): Promise<void>;
    end(): Promise<void>;
    execute<T>(fn: (client: IRedis) => Promise<T>, priority?: number): Promise<T>;
}
