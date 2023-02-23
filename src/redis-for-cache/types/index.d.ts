import { RedisClient } from '..'
import { Logger } from 'pino'

declare global {
  namespace Express {
    export interface Request {
      redisClient: RedisClient
      logger: Logger
    }

  }
}
