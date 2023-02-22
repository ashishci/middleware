import { ClientPartial } from '..'

export {}
declare global {
  namespace Express {
    interface Request {
      cacheClient: {
        redis: ClientPartial
        name: string
      }
    }
  }
}
