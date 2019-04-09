const express = require('express')
const uuidv4 = require('uuid/v4')

const { db, cachedb } = require('../db')
const { status } = require('../config/constants')
const { HTTPError } = require('../errors')
const { validateRequest, getHistogramType, sha256 } = require('../helpers')
const { addJob } = require('../queue')

let router = express.Router()

const createSimpleSMPCRouter = (router, path) => {
  router.post(path, async (req, res, next) => {
    const results = validateRequest(req.body)

    if (!results.success) {
      next(new HTTPError(400, results.msg))
      return
    }

    let algorithm = getHistogramType(req.body.attributes)
    algorithm = Object.keys(algorithm)[0]

    if (algorithm === undefined) {
      next(new HTTPError(400, results.msg))
      return
    }

    const job = { attributes: req.body.attributes, filters: req.body.filters, algorithm }

    try {
      const id = uuidv4()
      job.id = id
      job.status = status.PENDING

      const location = `/api/smpc/queue/${id}`
      res.set('Location', location)
      res.status(202).json({ location, id, status: status.properties[status.PENDING].msg, algorithm })

      const { status: _status, id: _id, ...rest } = job
      await db.put(id, { ...job })
      await cachedb.put(sha256(JSON.stringify({ ...rest })), { ...rest, id: _id, status: _status })

      addJob({ ...job })
    } catch (err) {
      next(err)
    }
  })

  return router
}

router.get('/queue/:id', async (req, res, next) => {
  try {
    let value = await db.get(req.params.id)

    if (value.status !== status.COMPLETED) {
      return res.status(200).json({
        status: status.properties[value.status].msg,
        id: req.params.id
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

router.get('/results/:id', async (req, res, next) => {
  try {
    let value = await db.get(req.params.id)

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

  res.status(200).json()
})

router = createSimpleSMPCRouter(router, '/histogram')

module.exports = router
