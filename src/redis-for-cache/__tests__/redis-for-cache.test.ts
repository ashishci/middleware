import * as redisFor from '..'

import { ClientPartial, ConfigType } from '..'
import { NextFunction, Request, Response } from 'express'

import { LoggerPartial } from 'community-lib/interfaces'

const redis = jest.requireActual<typeof redisFor>('..')

/**
 * CONSTANTS
 */
const SERVICE_NAME = 'test-redis-cache'
const ERROR_FOR_EMPTY_PARAMETER_VALUE = 'Invalid parameter value'
const REQUEST_PATH = '/key'
const KEY = 'test-redis-cache-key'
const TTL = 60
const KEY_VALUE = {
  id: 1,
  name: 'test-data'
}

export const TEST_CONFIG = {
  host: 'host',
  port: 1234,
  password: 'password'
}

/**
 * Spy instances to watch call to redis-for-cache mocks
 */
let cachingServiceSpy: jest.SpyInstance
let writeToCacheSpy: jest.SpyInstance
let getCachedDataSpy: jest.SpyInstance
let getCachedDataReturnEmptySpy: jest.SpyInstance
let removeCachedDataSpy: jest.SpyInstance

/**
 * Objects holds the json result
 */
let resJson = {}

/**
 * MOCKS
 */

/**
 * Request MOCK
 * @returns Partial<Request>
 */
let requestMock = () => {
  const req = {} as Partial<Request>
  req.path = REQUEST_PATH
  req.redisClient = {
    name: SERVICE_NAME,
    redis: clientMock()
  }
  return req
}

/**
 * Response MOCK
 * @returns Partial<Response>
 */
let responseMock = () => {
  const res = {} as Partial<Response>
  res.json = jest.fn().mockImplementation(result => {
    resJson = result
  })
  res.status = jest.fn().mockImplementation(() => res)

  return res
}
/**
 * NextFunction MOCK
 */
let nextMock: NextFunction = jest.fn()

/**
 *
 * @returns ClientTrimed object
 */
const clientMock = (
  serviceName: string = SERVICE_NAME,
  config: ConfigType = TEST_CONFIG
) => {
  return {
    connect: jest.fn().mockImplementation(() => Promise.resolve()),

    disconnect: jest.fn().mockImplementation(() => Promise.resolve()),
    del: jest
      .fn()
      .mockImplementation(key => Promise.resolve<Error | number>(1)),
    get: jest.fn().mockImplementation(key => Promise.resolve(KEY_VALUE)),
    set: jest.fn().mockImplementation((key, value) => Promise.resolve()),
    expire: jest.fn().mockImplementation((key, second) => Promise.resolve()),
    on: jest.fn()
  }
}

/**
 * generates key used to store, retrieve and delete cached data
 * @param name
 * @param path
 * @returns stering
 */
const generateKeyMock = (name: string, path: string) => KEY

const loggerMock = () => {
  return {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}

/**
 *
 * @param client
 * @param name
 * @param path
 * @param value
 * @returns Promise<Error | undefined>
 */
const writeToCacheMock = async (
  client: ClientPartial,
  name: string,
  path: string,
  value: string,
  logger: LoggerPartial
) => {
  if (!client || !name || !path || !value || !logger) {
    return Promise.reject<Error>(ERROR_FOR_EMPTY_PARAMETER_VALUE)
  }

  const key = generateKeyMock(name, path)
  await client.connect()
  await client.set(key, value)
  await client.expire(key, TTL)
  await client.disconnect()

  return Promise.resolve(undefined)
}

/**
 * redis-for-cache middleware
 * @param serviceName
 * @param config
 * @returns function
 */
const cachingServiceMock = (serviceName: string, config?: ConfigType) => {
  const result = jest
    .fn()
    .mockImplementation((req: Request, res: Response, next: NextFunction) => {
      if (!req.redisClient) {
        req.redisClient = {
          name: serviceName,
          redis: config
            ? clientMock(serviceName, config)
            : clientMock(serviceName)
        }
      }

      next()
    })

  return result
}

/**
 *
 * @param client
 * @param key
 * @returns Promise<Error | string>
 */
const getCacheMock = async (client: ClientPartial, key: string) => {
  if (!client || !key) {
    return Promise.reject<Error>(ERROR_FOR_EMPTY_PARAMETER_VALUE)
  }

  await client.connect()
  const data = await client.get(key)
  await client.disconnect()

  return Promise.resolve(JSON.stringify(data))
}

/**
 *
 * @param client
 * @param key
 * @returns Promise<Error | number>
 */
const removeFromCacheMock = async (client: ClientPartial, key: string) => {
  if (!key || !client) {
    Promise.reject<Error>(ERROR_FOR_EMPTY_PARAMETER_VALUE)
  }

  try {
    await client.connect()
    const result = await client.del(key)
    await client.disconnect()

    return result
  } catch (e) {
    const message = `Redis error while removing data from cache with ${
      (e as Error).message
    }`
    throw new Error(message)
  }
}

/**
 * cache data middleware that return data
 * @param req
 * @param res
 * @param next
 * @returns
 */
const getCachedDataMock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const path = req.path
    const { redis, name } = req.redisClient
    const key = generateKeyMock(name, path)

    const data = await getCacheMock(redis, key)
    if (data) {
      return res.status(200).json({ fromCache: true, data: data })
    } else {
      next()
    }
  } catch (e) {
    return res.status(400).json({
      error: (e as Error).message
    })
  }
}
/**
 * Remove cached data
 * @param req
 * @param res
 * @param next
 * @returns
 */
