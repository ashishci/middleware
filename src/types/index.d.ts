import { RedisClient } from '../redis-for-cache'
import { LoggerPartial } from '../shared/interfaces'

export {}
declare global {
  namespace Express {
    interface Request {
      redisClient: RedisClient
      logger: LoggerPartial
    }
  }
}
