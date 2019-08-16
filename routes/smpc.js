const express = require('express')
const contentDisposition = require('content-disposition')

const { addJobToDB, getJob } = require('../db')
const { constructJob } = require('../helpers')
const { status } = require('../config/constants')
const { HTTPError } = require('../errors')
const { addJobToQueue } = require('../queue')
const validateHistogram = require('../validators/histogram')
const { processAttributes, processDataProviders, preprocess, cache } = require('../middlewares')
const auth = require('../auth')

let router = express.Router()

const createSimpleSMPCRouter = (router, path, middlewares) => {
  router.post(path, middlewares, async (req, res, next) => {
    const job = constructJob(req.body)

    try {
      const location = `/api/smpc/queue/${job.id}`
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

router.get('/queue/:id', [auth.authenticate], async (req, res, next) => {
  try {
    let value = await getJob(req.params.id)

    if (value.status !== status.COMPLETED) {
      return res.status(200).json({
        ...value,
        status: status.properties[value.status].msg
      })
    }

    const location = `/api/smpc/results/${req.params.id}`

    res.set('Location', location)
    return res.status(303).json({ location })
  } catch (err) {
    if (err.notFound) {
      next(new HTTPError(404, 'Not found'))
    }

    next(err)
  }
})

router.get('/results/:id', [auth.authenticate], async (req, res, next) => {
  try {
    let value = await getJob(req.params.id)

    return res.status(200).json({
      ...value,
      status: status.properties[value.status].msg
    })
  } catch (err) {
    if (err.notFound) {
      next(new HTTPError(404, 'Not found'))
    }

    next(err)
  }
})

router.get('/:id/download', [], async (req, res, next) => {
  try {
    let value = await getJob(req.params.id)
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': contentDisposition(`${req.params.id}.json`)
    })
    res.status(200).send(JSON.stringify({
      ...value,
      status: status.properties[value.status].msg
    }, null, 4))
  } catch (err) {
    if (err.notFound) {
      next(new HTTPError(404, 'Not found'))
    }

    next(err)
  }
})

router = createSimpleSMPCRouter(
  router,
  '/histogram',
  [auth.authenticate, processAttributes, processDataProviders, validateHistogram, preprocess, cache]
)

module.exports = router
