"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keeper = exports.getCachePool = void 0;
// import {Redis} from "ioredis"
const R = require("ramda");
const pool_1 = require("./pool");
const nilOrEmpty = (obj) => R.anyPass([R.isNil, R.isEmpty])(obj);
const createPool = (url, customRedisConstructor) => {
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
    }, customRedisConstructor);
    return new pool_1.IORedisPool(ioRedisPoolOpts);
};
const availablePools = {};
const getCachePool = async (uri, customRedisConstructor) => {
    if (availablePools[uri]) {
        // AppLoggers.info("cache --> found available connection for uri");
        return await availablePools[uri];
    }
    // AppLoggers.info("cache --> setting up new connection");
    const redisPool = createPool(uri, customRedisConstructor);
    availablePools[uri] = redisPool;
    return redisPool;
};
exports.getCachePool = getCachePool;
const Keeper = (dat, cacheUri, keygen, fn) => async (...args) => {
    const cachePool = await (0, exports.getCachePool)(cacheUri, dat.options.customRedisConstructor);
    const cache = await cachePool.getConnection();
    const cacheKey = keygen(args);
    const cacheResult = await cache.get(cacheKey);
    const expireTime = dat.options.expire;
    const ignoreCache = dat.options.ignoreCache;
    if (ignoreCache || nilOrEmpty(cacheResult)) {
        const result = await onCacheMiss({ cache, cacheKey, fn, expireTime }, ...args);
        await cachePool.release(cache);
        return result;
    }
    await cachePool.release(cache);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VlcGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2tlZXBlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxnQ0FBZ0M7QUFDaEMsMkJBQTBCO0FBQzFCLGlDQUFpRjtBQUVqRixNQUFNLFVBQVUsR0FBRyxDQUNqQixHQUFRLEVBQ2dDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUVqRixNQUFNLFVBQVUsR0FBRyxDQUFDLEdBQVcsRUFBRSxzQkFBK0MsRUFBRSxFQUFFO0lBQ2xGLE1BQU0sZUFBZSxHQUFHLHlCQUFrQjtTQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ2Isa0VBQWtFO1FBQ2xFLHdFQUF3RTtTQUN2RSxrQkFBa0IsQ0FBQztRQUNsQixhQUFhLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUN2QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDekMsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDO0tBRUYsQ0FBQztRQUNGLHlFQUF5RTtRQUN6RSxtR0FBbUc7U0FDbEcsZUFBZSxDQUFDO1FBQ2YsR0FBRyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7UUFDN0MsR0FBRyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUU7S0FDL0MsRUFBRSxzQkFBc0IsQ0FBQyxDQUFBO0lBQzVCLE9BQU8sSUFBSSxrQkFBVyxDQUFDLGVBQWUsQ0FBQyxDQUFBO0FBQ3pDLENBQUMsQ0FBQTtBQUdELE1BQU0sY0FBYyxHQUFnQyxFQUFFLENBQUM7QUFDaEQsTUFBTSxZQUFZLEdBQUcsS0FBSyxFQUFFLEdBQVcsRUFBRSxzQkFBK0MsRUFBd0IsRUFBRTtJQUN2SCxJQUFJLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUN2QixtRUFBbUU7UUFDbkUsT0FBTyxNQUFNLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNsQztJQUVELDBEQUEwRDtJQUMxRCxNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLHNCQUFzQixDQUFDLENBQUM7SUFDMUQsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQztJQUNoQyxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDLENBQUM7QUFWVyxRQUFBLFlBQVksZ0JBVXZCO0FBRUssTUFBTSxNQUFNLEdBQUcsQ0FDcEIsR0FHQyxFQUNELFFBQWdCLEVBQ2hCLE1BQWtDLEVBQ2xDLEVBQWtDLEVBQ0EsRUFBRSxDQUNwQyxLQUFLLEVBQUUsR0FBRyxJQUFJLEVBQUUsRUFBRTtJQUNoQixNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUEsb0JBQVksRUFBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO0lBQ2xGLE1BQU0sS0FBSyxHQUFHLE1BQU0sU0FBUyxDQUFDLGFBQWEsRUFBRSxDQUFBO0lBQzdDLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUM3QixNQUFNLFdBQVcsR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDN0MsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDckMsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUE7SUFFM0MsSUFBSSxXQUFXLElBQUksVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1FBQzFDLE1BQU0sTUFBTSxHQUFHLE1BQU0sV0FBVyxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQTtRQUM5RSxNQUFNLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDOUIsT0FBTyxNQUFNLENBQUE7S0FDZDtJQUNELE1BQU0sU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUU5QixJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1FBQ3pCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQU0sQ0FBQTtLQUNwQztJQUNELE9BQVEsV0FBNEIsQ0FBQTtBQUN0QyxDQUFDLENBQUE7QUE1QlUsUUFBQSxNQUFNLFVBNEJoQjtBQUVILE1BQU0sV0FBVyxHQUFHLEtBQUssRUFDdkIsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFDbkMsR0FBRyxJQUFXLEVBQ2QsRUFBRTtJQUNGLE1BQU0sTUFBTSxHQUFHLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDdkMsMkNBQTJDO0lBQzNDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDdkIsVUFBVSxDQUFDLENBQUM7WUFDVixLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO0tBQzlDO0lBQ0QsT0FBTyxNQUFNLENBQUE7QUFDZixDQUFDLENBQUEifQ==