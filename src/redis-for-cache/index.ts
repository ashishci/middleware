import { NextFunction, Request, Response } from 'express'

import { Logger } from 'pino'
import config from './config'
import { createClient } from 'redis'
import { pinoForLogging } from '../pino-for-logging'

const { host, port, password, ttl } = config

const SERVICE_NAME = 'redis-cache-client'
const INVALID_PARAMETER_VALUE = 'Invalid parameter value'

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
  redis: ClientPartial
  name: string
  logger: Logger
}

const defaultConfig: ConfigType = {
  host: host,
  port: port,
  password: password
}

let message

/**
 * Redis client
 * @param config
 * @param serviceName
 * @returns ClientPartial object
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
    pinoForLogging.error(err.message)
  })

  _client.on('connect', () => {
    message = `connected to redis at ${host}:${port} for service: ${serviceName}`
    pinoForLogging.info(message)
  })

  _client.on('disconnect', () => {
    message = `disconnected from redis at ${host}:${port} for service: ${serviceName}`
    pinoForLogging.info(message)
  })

  return _client as ClientPartial
}

/**
 * Return json data from cache, if found
 * @param client
 * @param key
 * @param logger
 * @returns Promise<string | Error | null>
 */
const getCache = async (client: ClientPartial, key: string, logger: Logger) => {
  if (!key || !client) {
    logger.error(INVALID_PARAMETER_VALUE)
    return new Error(INVALID_PARAMETER_VALUE)
  }

  try {
    await client.connect()
    const cachedData = await client.get(key)
    await client.disconnect()

    if (cachedData) {
      message = `Retrieved cache data for ${key} from redis`
      logger.info(message)
      return JSON.stringify(cachedData)
    }

    return cachedData
  } catch (e) {
    message = `Redis returned error while retrieving cache data with message: ${
      (e as Error).message
    }`
    logger.error(message)
    throw e as Error
  }
}
/**
 * Creates label
 * @param name
 * @param path
 * @returns string
 */
export const getKeyLabel = (name: string, path: string) => {
  const key = `${name}${path}`
  return key
}

/**
 * Stores json data in redis
 * @param client
 * @param key
 * @param value
 * @param logger
 * @returns Promise<Error | undefined>
 */
export const setCache = async (
  client: ClientPartial,
  key: string,
  value: string,
  logger: Logger
) => {
  if (!key || !value || !client) {
    logger.error(INVALID_PARAMETER_VALUE)
    return new Error(INVALID_PARAMETER_VALUE)
  }

  try {
    await client.connect()

    const result = await client.set(key, JSON.stringify(value))
    await client.expire(key, ttl)
    await client.disconnect()

    if (result) {
      message = `Stored values for ${key} in redis`
      logger.info(message)
    } else {
      message = `Unable to stored values for ${key} in redis`
      logger.warn(message)
    }
  } catch (e) {
    message = `Redis failed while setting cache data with message ${
      (e as Error).message
    }`
    logger.error(message)
    throw e as Error
  }
}

/**
 * Removes key and data from redis
 * @param client
 * @param key
 * @param logger
 * @returns Promise<number | Error>
 */
const removeCache = async (
  client: ClientPartial,
  key: string,
  logger: Logger
) => {
  if (!key || !client) {
    logger.error(INVALID_PARAMETER_VALUE)
    return new Error(INVALID_PARAMETER_VALUE)
  }

  try {
    await client.connect()
    const result = await client.del(key)
    await client.disconnect()

    if (result) {
      message = `Removed ${key} from redis`
      logger.info(message)
    } else {
      message = `failed to remove ${key} from redis`
      logger.warn(message)
    }

    return result
  } catch (e) {
    message =
      'Redis error while removing from cache with message ${(e as Error).message}'
    logger.error(message)
    throw e as Error
  }
}

/**
 * Responsible for retieving cached data
 * @param req
 * @param res
 * @param next
 * @returns json data as a response for key, if found
 */
export const getCachedData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const path = req.path.replaceAll('/', '-')
  const { redis, name, logger } = req.redisClient
  const key = getKeyLabel(name, path)

  const data = await getCache(redis, key, logger).catch(() => next())

  if (data) {
    message = `data returned from cache for key ${key} to service: ${name}`
    logger.info(message)
    return res.status(200).json({
      fromCache: true,
      data: data
    })
  }
  next()
}

/**
 * Removed key from redis
 * @param req
 * @param res
 * @param next
 */
export const removeCachedData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const path = req.path.replaceAll('/', '-')
  const { redis, name, logger } = req.redisClient
  const key = getKeyLabel(name, path)

  await removeCache(redis, key, logger).catch(() => next())

  message = `removed cached data with key: ${key} for service: ${name}`
  logger.info(message)

  next()
}

/**
 * Used with express  ie app.use(redisForCache())
 * @param serviceName
 * @param config
 * @returns redis-for-cache middleware client wrapper
 */
export const redisForCache = (serviceName: string, config?: ConfigType) => {
  const result = (req: Request, res: Response, next: NextFunction) => {
    if (!req.redisClient) {
      const redisClient: RedisClient = {
        name: serviceName,
        redis: config ? cacheClient(serviceName, config) : cacheClient(),
        logger: pinoForLogging
      }

      req.redisClient = redisClient
    }

    next()
  }

  return result
}
