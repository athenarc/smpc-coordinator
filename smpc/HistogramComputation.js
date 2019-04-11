const Computation = require('./Computation')
const algorithms = require('../smpc-global/algorithms.json')
const attributes = require('../smpc-global/attributes.json')
const mapping = require('../smpc-global/mapping.json')

class HistogramComputation extends Computation {
  constructor (job) {
    super(job)
    this.state.dataInfo = {
      precision: 0.00001,
      sizeAlloc: 0,
      cellsX: null,
      cellsY: null,
      dataSize: 0
    }

    this.algorithms = algorithms[0]['histograms'].map(a => Object.keys(a)[0])
  }

  processDataInfo (info) {
    this.state.dataInfo.sizeAlloc += Number(info.sizeAlloc)
    this.state.dataInfo.dataSize += Number(info.dataSize)
    this.state.dataInfo.precision = Math.min(Number(info.precision))
    this.state.dataInfo.attributeToInt = info.attributeToInt
    this.state.dataInfo.intToAttribute = info.intToAttribute

    if (this.job.algorithm === '1d_categorical_histogram') {
      this.state.dataInfo.cellsX = Number(info.cellsX)
    }

    if (this.job.algorithm === '2d_mixed_histogram') {
      this.state.dataInfo.cellsX = Number(info.cellsX)
      this.state.dataInfo.cellsY = this.getNumericCell()
    }

    if (this.job.algorithm === '2d_categorical_histogram') {
      this.state.dataInfo.cellsX = Number(info.cellsX)
      this.state.dataInfo.cellsY = Number(info.cellsY)
    }

    if (this.job.algorithm === '1d_numerical_histogram') {
      this.state.dataInfo.cellsX = this.getNumericCell()
    }

    if (this.job.algorithm === '2d_numerical_histogram') {
      this.state.dataInfo.cellsX = this.getCell(this.job.attributes[0])
      this.state.dataInfo.cellsY = this.getCell(this.job.attributes[1])
    }
  }

  getNumericalAttribute () {
    return this.job.attributes.find(a => attributes.find(b => b.name === a.name && b.type === 'numerical'))
  }
  getCatecoricalAttribute () {
    return this.job.attributes.find(a => attributes.find(b => b.name === a.name && b.type === 'categorical'))
  }

  getNumericCell () {
    return this.getCell(this.getNumericalAttribute())
  }

  getCell (attr) {
    const defaultCells = Math.floor(this.state.dataInfo.dataSize / 10)
    const cells = attr.cells || defaultCells
    return Math.min(cells, defaultCells)
  }

  getMinMax (data) {
    const m = data.replace(/\s/g, '').split(',')
    return { min: Number(m[0]), max: Number(m[1]) }
  }

  construct2DArray (data, cellsX, cellsY) {
    let arr = []

    for (let i = 0; i < cellsX; i++) {
      arr.push([])
      for (let j = 0; j < cellsY; j++) {
        arr[i].push(0)
      }
    }

    for (let i = 0; i < data.length; i++) {
      let b = data[i].replace(/\s/g, '').split(',')
      arr[Number(b[0])][Number(b[1])] = b[2]
    }

    return arr
  }

  getAttributeNames (name) {
    return Object.keys(mapping[name])
  }

  computeAxisLabels (min, max, width, cells) {
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

  postProcess (data) {
    let results = data

    if (this.job.algorithm === '1d_categorical_histogram') {
      results = data.reduce((previous, current) => {
        const xy = current.replace(/\s/g, '').split(',')
        previous.y.push(Number(xy[1]))

        return previous
      }, { x: this.getAttributeNames(this.job.attributes[0].name), y: [] })
    }

    if (this.job.algorithm === '2d_mixed_histogram') {
      const m = this.getMinMax(data[0])
      data = data.slice(1)
      data = this.construct2DArray(data, this.state.dataInfo.cellsX, this.getNumericCell())
      let cells = Number(this.getNumericCell())

      results = { ...m, z: [...data], y: this.getAttributeNames(this.getCatecoricalAttribute().name), cells }
    }

    if (this.job.algorithm === '2d_categorical_histogram') {
      data = this.construct2DArray(data, this.state.dataInfo.cellsX, this.state.dataInfo.cellsY)
      results = { z: [...data], labels: { y: this.getAttributeNames(this.job.attributes[0].name), x: this.getAttributeNames(this.job.attributes[1].name) } }
    }

    if (this.job.algorithm === '1d_numerical_histogram') {
      const m = this.getMinMax(data[0])
      data = data.slice(1)
      results = { ...m, y: data.map(item => item.replace(/\s/g, '').split(',')[1]), cells: this.getCell(this.job.attributes[0]) }
    }

    if (this.job.algorithm === '2d_numerical_histogram') {
      const m0 = this.getMinMax(data[0])
      const m1 = this.getMinMax(data[1])
      let cellsX = this.getCell(this.job.attributes[0])
      let cellsY = this.getCell(this.job.attributes[1])

      data = data.slice(2)
      data = this.construct2DArray(data, cellsX, cellsY)
      results = { min: [m0.min, m1.min], max: [m0.max, m1.max], z: data, cellsX, cellsY }
    }

    return results
  }
}

module.exports = HistogramComputation
