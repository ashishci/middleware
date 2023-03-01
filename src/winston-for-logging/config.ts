import appRoot from 'app-root-path'
import { format } from 'winston'

const config = {
  file: {
    level: 'info',
    filename: `${appRoot}/logs/app.log`,
    handleExceptions: true,
    maxsize: 5242880,
    maxFiles: 5,
    format: format.combine(format.timestamp(), format.simple())
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    format: format.combine(format.colorize(), format.simple())
  }
}

export default config
