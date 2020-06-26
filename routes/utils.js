const { addJobToDB } = require('../db')
const { constructJob } = require('../helpers')
const { status } = require('../config/constants')
const { addJobToQueue } = require('../queue')

const createJobRouter = (router, path, middlewares, protocol) => {
  router.post(path, middlewares, async (req, res, next) => {
    // Consider making it a middlware in case the job desc is different among routes
    const job = constructJob(req.body)
    job.protocol = protocol

    try {
      /* TODO: Take results url from express */
      const location = `/api/queue/${job.id}`
      res.set('Location', location)
      res.status(202).json({ location, ...job, status: status.properties[status.PENDING].msg })

      await addJobToDB({ ...job })
      await addJobToQueue({ ...job })
    } catch (err) {
      job.status = status.FAILED
      next(err)
    }
  })

  return router
}

module.exports = {
  createJobRouter
}
