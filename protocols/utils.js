const _ = require('lodash')
const mapping = require('../smpc-global/mapping.json')
const meshTerms = require('../smpc-global/meshTerms.json')

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
  getNumericCell,
  getCell,
  getAttributeNames,
  getHistogramMinMax,
  constructHistogram2DArray,
  histogram2DArrayFromFlattenArray
}
