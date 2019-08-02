const _ = require('lodash')
const logger = require('../../config/winston')
const { status } = require('../../config/constants')

const meshTermsInversed = require('../../smpc-global/meshTermsInversed.json')

const { addJobToDB } = require('../../db')
const { addJobToQueue } = require('../../queue')
const validateHistogram = require('../../validators/histogram')
const { constructJob } = require('../../helpers')
const { processAttributes, processDataProviders, preprocess, cache } = require('../../middlewares')

class Node {
  constructor () {
    if (new.target === Node) {
      throw new TypeError('Cannot construct Abstract instances directly')
    }
  }

  connect () {
    throw new Error('connect: Implementation Missing!')
  }

  register () {
    throw new Error('register: Implementation Missing!')
  }

  async requestComputation (request) {
    try {
      const middlewares = [processAttributes, processDataProviders, validateHistogram, preprocess, cache]
      const { req } = this.runMiddlewares(middlewares, request)
      const job = constructJob(req.body)
      await addJobToDB({ ...job })
      await addJobToQueue({ ...job })
    } catch (e) {
      logger.error(e)
      const job = constructJob(request)
      job.id = request.studyID
      job.status = status.FAILED
      job.error = { message: e.message }
      await addJobToDB({ ...job })
    }
  }

  runMiddlewares (middlewares, job) {
    let index = 0
    const res = {}
    const req = { body: { ...job } }

    const next = (err) => {
      if (err instanceof Error) {
        throw err
      }

      index++

      if (index < middlewares.length) {
        middlewares[index](req, res, next)
      }
    }

    middlewares[index](req, res, next) // Run first middleware

    return { req, res }
  }

  normalizeRequest (request) {
    if (_.isArray(request)) {
      const keywords = new Set()
      const req = {}

      for (let record of request) {
        if (record.keywords && _.isArray(record.keywords)) {
          record.keywords.forEach(keywords.add, keywords)
        }
      }

      req.attributes = Array.from(keywords).filter(k => meshTermsInversed.hasOwnProperty(k)).map(k => meshTermsInversed[k].id)
      req.algorithm = req.attributes.length === 1 ? '1d_categorical_histogram' : '2d_categorical_histogram'
      return req
    }

    return request
  }

  log (message, level = 'info') {
    logger[level](`Blockchain: ${message}`)
  }

  catchError (err, method) {
    if (err instanceof SyntaxError) {
      logger.error(`Blockchain: ${method} JSON parse error`)
    } else {
      logger.error(`Blockchain: ${method}: error`, err)
    }
  }
}

module.exports = Node
