import { NextFunction, Request, Response } from 'express'
import { createLogger, transports } from 'winston'

import { LoggerPartial } from '../shared/interfaces'
import config from './config'

const logger = (options: typeof config = config) => {
  const { file, console } = options
  const _logger = createLogger({
    transports: [new transports.File(file), new transports.Console(console)]
  })
  return _logger as LoggerPartial
}

const winstonForCache = () => {
  const result = (req: Request, res: Response, next: NextFunction) => {
    if (!req.logger) {
      req.logger = logger()
    }

    next()
  }

  return result
}

export default winstonForCache
