const uuidv4 = require('uuid/v4')
const { getFromCache } = require('../cache')
const { sha256 } = require('../helpers')
const { getJob, addJobToDB } = require('../db')
const logger = require('../config/winston')

const cache = async (req, res, next) => {
  const { id: _id, ...rest } = req.body
  const key = sha256(JSON.stringify(rest))

  try {
    let cacheRes = await getFromCache(key)

    if (cacheRes) { // cache hit
      cacheRes = JSON.parse(cacheRes)
      const dbRes = await getJob(cacheRes.id)
      const newID = uuidv4()
      await addJobToDB({ ...dbRes, id: newID, timestamps: { accepted: Date.now(), done: Date.now() }, fromCache: true })

      const location = `/api/smpc/results/${newID}`

      res.set('Location', location)
      return res.status(303).json({ location, ...cacheRes })
    } else { // cache miss
      next()
    }
  } catch (e) {
    logger.error(`Cache error: ${e}`)
  }

  next()
}

module.exports = cache
