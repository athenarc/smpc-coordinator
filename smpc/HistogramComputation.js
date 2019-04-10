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
      this.state.dataInfo.cellsX = Number(info.cellsX) // Number(null) === 0
    }

    if (this.job.algorithm === '2d_mixed_histogram') {
      this.state.dataInfo.cellsX = Number(info.cellsX) // Number(null) === 0
      this.state.dataInfo.cellsY = this.getNumericCell()
    }

    if (this.job.algorithm === '2d_categorical_histogram') {
      this.state.dataInfo.cellsX = Number(info.cellsX) // Number(null) === 0
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

  getNumericCell () {
    return this.getCell(this.job.attributes.find(a => attributes.find(b => b.name === a.name && b.type === 'numerical')))
  }

  getCell (attr) {
    const defaultCells = Math.floor(this.state.dataInfo.dataSize / 10)
    const cells = attr.cells || defaultCells
    return Math.min(cells, defaultCells)
  }

  postProcess (data) {
    let results = data

    if (this.job.algorithm === '1d_categorical_histogram') {
      const attr = mapping[this.job.attributes[0].name]
      results = data.reduce((previous, current) => {
        const xy = current.replace(/\s/g, '').split(',')
        previous.x.push(Object.keys(attr).find(key => attr[key] === Number(xy[0])))
        previous.y.push(Number(xy[1]))

        return previous
      }, { x: [], y: [] })
    }

    if (this.job.algorithm === '2d_mixed_histogram') {

    }

    if (this.job.algorithm === '2d_categorical_histogram') {
    }

    if (this.job.algorithm === '1d_numerical_histogram') {
      const m = data[0].replace(/\s/g, '').split(',')
      data = data.slice(1)
      results = { mix: m[0], max: m[1], y: data.map(item => item.replace(/\s/g, '').split(',')[1]), cells: this.getCell(this.job.attributes[0]) }
    }

    if (this.job.algorithm === '2d_numerical_histogram') {
    }

    return results
  }
}

module.exports = HistogramComputation
