const _ = require('lodash')
const { HTTPError } = require('../errors')
const totalAttributes = require('../smpc-global/attributes.json')
const { getHistogramType } = require('../helpers')
const meshTerms = require('../smpc-global/meshTerms.json')

const validateHistogram = (req, res, next) => {
  if (!req.body.attributes || !_.isArray(req.body.attributes)) {
    next(new HTTPError(400, 'Bad request'))
    return
  }

  if (req.body.attributes.length === 0) {
    next(new HTTPError(400, 'At least one attribute should be provided'))
    return
  }

  if (req.body.attributes.length > 2) {
    next(new HTTPError(400, 'No more than two attributes are allowed'))
    return
  }

  if (!isMeshTerm(req.body.attributes)) {
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

  if (algorithm === undefined || algorithm.name === undefined) {
    next(new HTTPError(400, 'Unsupported algorithm'))
    return
  }

  next()
}

const isMeshTerm = (attr) => {
  return attr.every(a => !_.isEmpty(a) && meshTerms.hasOwnProperty(a.name))
}

const isAttribute = (attr) => { // eslint-disable-line no-unused-vars
  return attr.every(r => !_.isEmpty(r) && totalAttributes.some(a => a.name === r.name))
}

module.exports = validateHistogram
