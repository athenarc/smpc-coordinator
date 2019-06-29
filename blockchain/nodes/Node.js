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
    const middlewares = [processAttributes, processDataProviders, validateHistogram, preprocess, cache]
    const { req } = this.runMiddlewares(middlewares, request)
    const job = constructJob(req.body)
    await addJobToDB({ ...job })
    await addJobToQueue({ ...job })
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
}

module.exports = Node
