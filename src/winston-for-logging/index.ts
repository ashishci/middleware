import { NextFunction, Request, Response } from 'express'
import { createLogger, exitOnError, transports } from 'winston'

import { LoggerPartial } from 'community-lib/interfaces'
import { loggerConfig } from './config'

/**
 * Resposible for creating logger instance
 * @param options
 * @returns
 */
const logger = (options: typeof loggerConfig = loggerConfig) => {
  const { file, console } = options

  const fileTransport = new transports.File(file)
  const consoleTransport = new transports.Console(console)

  const _logger = createLogger({
    transports: [fileTransport, consoleTransport],
    exitOnError: false
  })

  return _logger as LoggerPartial
}

/**
 * Attach winston partial logger extended Request property as a middleware
 * @returns
 */
export const loggingService = () => {
  const result = (req: Request, res: Response, next: NextFunction) => {
    if (!req.logger) {
      req.logger = logger()
    }

    next()
  }

  return result
}
