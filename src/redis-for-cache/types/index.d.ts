import { RedisClient } from '..'

export {}
declare global {
  namespace Express {
    interface Request {
      redisClient: RedisClient
    }
  }
}
