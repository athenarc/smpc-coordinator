const uuidv4 = require('uuid/v4')
const winston = require('winston')
const _ = require('lodash')
const crypto = require('crypto')

const { HTTPError } = require('./errors')
const { status } = require('./config/constants')
const { db } = require('./db')

const totalAttributes = require('./attributes.json')

const createSimpleSMPCRouter = (router, path) => {
  const { addToQueue } = require('./queue')

  router.post(path, async (req, res, next) => {
    const results = validateRequest(req.body)

    if (!results.success) {
      next(new HTTPError(400, results.msg))
      return
    }

    const job = { attributes: req.body.attributes, filters: req.body.filters }

    try {
      const id = uuidv4()
      job.id = id
      job.status = status.PENDING
      const location = `/api/smpc/queue/${id}`

      res.set('Location', location)
      res.status(202).json({ location, id, status: status.properties[status.PENDING].msg })
      await db.put(id, { 'status': status.PENDING })
      addToQueue({ ...job })
    } catch (err) {
      next(err)
    }
  })

  return router
}
const totalAttributes = require('./smpc-global/attributes.json')
const algorithms = require('./smpc-global/algorithms.json')

const pack = (msg) => {
  return JSON.stringify(msg)
}

const unpack = (msg) => {
  return JSON.parse(msg)
}

const isAttribute = (attr) => {
  return attr.every(r => totalAttributes.some((a) => a.name === r.name))
}

const validateRequest = (req) => {
  if (!req.attributes || !_.isArray(req.attributes)) {
    return { success: false, msg: 'Bad request' }
  }

  if (req.attributes.length > 2) {
    return { success: false, msg: 'No more than two attributes are allowed' }
  }

  if (!isAttribute(req.attributes)) {
    return { success: false, msg: 'Bad request or attribute not found' }
  }

  if (req.attributes.length === 2 && req.attributes[0].name === req.attributes[1].name) {
    return { success: false, msg: 'Same attributes are not allowed' }
  }

  return { success: true }
}

const getHistogramType = (attr) => {
  let types = attr.map(a => totalAttributes.find((b) => b.name === a.name)).map(item => item.type).sort()

  let candidates = algorithms[0]['histograms'].filter((item) => Object.values(item)[0].attributes.length === types.length)

  let algorithm = candidates.find((item) => {
    let attr = item[Object.keys(item)[0]].attributes.sort()
    return _.difference(attr, types).length === 0
  })

  return algorithm
}

const sha256 = (data) => {
  const hash = crypto.createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

module.exports = {
  validateRequest,
  getHistogramType,
  pack,
  unpack,
  sha256
}
