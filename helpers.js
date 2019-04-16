const _ = require('lodash')
const crypto = require('crypto')

const { appEmitter } = require('./emitters.js')
const totalAttributes = require('./smpc-global/attributes.json')
const algorithms = require('./smpc-global/algorithms.json')

const pack = (msg) => {
  return JSON.stringify(msg)
}

const unpack = (msg) => {
  return JSON.parse(msg)
}

const getHistogramType = (attr) => {
  let types = attr.map(a => totalAttributes.find((b) => b.name === a.name)).map(item => item.type).sort()
  let candidates = algorithms.filter((item) => item.attributes.length === types.length)

  let algorithm = candidates.find((item) => {
    let attr = item.attributes.sort()
    return _.difference(attr, types).length === 0
  })

  return algorithm
}

const sha256 = (data) => {
  const hash = crypto.createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

const updateJobStatus = (job, status) => {
  job.data.status = status
  appEmitter.emit('update-computation', { ...job.data })
}

module.exports = {
  getHistogramType,
  pack,
  unpack,
  sha256,
  updateJobStatus
}
