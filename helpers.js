const uuidv4 = require('uuid/v4')
const winston = require('winston')

const { db } = require('./db')
const { status } = require('./config/constants')

const createSimpleSMPCRouter = (router, path, smpc) => {
  router.get(path, async (req, res, next) => {
    try {
      const id = uuidv4()
      const location = `/api/smpc/queue/${id}`

      db.put(id, { 'status': status.PENDING })

      res.set('Location', location)
      res.status(202).json({ location, id, status: status.properties[status.PENDING].msg })

      smpc.execute()
    } catch (err) {
      next(err)
    }
  })

  return router
}

module.exports = {
  createSimpleSMPCRouter
}
