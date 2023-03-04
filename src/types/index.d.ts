import { RedisClient } from '../redis-for-cache'
import { LoggerPartial } from 'community-lib/interfaces'

export {}
declare global {
  namespace Express {
    interface Request {
      redisClient: RedisClient
      logger: LoggerPartial
    }
  }
}