const removeCachedDataMock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const path = req.path
  const { redis, name } = req.redisClient
  const key = generateKeyMock(name, path)

  await removeFromCacheMock(redis, key).catch(() => {
    next()
  })

  next()
}

/**
 * cache data middleware to test next
 * @param req
 * @param res
 * @param next
 * @returns
 */
const getCachedDataReturnEmptyMock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let data: string | undefined
    if (data) {
      return res
        .status(200)
        .json(JSON.stringify({ fromCache: true, data: data }))
    } else {
      next()
    }
  } catch (e) {
    return res.status(400).json({
      error: (e as Error).message
    })
  }
}

describe('redis-for middleware testing', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    writeToCacheSpy = jest
      .spyOn(redis, 'writeToCache')
      .mockImplementation((client, name, path, value, logger) =>
        writeToCacheMock(client, name, path, value, logger)
      )
    cachingServiceSpy = jest
      .spyOn(redis, 'cachingService')
      .mockImplementation((serviceName, config) =>
        cachingServiceMock(serviceName, config)
      )
    getCachedDataSpy = jest
      .spyOn(redis, 'getCachedData')
      .mockImplementation((req, res, next) => getCachedDataMock(req, res, next))
    removeCachedDataSpy = jest
      .spyOn(redis, 'removeCachedData')
      .mockImplementation((req, res, next) =>
        removeCachedDataMock(req, res, next)
      )
  })

  test('test caching service creation returns a function type', () => {
    const result = redis.cachingService(SERVICE_NAME, TEST_CONFIG)

    expect(cachingServiceSpy).toHaveBeenCalled()
    expect(cachingServiceSpy).toHaveBeenCalledWith(SERVICE_NAME, TEST_CONFIG)
  })

  test('test getCachedData respose is retiurned  when data is found', async () => {
    const req = requestMock() as Request
    const res = responseMock() as Response
    const next = nextMock

    await redis.getCachedData(req, res, next)

    const expected = {
      fromCache: true,
      data: JSON.stringify(KEY_VALUE)
    }

    expect(getCachedDataSpy).toHaveBeenCalled()
    expect(getCachedDataSpy).toHaveBeenCalledWith(req, res, next)
    expect(resJson).toEqual(expected)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(next).not.toHaveBeenCalled()
  })

  test('test next is called for getCacheData with empty data', async () => {
    getCachedDataReturnEmptySpy = jest
      .spyOn(redis, 'getCachedData')
      .mockImplementation((req, res, next) =>
        getCachedDataReturnEmptyMock(req, res, next)
      )

    const req = requestMock() as Request
    const res = responseMock() as Response
    const next = nextMock

    await redis.getCachedData(req, res, next)

    expect(getCachedDataReturnEmptySpy).toHaveBeenCalled()
    expect(getCachedDataReturnEmptySpy).toHaveBeenCalledWith(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  test('test next is called after cahed data for key is removed for removeCachedData', async () => {
    const req = requestMock() as Request
    const res = responseMock() as Response
    const next = nextMock

    await redis.removeCachedData(req, res, next)

    expect(removeCachedDataSpy).toHaveBeenCalled()
    expect(removeCachedDataSpy).toHaveBeenCalledWith(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  test('test storing data to redis cache', async () => {
    const client = clientMock(SERVICE_NAME, TEST_CONFIG)
    const logger = loggerMock()
    await redis.writeToCache(
      client,
      SERVICE_NAME,
      REQUEST_PATH,
      JSON.stringify(KEY_VALUE),
      logger
    )

    expect(writeToCacheSpy).toHaveBeenCalled()
    expect(writeToCacheSpy).toHaveBeenCalledWith(
      client,
      SERVICE_NAME,
      REQUEST_PATH,
      JSON.stringify(KEY_VALUE),
      logger
    )
  })
})
