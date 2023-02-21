import { NextFunction as Next, Request, Response } from 'express'

import config from './config'
import { createClient } from 'redis'

const { host, port, password, ttl } = config

const SERVICE_NAME = 'redis-cache-client'

export type configType = {
  host: string
  port: number
  password: string
}

export interface ClientLimited {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  del: (key: string) => Promise<Error | number>
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string) => Promise<string | null>
  expire: (key: string, seconds: number) => Promise<boolean>
  on: (eventName: string, listener: (err: Error | undefined) => void) => {}
}

const defaultConfig: configType = {
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
export const cacheClient = (
  serviceName: string = SERVICE_NAME,
  config: configType = defaultConfig
): ClientLimited => {
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

  return _client as ClientLimited
}

/**
 *
 * @param client
 * @param key
 * @returns Promise<string | Error | null>
 */
export const getCache = async (client: ClientLimited, key: string) => {
  if (!key || !client) {
    return new Error('Invalid parameter value')
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
 * @param value
 * @returns Promise<Error | undefined>
 */
export const setCache = async (
  client: ClientLimited,
  key: string,
  value: string
) => {
  if (!key || !value || !client) {
    return new Error('Invalid parameter value')
  }

  try {
    await client.connect()

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
 *
 * @param client
 * @param key
 * @returns Promise<number | Error>
 */
export const removeCache = async (client: ClientLimited, key: string) => {
  if (!key || !client) {
    throw new Error('Invalid parameter value')
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

export const cachedData = async (req: Request, res: Response, next: Next) => {
  try {
    const path = req.path.replaceAll('/', '-')
    const { redis, name } = req.cacheClient
    const key = `${name}${path}`

    const data = await getCache(redis, key)

    res.status(200).send({
      fromCache: data ? true : false,
      data: data
    })
  } catch (e) {
    res.status(404).send({ error: (e as Error).message })
  }
}
