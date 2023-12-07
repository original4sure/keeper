"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IORedisPool = exports.createRedis = exports.IORedisPoolOptions = exports.IORedisConnectionOptions = void 0;
const events_1 = require("events");
const generic_pool_1 = require("generic-pool");
const ioredis_1 = require("ioredis");
class IORedisConnectionOptions {
    constructor() {
        this.meh = {};
    }
}
exports.IORedisConnectionOptions = IORedisConnectionOptions;
/**
 * This is a an extension of keeper library.
 * This wraps ioredis giving pooling capability
 */
class IORedisPoolOptions {
    constructor() {
        this.host = '127.0.0.1';
        this.port = 6379;
        this.redisOptions = {};
        this.poolOptions = {};
    }
    static fromUrl(url) {
        const instance = new IORedisPoolOptions();
        instance.url = url;
        instance.host = undefined;
        instance.port = undefined;
        return instance;
    }
    static fromHostAndPort(host, port) {
        const instance = new IORedisPoolOptions();
        instance.url = undefined;
        instance.host = host;
        instance.port = port;
        return instance;
    }
    withIORedisOptions(options) {
        this.redisOptions = options;
        return this;
    }
    withPoolOptions(poolOptions) {
        this.poolOptions = poolOptions;
        return this;
    }
}
exports.IORedisPoolOptions = IORedisPoolOptions;
exports.createRedis = (opts) => {
    if (opts.url) {
        return new ioredis_1.default(opts.url, opts.redisOptions);
    }
    else {
        return new ioredis_1.default(opts.port || 6379, opts.host || '127.0.0.1', opts.redisOptions);
    }
};
class IORedisPool extends events_1.EventEmitter {
    constructor(opts) {
        super();
        this.opts = opts;
        this.pool = {};
        this.pool = this.buildPool();
    }
    buildPool() {
        const factory = {
            create: () => {
                const context = this;
                return new Promise((resolve, reject) => {
                    let client;
                    if (context.opts.url) {
                        client = new ioredis_1.default(context.opts.url, context.opts.redisOptions);
                    }
                    else {
                        client = new ioredis_1.default(context.opts.port || 6379, context.opts.host || '127.0.0.1', context.opts.redisOptions);
                    }
                    client
                        .on('error', (e) => {
                        context.emit('error', e, client);
                        reject();
                    })
                        .on('connect', () => {
                        context.emit('connect', client);
                    })
                        .on('ready', () => {
                        context.emit('ready', client);
                        resolve(client);
                    })
                        .on('reconnecting', () => {
                        context.emit('reconnecting', client);
                    });
                });
            },
            destroy: (client) => {
                const context = this;
                return new Promise((resolve) => {
                    client
                        .on('close', (e) => {
                        context.emit('close', e, client);
                    })
                        .on('end', () => {
                        context.emit('disconnected', client);
                        resolve();
                    })
                        .disconnect();
                });
            },
            validate: (client) => {
                return new Promise((resolve) => {
                    if (client.status === "connecting" ||
                        client.status === "connect" ||
                        client.status === "ready") {
                        resolve(true);
                    }
                    else {
                        resolve(false);
                    }
                });
            }
        };
        return generic_pool_1.createPool(factory, this.opts.poolOptions);
    }
    getInfo() {
        return {
            spareResourceCapacity: this.pool.spareResourceCapacity,
            size: this.pool.size,
            available: this.pool.available,
            borrowed: this.pool.borrowed,
            pending: this.pool.pending,
            max: this.pool.max,
            min: this.pool.min
        };
    }
    /**
     * Use only if you know what you're doing.
     * DONT FORGET TO RELEASE CONNECTION RIGHT AFTER
     * @param priority
     * @returns
     */
    getConnection(priority) {
        return this.pool.acquire(priority);
    }
    async del(keys) {
        const cache = await this.getConnection();
        const res = await cache.del(keys);
        this.pool.release(cache);
        return res;
    }
    async set(key, value, keepttl = false) {
        const cache = await this.getConnection();
        let res;
        if (keepttl) {
            // res = await cache.set(key, value, "KEEPTTL") TODO: this is available only from version 6
            const ttl = await cache.ttl(key);
            res = await cache.setex(key, ttl, value);
        }
        else {
            res = await cache.set(key, value);
        }
        this.pool.release(cache);
        return res;
    }
    async setWithSeconds(key, value, secondsToken, seconds) {
        const cache = await this.getConnection();
        const res = await cache.set(key, value, secondsToken, seconds);
        this.pool.release(cache);
        return res;
    }
    async setex(key, ttl, value) {
        const cache = await this.getConnection();
        const res = await cache.setex(key, ttl, value);
        this.pool.release(cache);
        return res;
    }
    async get(key) {
        const cache = await this.getConnection();
        const res = await cache.get(key);
        this.pool.release(cache);
        return res;
    }
    async mget(keys) {
        const cache = await this.getConnection();
        const res = await cache.mget(keys);
        this.pool.release(cache);
        return res;
    }
    async exists(keys) {
        const cache = await this.getConnection();
        const res = await cache.exists(keys);
        this.pool.release(cache);
        return res;
    }
    /**
     * commands can be [["set", "testMulti", "5"], ["get", "testMulti"], ["incr", "testMulti"], ["decr", "testMulti"]]
     * TODO: instead of using plain array of string, expose a function just like redis.multi
     * so that a chainable object is returned and type definable
     *
     * @param commands string[][]
     * @returns
     */
    async execCommands(commands) {
        const cache = await this.getConnection();
        const res = await cache.pipeline(commands).exec();
        this.pool.release(cache);
        return res;
    }
    release(client) {
        return this.pool.release(client);
    }
    disconnect(client) {
        return this.pool.destroy(client);
    }
    async end() {
        await this.pool.drain();
        const res = await this.pool.clear();
        this.emit('end');
        return res;
    }
    async execute(fn, priority) {
        const client = await this.pool.acquire(priority);
        const result = await fn(client);
        await this.release(client);
        return result;
    }
}
exports.IORedisPool = IORedisPool;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9wb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFxQztBQUNyQywrQ0FBaUU7QUFDakUscUNBQXdGO0FBRXhGLE1BQWEsd0JBQXdCO0lBQXJDO1FBQ0UsUUFBRyxHQUFZLEVBQUUsQ0FBQTtJQUNuQixDQUFDO0NBQUE7QUFGRCw0REFFQztBQUVEOzs7R0FHRztBQUNILE1BQWEsa0JBQWtCO0lBeUI3QjtRQXZCQSxTQUFJLEdBQXVCLFdBQVcsQ0FBQTtRQUN0QyxTQUFJLEdBQXVCLElBQUksQ0FBQTtRQUMvQixpQkFBWSxHQUFpQixFQUFFLENBQUE7UUFDL0IsZ0JBQVcsR0FBWSxFQUFFLENBQUE7SUFvQlYsQ0FBQztJQWxCVCxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQVc7UUFDL0IsTUFBTSxRQUFRLEdBQUcsSUFBSSxrQkFBa0IsRUFBRSxDQUFBO1FBQ3pDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFBO1FBQ2xCLFFBQVEsQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFBO1FBQ3pCLFFBQVEsQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFBO1FBRXpCLE9BQU8sUUFBUSxDQUFBO0lBQ2pCLENBQUM7SUFFTSxNQUFNLENBQUMsZUFBZSxDQUFDLElBQVksRUFBRSxJQUFZO1FBQ3RELE1BQU0sUUFBUSxHQUFHLElBQUksa0JBQWtCLEVBQUUsQ0FBQTtRQUN6QyxRQUFRLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQTtRQUN4QixRQUFRLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtRQUNwQixRQUFRLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtRQUVwQixPQUFPLFFBQVEsQ0FBQTtJQUNqQixDQUFDO0lBSUQsa0JBQWtCLENBQUMsT0FBcUI7UUFDdEMsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUE7UUFDM0IsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lB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