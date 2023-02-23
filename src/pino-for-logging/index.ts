import pino from 'pino'

const levels = {
  http: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60
}

const config = {
  prettyPrint: false,
  customLevels: levels,
  useOnlyCustomLevels: true,
  level: 'http'
}

export const pinoForLogging = pino(config)
