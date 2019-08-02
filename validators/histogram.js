const _ = require('lodash')
const { HTTPError } = require('../errors')
const totalAttributes = require('../smpc-global/attributes.json')
const algorithms = require('../smpc-global/algorithms.json')
const meshTerms = require('../smpc-global/meshTerms.json')
const meshAttributes = require('../smpc-global/meshAttributes.json')

const validateHistogram = (req, res, next) => {
  if (!req.body.algorithm) {
    next(new HTTPError(400, 'alogorithm: Bad request'))
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

  if (!isCorrectAttribute(req.body.attributes, req.body.algorithm)) {
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

  if (!isProperAlgorithm(req.body.algorithm, req.body.attributes)) {
    next(new HTTPError(400, 'Unsupported algorithm or wrong number of attributes for the selected algorithm'))
    return
  }

  next()
}

const isCorrectAttribute = (attr, algorithm) => {
  switch (algorithm) {
    case '1d_categorical_histogram':
    case '2d_categorical_histogram':
      return attr.every(a => !_.isEmpty(a) && meshTerms.hasOwnProperty(a.name))
    case '1d_numerical_histogram':
    case '2d_numerical_histogram':
      return attr.every(a => !_.isEmpty(a) && meshAttributes.find(m => a.name === m.mesh))
    case '2d_mixed_histogram':
      return attr.every(a => !_.isEmpty(a) && (meshTerms.hasOwnProperty(a.name) || meshAttributes.find(m => a.name === m.mesh)))
    default:
      return false
  }
}

const isAttribute = (attr) => { // eslint-disable-line no-unused-vars
  return attr.every(r => !_.isEmpty(r) && totalAttributes.some(a => a.name === r.name))
}

const isProperAlgorithm = (algo, attr) => {
  return algorithms.some(a => a.name === algo && a.attributes.length === attr.length)
}

module.exports = validateHistogram
