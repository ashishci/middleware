import * as redisForCache from '..'

import { ClientPartial, ConfigType } from '..'
import { NextFunction, Request, Response } from 'express'

const redis = jest.requireActual<typeof redisForCache>('..')

/**
 * CONSTANTS
 */
export const SERVICE_NAME = 'test-redis-cache'
export const ERROR_FOR_EMPTY_PARAMETER_VALUE = 'Invalid parameter value'
export const REQUEST_PATH = '/test/100'
export const KEY = 'test-key'
export const KEY_VALUE = {
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
let clientSpy: jest.SpyInstance
let getCacheSpy: jest.SpyInstance
let setCacheSpy: jest.SpyInstance
let removeCacheSpy: jest.SpyInstance
let cachedDataSpy: jest.SpyInstance
let emptyCacheDataSpy: jest.SpyInstance

/**
 * Objects holds the json result
 */
let responseResult = {}

/**
 * MOCK IMPLEMENTATIONS
 */

/**
 * Request MOCK
 * @returns Partial<Request>
 */
let mockRequest = () => {
  const req = {} as Partial<Request>
  req.path = REQUEST_PATH
  req.cacheClient = {
    redis: clientImplmentation(),
    name: SERVICE_NAME
  }
  return req
}

/**
 * Response MOCK
 * @returns Partial<Response>
 */
let mockResponse = () => {
  const res = {} as Partial<Response>
  res.json = jest.fn().mockImplementation(result => {
    responseResult = result
  })
  return res
}
/**
 * NextFunction MOCK
 */
let mockNext: NextFunction = jest.fn()

/**
 * MOCK IMPLEMENTATIONS
 */

/**
 *
 * @returns ClientTrimed object
 */
const clientImplmentation = (
  serviceName: string = SERVICE_NAME,
  config: ConfigType = TEST_CONFIG
) => {
  return {
    connect: jest.fn().mockImplementation(() => Promise.resolve()),

    disconnect: jest.fn().mockImplementation(() => Promise.resolve()),
    del: jest
      .fn()
      .mockImplementation(key => Promise.resolve<Error | number>(1)),
    get: jest
      .fn()
      .mockImplementation(key =>
        Promise.resolve<string | null>(JSON.stringify(KEY_VALUE))
      ),
    set: jest.fn().mockImplementation((key, value) => Promise.resolve()),
    expire: jest.fn().mockImplementation((key, second) => Promise.resolve()),
    on: jest.fn()
  }
}

/**
 *
 * @param client
 * @param key
 * @param value
 * @returns Promise<Error | undefined>
 */
const setCacheImplementation = (
  client: ClientPartial,
  key: string,
  value: string
) => {
  if (!client || !key || !value) {
    return Promise.reject<Error>(ERROR_FOR_EMPTY_PARAMETER_VALUE)
  }

  return Promise.resolve(undefined)
}

/**
 *
 * @param client
 * @param key
 * @returns Promise<Error | string>
 */
const getCacheImplementation = async (client: ClientPartial, key: string) => {
  if (!client || !key) {
    return Promise.reject<Error>(ERROR_FOR_EMPTY_PARAMETER_VALUE)
  }

  return Promise.resolve(JSON.stringify(KEY_VALUE))
}

/**
 *
 * @param client
 * @param key
 * @returns Promise<Error | number>
 */
const removeCacheImplementation = (client: ClientPartial, key: string) => {
  if (!client || !key) {
    return Promise.reject<Error>(ERROR_FOR_EMPTY_PARAMETER_VALUE)
  }

  return Promise.resolve<number>(1)
}

/**
 * cache data middleware that return data
 * @param req
 * @param res
 * @param next
 * @returns
 */
const cachedDataImplementation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const path = req.path.replaceAll('/', '-')
    const { redis, name } = req.cacheClient
    const key = `${name}${path}`

    const data = await getCacheImplementation(redis, key)
    if (data) {
      return res.json({ fromCache: true, data: data })
    } else {
      next()
    }
  } catch (e) {
    return res.json({
      error: (e as Error).message
    })
  }
}

/**
 * cache data middleware to test next
 * @param req
 * @param res
 * @param next
 * @returns
 */
const emptyCachedDataImplementation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let data: string | undefined
    if (data) {
      return res.json(JSON.stringify({ fromCache: true, data: data }))
    } else {
      next()
    }
  } catch (e) {
    return res.json({
      error: (e as Error).message
    })
  }
}

