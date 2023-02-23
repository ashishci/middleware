import {
  getCachedData,
  getKeyLabel,
  redisForCache,
  removeCachedData,
  setCache
} from './redis-for-cache'

import express from 'express'

const HOST = '0.0.0.0'
const PORT = 8080

const app = express()
app.use(redisForCache('middleware-main'))

app.get('/', (req, res) => {
  res.status(200).json({ data: 'I am alive' })
})

app.get('/test/:id', getCachedData, (req, res) => {
  const response = {
    fromCache: false,
    data: 'not from cache'
  }
  res.status(200).json(response)
})

app.post('/test', (req, res) => {
  const data = {
    id: 100,
    value: 'some random value'
  }

  const { redis, name, logger } = req.redisClient
  const key = getKeyLabel(name, req.path)
  setCache(redis, key, JSON.stringify(data), logger)

  res.status(201).json()
})

app.delete('/test/:id', removeCachedData, (req, res) => {
  res.status(200).json()
})

app.listen(PORT, HOST, () => {
  console.log(`listenting on ${HOST}:${PORT}`)
})
