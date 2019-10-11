const Protocol = require('./Protocol')
const logger = require('../config/winston')
const { step } = require('../config')
const {
  pack,
  unpack,
  getNumericCell,
  getCell,
  getAttributeNames,
  getHistogramMinMax,
  constructHistogram2DArray,
  histogram2DArrayFromFlattenArray,
  getCatecoricalAttribute
} = require('./helpers')

class HistogramProtocol extends Protocol {
  constructor (job) {
    super({ job, name: 'historgram' })

    this.state = {
      dataInfoReceived: 0,
      compiled: 0,
      listen: 0,
      import: 0,
      exit: 0,
      step: step.INIT,
      results: '',
      dataInfo: {
        precision: 0.00001,
        sizeAlloc: 0,
        cellsX: null,
        cellsY: null,
        dataSize: 0
      }
    }
  }

  _execute () {
    this._register()
    logger.info('Initiating SMPC Engine...')
    logger.info(`Total Clients: ${this.job.data.totalClients}`)
    this.job.reportProgress(0) // Next release will inlude the feature to pass arbitrary data in reportProgress
    // this.job.reportProgress({ step: this.state.step }) // Next release will inlude the feature to pass arbitrary data in reportProgress
  }

  _register () {
    this.emitter.on('data-info-received', (msg) => this._eventMiddleware('data-info-received', msg, this.handleDataInfo.bind(this)))
    this.emitter.on('compilation-ended', (msg) => this._eventMiddleware('compilation-ended', msg, this.handleCompilation.bind(this)))
    this.emitter.on('listen', (msg) => this._eventMiddleware('listen', msg, this.listen.bind(this)))
    this.emitter.on('exit', (msg) => this._eventMiddleware('exit', msg, this.handleExit.bind(this)))
    this.emitter.on('computation-finished', (msg) => this._eventMiddleware('computation-finished', msg, this.handleComputationFinished.bind(this)))
    this.emitter.on('importation-finished', (msg) => this._eventMiddleware('importation-finished', msg, this.handleImportationFinished.bind(this)))
  }

  _eventMiddleware (event, msg, next) {
    if (msg.data) {
      if (msg.data.errors && msg.data.errors.length > 0) {
        return this.handleError({ err: new Error(msg) })
      }

      if (msg.data.code && msg.data.code !== 0) {
        return this.handleError({ err: new Error(msg) })
      }
    }

    next(msg)
  }

  handleOpen ({ ws, entity }) {
    if (entity.type === 'player') {
      logger.info(`Connected to player ${entity.id}.`)
      ws.send(pack({ message: 'job-info', job: this.job.data }))
    }

    if (entity.type === 'client') {
      logger.info(`Connected to client ${entity.id}.`)
      ws.send(pack({ message: 'job-info', job: this.job.data }))
      ws.send(pack({ message: 'data-info', job: this.job.data }))
    }
  }

  handleClose ({ ws, code, reason, entity }) {
    if (entity.type === 'player') {
      logger.info(`Disconnected from player ${entity.id}.`)
      this.players[ws._index].socket = null

      if (this.state.step < step.COMPUTATION_END) {
        this.restart()
        this.reject(new Error(`Player ${entity.id} closed before the end of the computation. Reason: ${reason}`))
      }
    }

    if (entity.type === 'client') {
      logger.info(`Disconnected from client ${entity.id}.`)
      this.clients[ws._index].socket = null
      if (this.state.step < step.IMPORT_END) {
        this.restart()
        this.reject(new Error(`Client ${entity.id} closed before the end of the importation. Reason: ${reason}`))
      }
    }
  }

  handleError ({ ws, err, entity }) {
    logger.error(err)
    this.restart()
    this.reject(new Error('An error has occured!'))
  }

  handleMessage ({ ws, msg, entity }) {
    msg = unpack(msg)
    switch (msg.message) {
      case 'data-info':
        this.emitter.emit('data-info-received', { entity, ws, msg })
        break
      case 'compilation-ended':
        this.emitter.emit('compilation-ended', { entity, ws, msg })
        break
      case 'listen':
        this.emitter.emit('listen', { entity, ws, msg })
        break
      case 'exit':
        this.emitter.emit('exit', { entity, ws, msg })
        break
      case 'error':
        this.handleError({ msg })
        break
      default:
        logger.info(msg)
    }
  }

  handleExit ({ entity, msg }) {
    switch (entity.type) {
      case 'player':
        this.state.exit += 1
        if (msg.id === '0') {
          this.state.results = msg.output
        }
        if (this.state.exit === this.players.length) {
          this.emitter.emit('computation-finished', { msg })
        }
        break
      case 'client':
        this.state.import += 1
        if (this.state.import === this.clients.length) {
          this.emitter.emit('importation-finished', { msg })
        }
        break
      default:
    }
  }

  handleDataInfo ({ msg }) {
    this.state.dataInfoReceived += 1
    this.processDataInfo(msg.datasetInfo)

    if (this.state.dataInfoReceived === this.clients.length) {
      if (this.state.dataInfo.dataSize === 0) {
        return this.handleComputationFinished({ msg })
      }

      this.updateStep(step.DATA_SIZE_ACCEPTED)
      this.state.dataInfoReceived = 0
      this.sendToAll(pack({ message: 'compile', job: this.job.data, dataInfo: this.state.dataInfo }), this.players)
    }
  }