describe('testing redis cache', () => {
  beforeEach(() => {
    clientSpy = jest
      .spyOn(redis, 'cacheClient')
      .mockImplementation((serviceName, config) =>
        clientImplmentation(serviceName, config)
      )
    setCacheSpy = jest
      .spyOn(redis, 'setCache')
      .mockImplementation((client, key, value) =>
        setCacheImplementation(client, key, value)
      )
    getCacheSpy = jest
      .spyOn(redis, 'getCache')
      .mockImplementation((client, key) => getCacheImplementation(client, key))

    removeCacheSpy = jest
      .spyOn(redis, 'removeCache')
      .mockImplementation((client, key) =>
        removeCacheImplementation(client, key)
      )
    emptyCacheDataSpy = jest
      .spyOn(redis, 'cachedData')
      .mockImplementation((req, res, next) =>
        emptyCachedDataImplementation(req, res, next)
      )
  })

  test('test client creation with default params', () => {
    const _client = redis.cacheClient()

    expect(clientSpy).toHaveBeenCalled()
    expect(clientSpy).toHaveBeenCalledWith()
    expect(_client).not.toBeNull()
  })

  test('test save data to cache', async () => {
    const client = redis.cacheClient(SERVICE_NAME, TEST_CONFIG)

    const data = await redis.setCache(client, KEY, JSON.stringify(KEY_VALUE))

    expect(setCacheSpy).toHaveBeenCalled()
    expect(setCacheSpy).toHaveBeenCalledTimes(1)
    expect(setCacheSpy).toHaveBeenCalledWith(
      client,
      KEY,
      JSON.stringify(KEY_VALUE)
    )
    expect(data).toBeUndefined()
  })

  test('test save data to cache for empty key value to reject', async () => {
    const client = redis.cacheClient(SERVICE_NAME, TEST_CONFIG)

    const expected = ERROR_FOR_EMPTY_PARAMETER_VALUE

    await redis.setCache(client, '', JSON.stringify(KEY_VALUE)).catch(err => {
      expect(err).toMatch(expected)
    })

    expect(setCacheSpy).toHaveBeenCalled()
    expect(setCacheSpy).toHaveBeenCalledWith(
      client,
      '',
      JSON.stringify(KEY_VALUE)
    )
  })

  test('test save data to cache for empty value data is rejected', async () => {
    const client = redis.cacheClient(SERVICE_NAME, TEST_CONFIG)

    const expected = ERROR_FOR_EMPTY_PARAMETER_VALUE
    await redis.setCache(client, KEY, '').catch(err => {
      expect(err).toBe(expected)
    })

    expect(setCacheSpy).toHaveBeenCalled()
    expect(setCacheSpy).toHaveBeenCalledWith(client, KEY, '')
  })

  test('test retrieve from cache', async () => {
    const client = redis.cacheClient(SERVICE_NAME, TEST_CONFIG)

    const data = await redis.getCache(client, KEY)

    expect(getCacheSpy).toHaveBeenCalled()
    expect(getCacheSpy).toHaveBeenCalledTimes(1)
    expect(getCacheSpy).toHaveBeenCalledWith(client, KEY)
    expect(data).toEqual(JSON.stringify(KEY_VALUE))
  })

  test('test retrieve from cache for empty key value is rejected', async () => {
    const client = redis.cacheClient(SERVICE_NAME, TEST_CONFIG)

    const expected = ERROR_FOR_EMPTY_PARAMETER_VALUE
    await redis.getCache(client, '').catch(err => {
      expect(err).toBe(expected)
    })

    expect(getCacheSpy).toHaveBeenCalled()
    expect(getCacheSpy).toHaveBeenCalledWith(client, '')
  })

  test('test remove data from cache', async () => {
    const client = redis.cacheClient(SERVICE_NAME, TEST_CONFIG)

    const data = await redis.removeCache(client, KEY)

    expect(removeCacheSpy).toHaveBeenCalled()
    expect(removeCacheSpy).toHaveBeenCalledTimes(1)
    expect(removeCacheSpy).toHaveBeenCalledWith(client, KEY)
    expect(data).toBe(1)
  })

  test('test remove data from cache for empty key value is rejected', async () => {
    const client = redis.cacheClient(SERVICE_NAME, TEST_CONFIG)

    const expected = ERROR_FOR_EMPTY_PARAMETER_VALUE
    await redis.removeCache(client, '').catch(err => {
      expect(err).toBe(expected)
    })

    expect(removeCacheSpy).toHaveBeenCalled()
    expect(removeCacheSpy).toHaveBeenCalledWith(client, '')
  })

  test('test cacheData next is called', async () => {
    await redis.cachedData(
      mockRequest() as Request,
      mockResponse() as Response,
      mockNext
    )

    expect(emptyCacheDataSpy).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  test('test cacheData to return data from cache', async () => {
    cachedDataSpy = jest
      .spyOn(redis, 'cachedData')
      .mockImplementation((req, res, next) =>
        cachedDataImplementation(req, res, next)
      )

    await redis.cachedData(
      mockRequest() as Request,
      mockResponse() as Response,
      mockNext
    )

    const expected = {
      fromCache: true,
      data: JSON.stringify(KEY_VALUE)
    }

    expect(cachedDataSpy).toHaveBeenCalled()
    expect(responseResult).toEqual(expected)
  })
})
