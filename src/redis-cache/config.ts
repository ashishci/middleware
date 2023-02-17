import * as dotenv from 'dotenv'

import path from 'path'

dotenv.config({ path: path.join(__dirname, '.env') })

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_TIMEOUT, REDIS_TTL } =
  process.env

const config = {
  host: REDIS_HOST || '0.0.0.0',
  port: Number(REDIS_PORT) || 6379,
  password: REDIS_PASSWORD || 'redisPassword',
  timeout: Number(REDIS_TIMEOUT) || 5000,
  ttl: Number(REDIS_TTL) || 30
}

export default config
