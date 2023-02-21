import * as redisCache from '..'

import { ClientLimited } from '..'

const redis = jest.requireActual<typeof redisCache>('..')

/**
 * CONSTANTS
 */
const SERVICE_NAME = 'test-redis-cache'
const ERROR_FOR_EMPTY_PARAMETER_VALUE = 'Invalid parameter value'
const key = 'test-key'
const keyValue = {
  id: 1,
  name: 'test-data'
}

const testConfig = {
  host: 'host',
  port: 1234,
  password: 'password'
}

/**
 * Spy instances to watch call to redisCache mocks
 */
let clientSpy: jest.SpyInstance
let getCacheSpy: jest.SpyInstance
let setCacheSpy: jest.SpyInstance
let removeCacheSpy: jest.SpyInstance

/**
 * MOCK IMPLEMENTATIONS
 */

/**
 *
 * @returns ClientTrimed object
 */
const clientImplmentation = (
  serviceName: string,
  config: redisCache.configType = testConfig,

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
        Promise.resolve<string | null>(JSON.stringify(keyValue))
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
  client: ClientLimited,
  key: string,
  value: string
) => {
  if (!client || !key || !value) {
    return Promise.reject<Error>(ERROR_FOR_EMPTY_PARAMETER_VALUE)
  }

  return Promise.resolve<undefined>(undefined)
}

/**
 *
 * @param client
 * @param key
 * @returns Promise<Error | string>
 */
const getCacheImplementation = (client: ClientLimited, key: string) => {
  if (!client || !key) {
    return Promise.reject<Error>(ERROR_FOR_EMPTY_PARAMETER_VALUE)
  }

  return Promise.resolve<string>(JSON.stringify(keyValue))
}

/**
 *
 * @param client
 * @param key
 * @returns Promise<Error | number>
 */
const removeCacheImplementation = (client: ClientLimited, key: string) => {
  if (!client || !key) {
    return Promise.reject<Error>(ERROR_FOR_EMPTY_PARAMETER_VALUE)
  }

  return Promise.resolve<number>(1)
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
  })

  test('test client creation with default params', () => {
    const _client = redis.cacheClient(SERVICE_NAME)

    expect(clientSpy).toHaveBeenCalled()
    expect(clientSpy).toHaveBeenCalledWith()
    expect(_client).not.toBeNull()
  })

  test('test retrieve from cache', async () => {
    const client = redis.cacheClient(SERVICE_NAME, testConfig)

    const data = await redis.getCache(client, key)

    expect(getCacheSpy).toHaveBeenCalled()
    expect(getCacheSpy).toHaveBeenCalledTimes(1)
    expect(getCacheSpy).toHaveBeenCalledWith(client, key)
    expect(data).toEqual(JSON.stringify(keyValue))
  })

  test('test retrieve from cache for empty key value', async () => {
    const client = redis.cacheClient(SERVICE_NAME, testConfig)

    const expected = ERROR_FOR_EMPTY_PARAMETER_VALUE
    await redis.getCache(client, '').catch(err => {
      expect(err).toBe(expected)
    })

    expect(getCacheSpy).toHaveBeenCalled()
    expect(getCacheSpy).toHaveBeenCalledWith(client, '')
  })

  test('test save data to cache', async () => {
    const client = redis.cacheClient(SERVICE_NAME, testConfig)

    const data = await redis.setCache(client, key, JSON.stringify(keyValue))

    expect(setCacheSpy).toHaveBeenCalled()
    expect(setCacheSpy).toHaveBeenCalledTimes(1)
    expect(setCacheSpy).toHaveBeenCalledWith(
      client,
      key,
      JSON.stringify(keyValue)
    )
    expect(data).toBeUndefined()
  })

  test('test save data to cache for empty key value', async () => {
    const client = redis.cacheClient(SERVICE_NAME, testConfig)

    const expected = ERROR_FOR_EMPTY_PARAMETER_VALUE
    await redis.setCache(client, '', JSON.stringify(keyValue)).catch(err => {
      expect(err).toBe(expected)
    })

    expect(setCacheSpy).toHaveBeenCalled()
    expect(setCacheSpy).toHaveBeenCalledWith(
      client,
      '',
      JSON.stringify(keyValue)
    )
  })

  test('test save data to cache for empty value data', async () => {
    const client = redis.cacheClient(SERVICE_NAME, testConfig)

    const expected = ERROR_FOR_EMPTY_PARAMETER_VALUE
    await redis.setCache(client, key, '').catch(err => {
      expect(err).toBe(expected)
    })

    expect(setCacheSpy).toHaveBeenCalled()
    expect(setCacheSpy).toHaveBeenCalledWith(client, key, '')
  })

  test('test remove data from cache', async () => {
    const client = redis.cacheClient(SERVICE_NAME, testConfig)

    const data = await redis.removeCache(client, key)

    expect(removeCacheSpy).toHaveBeenCalled()
    expect(removeCacheSpy).toHaveBeenCalledTimes(1)
    expect(removeCacheSpy).toHaveBeenCalledWith(client, key)
    expect(data).toBe(1)
  })

  test('test remove data from cache for empty key value', async () => {
    const client = redis.cacheClient(SERVICE_NAME, testConfig)

    const expected = ERROR_FOR_EMPTY_PARAMETER_VALUE
    await redis.removeCache(client, '').catch(err => {
      expect(err).toBe(expected)
    })

    expect(removeCacheSpy).toHaveBeenCalled()
    expect(removeCacheSpy).toHaveBeenCalledWith(client, '')
  })
})
