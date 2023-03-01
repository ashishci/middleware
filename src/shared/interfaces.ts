import { Logger } from 'winston'

export interface LoggerPartial {
  info: Logger['info']
  debug: Logger['debug']
  warn: Logger['warn']
  error: Logger['error']
}
