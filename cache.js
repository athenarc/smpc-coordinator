const redis = require('redis')
const { REDIS_URL } = require('./config/constants')
const { promisify } = require('util')
const client = redis.createClient(REDIS_URL)
const logger = require('./config/winston')

const getAsync = promisify(client.get).bind(client)
const setExAsync = promisify(client.setex).bind(client)

const EXPIRATION = 60 * 60 * 24 * 30 // 30 day in seconds

client.on('error', (err) => {
  logger.error(`Cache: Redis Error ${err}`)
})

const getFromCache = async (key) => {
  const out = await getAsync(key)
  return out
}

const addToCache = async (key, value) => {
  await setExAsync(key, EXPIRATION, JSON.stringify(value))
}

module.exports = {
  getFromCache,
  addToCache
}
