import { NextFunction, Request, Response } from 'express'

import config from './config'
import { createClient } from 'redis'
import { rejects } from 'assert'

const { host, port, password, ttl } = config

const SERVICE_NAME = 'redis-cache-client'
const ERROR_FOR_EMPTY_PARAMETER_VALUE = 'Invalid parameter value'

export type ConfigType = {
  host: string
  port: number
  password: string
}

export interface ClientPartial {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  del: (key: string) => Promise<Error | number>
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string) => Promise<string | null>
  expire: (key: string, seconds: number) => Promise<boolean>
  on: (eventName: string, listener: (err: Error | undefined) => void) => {}
}

export interface RedisClient {
  name: string
  redis: ClientPartial
}

const defaultConfig: ConfigType = {
  host: host,
  port: port,
  password: password
}

/**
 *
 * @param config
 * @param serviceName
 * @returns ClientTrimed
 */
const cacheClient = (
  serviceName: string = SERVICE_NAME,
  config: ConfigType = defaultConfig
): ClientPartial => {
  const { host, port, password } = config

  const _client = createClient({
    socket: {
      host: host,
      port: port
    },
    password: password
  })

  _client.on('Error', err => {
    console.error(err.message)
  })

  _client.on('connect', () => {
    console.info(
      `connected to redis at ${host}:${port} for service: ${serviceName}`
    )
  })

  _client.on('disconnect', () => {
    console.info(
      `disconnected from redis at ${host}:${port} for service: ${serviceName}`
    )
  })

  return _client as ClientPartial
}

/**
 * Creates label
 * @param name
 * @param path
 * @returns string
 */
const generateKey = (name: string, path: string) => {
  if (!name || !path) {
    throw new Error(ERROR_FOR_EMPTY_PARAMETER_VALUE)
  }
  path = path.replaceAll('/', '-')
  const key = `${name}${path}`
  return key
}

/**
 *
 * @param client
 * @param key
 * @returns Promise<string | Error | null>
 */
const readFromCache = async (client: ClientPartial, key: string) => {
  if (!key || !client) {
    return new Error(ERROR_FOR_EMPTY_PARAMETER_VALUE)
  }

  try {
    await client.connect()
    const cachedData = await client.get(key)
    await client.disconnect()

    if (cachedData) {
      return JSON.stringify(cachedData)
    }

    return cachedData
  } catch (e) {
    console.log('Redis error while getting cache', (e as Error).message)
    throw e as Error
  }
}

/**
 *
 * @param client
 * @param key
 * @returns Promise<number | Error>
 */
const removeFormCache = async (client: ClientPartial, key: string) => {
  if (!key || !client) {
    throw new Error(ERROR_FOR_EMPTY_PARAMETER_VALUE)
  }

  try {
    await client.connect()
    const result = await client.del(key)
    await client.disconnect()

    if (result) {
      console.info(`Removed ${key} from redis`)
    } else {
      console.log(`failed to remove ${key} from redis`)
    }

    return result
  } catch (e) {
    console.log('Redis error while getting cache', (e as Error).message)
    throw e as Error
  }
}

/**
 * Stores data in redis
 * @param client
 * @param key
 * @param path
 * @param value
 * @returns Promise<Error | undefined>
 */
export const writeToCache = async (
  client: ClientPartial,
  name: string,
  path: string,
  value: string
) => {
  if (!name || !path || !value || !client) {
    return new Error(ERROR_FOR_EMPTY_PARAMETER_VALUE)
  }

  try {
    await client.connect()
    const key = generateKey(name, path)
    const result = await client.set(key, JSON.stringify(value))
    await client.expire(key, ttl)
    await client.disconnect()

    if (result) {
      console.info(`Stored values for ${key} in redis`)
    } else {
      console.info(`Unable to stored values for ${key} in redis`)
    }
  } catch (e) {
    console.log('Redis eror while setting cache', (e as Error).message)
    throw e as Error
  }
}

/**
 * retrieve cahed data as response is exists
 * @param req
 * @param res
 * @param next
 * @returns
 */
export const getCachedData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, redis } = req.redisClient
    const key = generateKey(name, req.path)

    const data = await readFromCache(redis, key)
    if (data) {
      return res.status(200).json({
        fromCache: true,
        data: data
      })
    } else {
      next()
    }
  } catch (e) {
    return res.status(404).json({ error: (e as Error).message })
  }
}
/**
 * remove store data by key
 * @param req
 * @param res
 * @param next
 * @returns
 */
export const removeCachedData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, redis } = req.redisClient
    const key = generateKey(name, req.path)

    await readFromCache(redis, key).catch(() => next)

    next()
  } catch (e) {
    return res.status(404).json({ error: (e as Error).message })
  }
}

/**
 * Used with express  ie app.use(redisForCache(servicename))
 * @param serviceName
 * @param config
 * @returns redis-for-cache middleware client wrapper
 */
export const redisForCache = (serviceName: string, config?: ConfigType) => {
  const result = (req: Request, res: Response, next: NextFunction) => {
    if (!req.redisClient) {
      const redisClient: RedisClient = {
        name: serviceName,
        redis: config
          ? cacheClient(serviceName, config)
          : cacheClient(serviceName)
      }

      req.redisClient = redisClient
    }

    next()
  }

  return result
}
