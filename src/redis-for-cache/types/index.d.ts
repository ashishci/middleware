import { RedisClient } from '..'
import { Logger } from 'pino'

declare global {
  namespace Express {
    export interface Request {
      redisClient: RedisClient
      logger: Logger
      data: string
    }

    export interface Response {
      logger: Logger
    }
  }
}
