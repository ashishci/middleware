import express, { NextFunction, Request, Response } from 'express'

import { cacheClient } from './redis-for-cache'

const HOST = '0.0.0.0'
const PORT = 8080

const redisForCache = (req: Request, res: Response, next: NextFunction) => {
  const redisClient = {
    redis: cacheClient(),
    name: 'middleware'
  }
  next()
}

const app = express()
app.use(redisForCache)

app.get('/', (req, res) => {
  res.status(200).json({ data: 'I am alive' })
})

app.listen(PORT, HOST, () => {
  console.log(`listenting on ${HOST}:${PORT}`)
})
export {}
