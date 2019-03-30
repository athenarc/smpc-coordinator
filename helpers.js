const uuidv4 = require('uuid/v4')
const winston = require('winston')

const { status } = require('./config/constants')
const { db } = require('./db')

const createSimpleSMPCRouter = (router, path) => {
  const { addToQueue } = require('./queue')

  router.post(path, async (req, res, next) => {
    try {
      const id = uuidv4()
      const location = `/api/smpc/queue/${id}`

      res.set('Location', location)
      res.status(202).json({ location, id, status: status.properties[status.PENDING].msg })

      await db.put(id, { 'status': status.PENDING })
      addToQueue({ id })
    } catch (err) {
      next(err)
    }
  })

  return router
}

const pack = (msg) => {
  return JSON.stringify(msg)
}

const unpack = (msg) => {
  return JSON.parse(msg)
}

module.exports = {
  createSimpleSMPCRouter,
  pack,
  unpack
}
