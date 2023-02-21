import { RedisCacheClient } from '..'

export {}
declare global {
  namespace Express {
    interface Request {
      cacheClient: {
        redis: RedisCacheClient
        name: string
      }
    }
  }
}