  handleCompilation ({ msg }) {
    this.state.compiled += 1
    if (this.state.compiled === this.players.length) {
      logger.info('Compilation finished.')
      this.updateStep(step.COMPILE_END)
      this.state.compiled = 0
      this.sendToAll(pack({ message: 'start', job: this.job.data }), this.players)
    }
  }

  handleComputationFinished ({ msg }) {
    logger.info('Computation Finished')
    this.updateStep(step.COMPUTATION_END)
    this.state.exit = 0
    this.cleanUpPlayers()
    this.cleanUpClients()
    this.processResults()
    this.state.results = this.postProcess([ ...this.state.results ])
    this.resolve(this.state.results)
  }

  processResults () {
    let results = []

    if (this.state.dataInfo.dataSize === 0) {
      return []
    }

    for (let r of this.state.results.split('\n')) {
      if (r.includes('#') || r.includes('START')) {
        continue
      }

      if (r.includes('$') || r.includes('END')) {
        break
      }

      results.push(r)
    }

    this.state.results = [...results]
  }

  handleImportationFinished () {
    logger.info('Importation Finished')
    this.updateStep(step.IMPORT_END)
  }

  restart () {
    const msg = pack({ message: 'restart', job: this.job.data })
    this.sendToAll(msg, this.players)
    this.sendToAll(msg, this.clients)
  }

  listen () {
    this.state.listen += 1
    if (this.state.listen === this.players.length) {
      logger.info('Players are listening...')
      this.updateStep(step.IMPORT_START)
      this.state.listen = 0
      this.sendToAll(pack({ message: 'import', job: this.job.data }), this.clients)
    }
  }

  updateStep (_step) {
    this.state.step = _step
    // this.job.reportProgress({ step: this.state.step }) // Next release will inlude the feature to pass arbitrary data in reportProgress
    this.job.reportProgress((_step / (Object.keys(step).length - 1)) * 100)
  }

  processDataInfo (info) {
    this.state.dataInfo.sizeAlloc += Number(info.sizeAlloc)
    this.state.dataInfo.dataSize += Number(info.dataSize)
    this.state.dataInfo.precision = Math.min(Number(info.precision))
    this.state.dataInfo.attributeToInt = info.attributeToInt
    this.state.dataInfo.intToAttribute = info.intToAttribute

    if (this.job.data.algorithm === '1d_categorical_histogram') {
      this.state.dataInfo.cellsX = Number(info.cellsX)
    }

    if (this.job.data.algorithm === '2d_mixed_histogram') {
      this.state.dataInfo.cellsX = Number(info.cellsX)
      this.state.dataInfo.cellsY = getNumericCell(this.job.data.attributes)
    }

    if (this.job.data.algorithm === '2d_categorical_histogram') {
      this.state.dataInfo.cellsX = Number(info.cellsX)
      this.state.dataInfo.cellsY = Number(info.cellsY)
    }

    if (this.job.data.algorithm === '1d_numerical_histogram') {
      this.state.dataInfo.cellsX = getNumericCell(this.job.data.attributes)
    }

    if (this.job.data.algorithm === '2d_numerical_histogram') {
      this.state.dataInfo.cellsX = getCell(this.job.data.attributes[0])
      this.state.dataInfo.cellsY = getCell(this.job.data.attributes[1])
    }
  }

  postProcess (data) {
    let results = data

    if (this.job.data.algorithm === '1d_categorical_histogram') {
      results = data.reduce((previous, current) => {
        const xy = current.replace(/\s/g, '').split(',')
        if (!Number.isNaN(Number(xy[1]))) {
          previous.y.push(Number(xy[1]))
        }
        return previous
      }, { x: getAttributeNames(this.job.data.attributes[0].name), y: [] })
    }

    if (this.job.data.algorithm === '2d_mixed_histogram') {
      const m = getHistogramMinMax(data[0])
      data = data.slice(1)
      data = constructHistogram2DArray(data, this.state.dataInfo.cellsX, getNumericCell())
      let cells = Number(getNumericCell())

      results = { ...m, z: [...data], y: getAttributeNames(getCatecoricalAttribute().name), cells }
    }

    if (this.job.data.algorithm === '2d_categorical_histogram') {
      data = histogram2DArrayFromFlattenArray(data, this.state.dataInfo.cellsX, this.state.dataInfo.cellsY)
      results = { z: [...data], labels: { y: getAttributeNames(this.job.data.attributes[0].name), x: getAttributeNames(this.job.data.attributes[1].name) } }
    }

    if (this.job.data.algorithm === '1d_numerical_histogram') {
      const m = getHistogramMinMax(data[0])
      data = data.slice(1)
      results = { ...m, y: data.map(item => item.replace(/\s/g, '').split(',')[1]), cells: getCell(this.job.data.attributes[0]) }
    }

    if (this.job.data.algorithm === '2d_numerical_histogram') {
      const m0 = getHistogramMinMax(data[0])
      const m1 = getHistogramMinMax(data[1])
      let cellsX = getCell(this.job.data.attributes[0])
      let cellsY = getCell(this.job.data.attributes[1])

      data = data.slice(2)
      data = constructHistogram2DArray(data, cellsX, cellsY)
      results = { min: [m0.min, m1.min], max: [m0.max, m1.max], z: data, cellsX, cellsY }
    }

    return results
  }
}

module.exports = HistogramProtocol
