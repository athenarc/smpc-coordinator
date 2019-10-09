const _ = require('lodash')
const crypto = require('crypto')

const { appEmitter } = require('./emitters.js')
const { status } = require('./config/constants')
const totalAttributes = require('./smpc-global/attributes.json')
const algorithms = require('./smpc-global/algorithms.json')
const mapping = require('../smpc-global/mapping.json')
const meshTerms = require('../smpc-global/meshTerms.json')

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

const constructJob = request => {
  return { ...request, timestamps: { accepted: Date.now() }, status: status.PENDING }
}

const getNumericalAttribute = (attributes) => {
  return attributes.find(a => attributes.find(b => b.name === a.name && b.type === 'numerical'))
}

const getCatecoricalAttribute = (attributes) => {
  return attributes.find(a => attributes.find(b => b.name === a.name && b.type === 'categorical'))
}

const getNumericCell = (attributes) => {
  return getCell(getNumericalAttribute(attributes))
}

const getCell = (attr) => {
  const defaultCells = Math.floor(this.state.dataInfo.dataSize / 10)
  const cells = attr.cells || defaultCells
  return Math.min(cells, defaultCells)
}

const getHistogramMinMax = (data) => {
  const m = data.replace(/\s/g, '').split(',')
  return { min: Number(m[0]), max: Number(m[1]) }
}

const fillHistogramArray = (x, y = 0, value = 0) => {
  if (y === 0) {
    return Array(x).fill(value)
  }

  return Array.from(Array(x), _ => Array(y).fill(value))
}

const constructHistogram2DArray = (data, cellsX, cellsY) => {
  let arr = fillHistogramArray(cellsX, cellsY)

  for (let i = 0; i < data.length; i++) {
    let b = data[i].replace(/\s/g, '').split(',')
    arr[Number(b[0])][Number(b[1])] = b[2]
  }

  return arr
}

const histogram2DArrayFromFlattenArray = (data, cellsX, cellsY) => {
  const y = Math.ceil(cellsY / cellsX)
  return _.chunk(data, y).map(arr => arr.map(i => i.replace(/\s/g, '').split(',')[1]))
}

const getAttributeNames = (mesh) => {
  // Take the vales of the childer of the attribute
  // Sort children by mapping number
  // Get only mesh term
  // Get mesh's term name
  return Object
    .entries(mapping[mesh])
    .sort((a, b) => a[1] - b[1])
    .map(t => t[0])
    .map(m => meshTerms[m].name)
}

const computeAxisLabels = (min, max, width, cells) => {
  let start = min
  let end = max
  const ticks = []
  for (const _ of Array(cells - 1).keys()) { // eslint-disable-line no-unused-vars
    end = start + width
    ticks.push(`[${start}, ${end})`)
    start = end
  }
  end = start + width
  ticks.push(`[${start}, ${end}]`)
  return ticks
}

module.exports = {
  getHistogramType,
  pack,
  unpack,
  sha256,
  updateJobStatus,
  constructJob,
  getNumericCell,
  getCell,
  getAttributeNames,
  getHistogramMinMax,
  constructHistogram2DArray,
  histogram2DArrayFromFlattenArray
}
