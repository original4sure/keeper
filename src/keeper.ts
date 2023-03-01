import * as _Redis from "ioredis"
// import {Redis} from "ioredis"
import * as R from 'ramda'
import { CustomRedisConstructor, IORedisPool, IORedisPoolOptions } from "./pool";

const nilOrEmpty = (
  obj: any
): obj is null | undefined | [] | {} | "" => R.anyPass([R.isNil, R.isEmpty])(obj)

const createPool = (url: string, customRedisConstructor?: CustomRedisConstructor) => {
  const ioRedisPoolOpts = IORedisPoolOptions
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
    }, customRedisConstructor)
  return new IORedisPool(ioRedisPoolOpts)
}


const availablePools: Record<string, IORedisPool> = {};
export const getCachePool = async (uri: string, customRedisConstructor?: CustomRedisConstructor): Promise<IORedisPool> => {
  if (availablePools[uri]) {
    // AppLoggers.info("cache --> found available connection for uri");
    return await availablePools[uri];
  }

  // AppLoggers.info("cache --> setting up new connection");
  const redisPool = createPool(uri, customRedisConstructor);
  availablePools[uri] = redisPool;
  return redisPool;
};

export const Keeper = <T>(
  dat: {
    uri: string
    options: { parseJSON: boolean; expire: number, ignoreCache?: boolean, customRedisConstructor?: CustomRedisConstructor }
  },
  cacheUri: string,
  keygen: (...args: any[]) => string,
  fn: (...args: any[]) => Promise<T>
): ((...args: any[]) => Promise<T>) =>
  async (...args) => {
    const cachePool = await getCachePool(cacheUri, dat.options.customRedisConstructor)
    const cache = await cachePool.getConnection()
    const cacheKey = keygen(args)
    const cacheResult = await cache.get(cacheKey)
    const expireTime = dat.options.expire
    const ignoreCache = dat.options.ignoreCache

    if (ignoreCache || nilOrEmpty(cacheResult)) {
      const result = await onCacheMiss({ cache, cacheKey, fn, expireTime }, ...args)
      await cachePool.release(cache)
      return result
    }
    await cachePool.release(cache)

    if (dat.options.parseJSON) {
      return JSON.parse(cacheResult) as T
    }
    return (cacheResult as unknown) as T
  }

const onCacheMiss = async (
  { cache, cacheKey, fn, expireTime },
  ...args: any[]
) => {
  const result = await fn.apply(fn, args)
  // cache if result is neither nil nor empty
  if (!nilOrEmpty(result)) {
    expireTime ?
      cache.setex(cacheKey, expireTime, JSON.stringify(result)) :
      cache.set(cacheKey, JSON.stringify(result))
  }
  return result
}

