"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keeper = exports.getCachePool = void 0;
// import {Redis} from "ioredis"
const R = require("ramda");
const pool_1 = require("./pool");
const nilOrEmpty = (obj) => R.anyPass([R.isNil, R.isEmpty])(obj);
const createPool = (url) => {
    const ioRedisPoolOpts = pool_1.IORedisPoolOptions
        .fromUrl(url)
        // This accepts the RedisOptions class from ioredis as an argument
        // https://github.com/luin/ioredis/blob/master/lib/redis/RedisOptions.ts
        .withIORedisOptions({
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
    })
        // This accepts the Options class from @types/generic-pool as an argument
        // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/generic-pool/index.d.ts#L36
        .withPoolOptions({
        min: Number(process.env.KEEPER_POOL_MIN) || 2,
        max: Number(process.env.KEEPER_POOL_MAX) || 10,
    });
    return new pool_1.IORedisPool(ioRedisPoolOpts);
};
const availablePools = {};
const getCachePool = async (uri) => {
    if (availablePools[uri]) {
        // AppLoggers.info("cache --> found available connection for uri");
        return await availablePools[uri];
    }
    // AppLoggers.info("cache --> setting up new connection");
    const redisPool = createPool(uri);
    availablePools[uri] = redisPool;
    return redisPool;
};
exports.getCachePool = getCachePool;
const Keeper = (dat, cacheUri, keygen, fn) => async (...args) => {
    const cache = await (0, exports.getCachePool)(cacheUri);
    const cacheKey = keygen(args);
    const cacheResult = await cache.get(cacheKey);
    const expireTime = dat.options.expire;
    const ignoreCache = dat.options.ignoreCache;
    if (ignoreCache || nilOrEmpty(cacheResult)) {
        const result = await onCacheMiss({ cache, cacheKey, fn, expireTime }, ...args);
        return result;
    }
    if (dat.options.parseJSON) {
        return JSON.parse(cacheResult);
    }
    return cacheResult;
};
exports.Keeper = Keeper;
const onCacheMiss = async ({ cache, cacheKey, fn, expireTime }, ...args) => {
    const result = await fn.apply(fn, args);
    // cache if result is neither nil nor empty
    if (!nilOrEmpty(result)) {
        expireTime ?
            cache.setex(cacheKey, expireTime, JSON.stringify(result)) :
            cache.set(cacheKey, JSON.stringify(result));
    }
    return result;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VlcGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2tlZXBlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxnQ0FBZ0M7QUFDaEMsMkJBQTBCO0FBQzFCLGlDQUF5RDtBQUV6RCxNQUFNLFVBQVUsR0FBRyxDQUNqQixHQUFRLEVBQ2dDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUVqRixNQUFNLFVBQVUsR0FBRyxDQUFDLEdBQVcsRUFBRSxFQUFFO0lBQ2pDLE1BQU0sZUFBZSxHQUFHLHlCQUFrQjtTQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ2Isa0VBQWtFO1FBQ2xFLHdFQUF3RTtTQUN2RSxrQkFBa0IsQ0FBQztRQUNsQixhQUFhLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUN2QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDekMsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDO0tBRUYsQ0FBQztRQUNGLHlFQUF5RTtRQUN6RSxtR0FBbUc7U0FDbEcsZUFBZSxDQUFDO1FBQ2YsR0FBRyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7UUFDN0MsR0FBRyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUU7S0FDL0MsQ0FBQyxDQUFBO0lBQ0osT0FBTyxJQUFJLGtCQUFXLENBQUMsZUFBZSxDQUFDLENBQUE7QUFDekMsQ0FBQyxDQUFBO0FBR0QsTUFBTSxjQUFjLEdBQWdDLEVBQUUsQ0FBQztBQUNoRCxNQUFNLFlBQVksR0FBRyxLQUFLLEVBQUUsR0FBVyxFQUF3QixFQUFFO0lBQ3RFLElBQUksY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ3ZCLG1FQUFtRTtRQUNuRSxPQUFPLE1BQU0sY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2xDO0lBRUQsMERBQTBEO0lBQzFELE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNsQyxjQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsU0FBUyxDQUFDO0lBQ2hDLE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUMsQ0FBQztBQVZXLFFBQUEsWUFBWSxnQkFVdkI7QUFFSyxNQUFNLE1BQU0sR0FBRyxDQUNwQixHQUdDLEVBQ0QsUUFBZ0IsRUFDaEIsTUFBa0MsRUFDbEMsRUFBa0MsRUFDQSxFQUFFLENBQ3BDLEtBQUssRUFBRSxHQUFHLElBQUksRUFBRSxFQUFFO0lBQ2hCLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBQSxvQkFBWSxFQUFDLFFBQVEsQ0FBQyxDQUFBO0lBQzFDLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUM3QixNQUFNLFdBQVcsR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDN0MsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDckMsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUE7SUFFM0MsSUFBSSxXQUFXLElBQUksVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1FBQzFDLE1BQU0sTUFBTSxHQUFHLE1BQU0sV0FBVyxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQTtRQUM5RSxPQUFPLE1BQU0sQ0FBQTtLQUNkO0lBRUQsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtRQUN6QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFNLENBQUE7S0FDcEM7SUFDRCxPQUFRLFdBQTRCLENBQUE7QUFDdEMsQ0FBQyxDQUFBO0FBekJVLFFBQUEsTUFBTSxVQXlCaEI7QUFFSCxNQUFNLFdBQVcsR0FBRyxLQUFLLEVBQ3ZCLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFvRyxFQUNySSxHQUFHLElBQVcsRUFDZCxFQUFFO0lBQ0YsTUFBTSxNQUFNLEdBQUcsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUN2QywyQ0FBMkM7SUFDM0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUN2QixVQUFVLENBQUMsQ0FBQztZQUNWLEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7S0FDOUM7SUFDRCxPQUFPLE1BQU0sQ0FBQTtBQUNmLENBQUMsQ0FBQSJ9