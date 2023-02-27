import { getCachedData, redisForCache, removeCachedData, writeToCache } from './redis-for-cache'

import express from 'express'

const HOST = '0.0.0.0'
const PORT = 8080

const app = express()
app.use(redisForCache('middleware'))

app.get('/', (req, res) => {
  res.status(200).json({ data: 'I am alive' })
})

app.post('/', (req, res) => {
  const data = {
    id: 1,
    value: 'some value'
  }

  const { redis, name } = req.redisClient

  writeToCache(redis, name, req.path, JSON.stringify(data))
  res.status(201).json({ id: 1 })
})

app.get('/test/:id', getCachedData, (req, res) => {
  const response = {
    fromCache: false,
    data: 'not from cache'
  }
  res.status(200).json(response)
})


app.delete('/test/:id', removeCachedData, (req, res) => {
  res.status(200).json()
})
