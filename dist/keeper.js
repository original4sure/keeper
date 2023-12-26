"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keeper = exports.getCachePool = exports.availablePools = void 0;
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
        acquireTimeoutMillis: Number(process.env.KEEPER_ACQUIRE_TIMEOUT) || 1000,
        maxWaitingClients: Number(process.env.KEEPER_MAX_WAITING) || 300
    });
    return new pool_1.IORedisPool(ioRedisPoolOpts);
};
exports.availablePools = {};
exports.getCachePool = async (uri) => {
    if (exports.availablePools[uri]) {
        // AppLoggers.info("cache --> found available connection for uri");
        return await exports.availablePools[uri];
    }
    // AppLoggers.info("cache --> setting up new connection");
    const redisPool = createPool(uri);
    exports.availablePools[uri] = redisPool;
    return redisPool;
};
exports.Keeper = (options, cacheUri, keygen, fn) => async (...args) => {
    const cache = await exports.getCachePool(cacheUri);
    const cacheKey = keygen(args);
    const cacheResult = await cache.get(cacheKey);
    const expireTime = options.expire;
    const ignoreCache = options.ignoreCache;
    if (ignoreCache || nilOrEmpty(cacheResult)) {
        const result = await onCacheMiss({ cache, cacheKey, fn, expireTime }, ...args);
        return result;
    }
    if (options.parseJSON) {
        return JSON.parse(cacheResult);
    }
    return cacheResult;
};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VlcGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2tlZXBlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxnQ0FBZ0M7QUFDaEMsMkJBQTBCO0FBQzFCLGlDQUF5RDtBQUV6RCxNQUFNLFVBQVUsR0FBRyxDQUNqQixHQUFRLEVBQ2dDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUVqRixNQUFNLFVBQVUsR0FBRyxDQUFDLEdBQVcsRUFBRSxFQUFFO0lBQ2pDLE1BQU0sZUFBZSxHQUFHLHlCQUFrQjtTQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ2Isa0VBQWtFO1FBQ2xFLHdFQUF3RTtTQUN2RSxrQkFBa0IsQ0FBQztRQUNsQixhQUFhLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUN2QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDekMsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDO0tBRUYsQ0FBQztRQUNGLHlFQUF5RTtRQUN6RSxtR0FBbUc7U0FDbEcsZUFBZSxDQUFDO1FBQ2YsR0FBRyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7UUFDN0MsR0FBRyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUU7UUFDOUMsb0JBQW9CLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsSUFBSSxJQUFJO1FBQ3hFLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLElBQUksR0FBRztLQUNqRSxDQUFDLENBQUE7SUFDSixPQUFPLElBQUksa0JBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQTtBQUN6QyxDQUFDLENBQUE7QUFHWSxRQUFBLGNBQWMsR0FBZ0MsRUFBRSxDQUFDO0FBQ2pELFFBQUEsWUFBWSxHQUFHLEtBQUssRUFBRSxHQUFXLEVBQXdCLEVBQUU7SUFDdEUsSUFBSSxzQkFBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ3ZCLG1FQUFtRTtRQUNuRSxPQUFPLE1BQU0sc0JBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNsQztJQUVELDBEQUEwRDtJQUMxRCxNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbEMsc0JBQWMsQ0FBQyxHQUFHLENBQUMsR0FBRyxTQUFTLENBQUM7SUFDaEMsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQyxDQUFDO0FBRVcsUUFBQSxNQUFNLEdBQUcsQ0FDcEIsT0FBc0UsRUFDdEUsUUFBZ0IsRUFDaEIsTUFBa0MsRUFDbEMsRUFBa0MsRUFDQSxFQUFFLENBQ3BDLEtBQUssRUFBRSxHQUFHLElBQUksRUFBRSxFQUFFO0lBQ2hCLE1BQU0sS0FBSyxHQUFHLE1BQU0sb0JBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUMxQyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDN0IsTUFBTSxXQUFXLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0lBQzdDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDakMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQTtJQUV2QyxJQUFJLFdBQVcsSUFBSSxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUU7UUFDMUMsTUFBTSxNQUFNLEdBQUcsTUFBTSxXQUFXLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFBO1FBQzlFLE9BQU8sTUFBTSxDQUFBO0tBQ2Q7SUFFRCxJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUU7UUFDckIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBTSxDQUFBO0tBQ3BDO0lBQ0QsT0FBUSxXQUE0QixDQUFBO0FBQ3RDLENBQUMsQ0FBQTtBQUVILE1BQU0sV0FBVyxHQUFHLEtBQUssRUFDdkIsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQW9HLEVBQ3JJLEdBQUcsSUFBVyxFQUNkLEVBQUU7SUFDRixNQUFNLE1BQU0sR0FBRyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQ3ZDLDJDQUEyQztJQUMzQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ3ZCLFVBQVUsQ0FBQyxDQUFDO1lBQ1YsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtLQUM5QztJQUNELE9BQU8sTUFBTSxDQUFBO0FBQ2YsQ0FBQyxDQUFBIn0=