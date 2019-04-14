const _ = require('lodash')
const { HTTPError } = require('../errors')
const totalAttributes = require('../smpc-global/attributes.json')
const { getHistogramType } = require('../helpers')

const validateHistogram = (req, res, next) => {
  if (!req.body.attributes || !_.isArray(req.body.attributes)) {
    next(new HTTPError(400, 'Bad request'))
    return
  }

  if (req.body.attributes.length > 2) {
    next(new HTTPError(400, 'No more than two attributes are allowed'))
    return
  }

  if (!isAttribute(req.body.attributes)) {
    next(new HTTPError(400, 'Bad request or attribute not found'))
    return
  }

  if (req.body.attributes.length === 2 && req.body.attributes[0].name === req.body.attributes[1].name) {
    next(new HTTPError(400, 'Same attributes are not allowed'))
    return
  }

  for (let attr of req.body.attributes) {
    if (attr.cells && attr.cells <= 0) {
      next(new HTTPError(400, 'Cell must be a positive number'))
      return
    }
  }

  let algorithm = getHistogramType(req.body.attributes)
  algorithm = Object.keys(algorithm)[0]

  if (algorithm === undefined) {
    next(new HTTPError(400, 'Unsupported algorithm'))
    return
  }

  next()
}

const isAttribute = (attr) => {
  for (const a of attr) {
    if (_.isEmpty(a)) {
      return false
    }
  }

  return attr.every(r => totalAttributes.some((a) => a.name === r.name))
}

module.exports = validateHistogram
