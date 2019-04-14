const redis = require('redis')
const { promisify } = require('util')
const client = redis.createClient()

const getAsync = promisify(client.get).bind(client)
const setExAsync = promisify(client.setex).bind(client)

const EXPIRATION = 60 * 60 * 24 // 1 day in seconds

client.on('error', (err) => {
  console.log(`Cache: Redis Error ${err}`)
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