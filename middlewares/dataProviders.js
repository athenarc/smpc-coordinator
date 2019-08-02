const _ = require('lodash')
const { HTTPError } = require('../errors')
const { clients } = require('../config')

const processDataProviders = (req, res, next) => {
  if (!req.body.dataProviders) {
    req.body.dataProviders = _.range(clients.length)
  }

  if (!_.isArray(req.body.dataProviders)) {
    next(new HTTPError(400, 'dataProviders: Bad request'))
    return
  }

  if (req.body.dataProviders.length === 0) {
    req.body.dataProviders = _.range(clients.length)
  }

  req.body.dataProviders = req.body.dataProviders.map(d => Number(d))

  if (!isDataProvider(req.body.dataProviders)) {
    next(new HTTPError(400, 'dataProviders: Values should be an integer and not exceed the number of supported clients.'))
    return
  }

  next()
}

const isDataProvider = providers => {
  return providers.every(p => _.isInteger(p) && clients.some(c => c.id === p))
}

module.exports = processDataProviders
