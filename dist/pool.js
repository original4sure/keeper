"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IORedisPool = exports.IORedisPoolOptions = exports.IORedisConnectionOptions = void 0;
const events_1 = require("events");
const generic_pool_1 = require("generic-pool");
const ioredis_1 = require("ioredis");
class IORedisConnectionOptions {
    constructor() {
        this.meh = {};
    }
}
exports.IORedisConnectionOptions = IORedisConnectionOptions;
class IORedisPoolOptions {
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
    constructor() {
        this.host = '127.0.0.1';
        this.port = 6379;
        this.redisOptions = {};
        this.poolOptions = {};
    }
    withIORedisOptions(options) {
        this.redisOptions = options;
        return this;
    }
    withPoolOptions(poolOptions, customRedisConstructor) {
        this.poolOptions = poolOptions;
        this.customRedisConstructor = customRedisConstructor;
        return this;
    }
}
exports.IORedisPoolOptions = IORedisPoolOptions;
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
                    if (context.opts.customRedisConstructor && context.opts.url) {
                        client = new context.opts.customRedisConstructor(context.opts.url, context.opts.redisOptions);
                    }
                    else if (context.opts.url) {
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
        return (0, generic_pool_1.createPool)(factory, this.opts.poolOptions);
    }
    getConnection(priority) {
        return this.pool.acquire(priority);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9wb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFxQztBQUNyQywrQ0FBaUU7QUFDakUscUNBQThEO0FBRTlELE1BQWEsd0JBQXdCO0lBQXJDO1FBQ0UsUUFBRyxHQUFZLEVBQUUsQ0FBQTtJQUNuQixDQUFDO0NBQUE7QUFGRCw0REFFQztBQUlELE1BQWEsa0JBQWtCO0lBUXRCLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBVztRQUMvQixNQUFNLFFBQVEsR0FBRyxJQUFJLGtCQUFrQixFQUFFLENBQUE7UUFDekMsUUFBUSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUE7UUFDbEIsUUFBUSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUE7UUFDekIsUUFBUSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUE7UUFFekIsT0FBTyxRQUFRLENBQUE7SUFDakIsQ0FBQztJQUVNLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBWSxFQUFFLElBQVk7UUFDdEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxrQkFBa0IsRUFBRSxDQUFBO1FBQ3pDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFBO1FBQ3hCLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1FBQ3BCLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1FBRXBCLE9BQU8sUUFBUSxDQUFBO0lBQ2pCLENBQUM7SUFFRDtRQXhCQSxTQUFJLEdBQXVCLFdBQVcsQ0FBQTtRQUN0QyxTQUFJLEdBQXVCLElBQUksQ0FBQTtRQUMvQixpQkFBWSxHQUFpQixFQUFFLENBQUE7UUFDL0IsZ0JBQVcsR0FBWSxFQUFFLENBQUE7SUFxQlYsQ0FBQztJQUVoQixrQkFBa0IsQ0FBQyxPQUFxQjtRQUN0QyxJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQTtRQUMzQixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxlQUFlLENBQUMs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