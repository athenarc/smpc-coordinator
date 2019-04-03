const PLAYER_1 = process.env.PLAYER_1 || 'ws://localhost:3005'
const PLAYER_2 = process.env.PLAYER_2 || 'ws://localhost:3006'
const PLAYER_3 = process.env.PLAYER_3 || 'ws://localhost:3007'
const CLIENT_1 = process.env.CLIENT_1 || 'ws://localhost:3008'
const CLIENT_2 = process.env.CLIENT_2 || 'ws://localhost:3009'
const CLIENT_3 = process.env.CLIENT_3 || 'ws://localhost:3010'

const WebSocket = require('ws')
const EventEmitter = require('events')
const { pack, unpack } = require('../helpers')
const { step } = require('../config/constants')

class Computation {
  constructor (job) {
    this.job = job
    this.emitter = new EventEmitter()

    this.players = [
      { address: PLAYER_1, socket: null },
      { address: PLAYER_2, socket: null },
      { address: PLAYER_3, socket: null }
    ]

    this.clients = [
      { address: CLIENT_1, socket: null },
      { address: CLIENT_2, socket: null },
      { address: CLIENT_3, socket: null }
    ]

    this.state = {
      listen: 0,
      import: 0,
      exit: 0,
      step: step.INIT
    }

    this.resolve = null
    this.reject = null
    this._register()
  }

  _execute (resolve, reject) {
    console.log('Initiating SMPC Engine...')
    this.resolve = resolve
    this.reject = reject
    this.setupPlayers()
  }

  _register () {
    this.emitter.on('listen', this.listen.bind(this))
    this.emitter.on('exit', this.handleExit.bind(this))
    this.emitter.on('computation-finished', this.handleComputationFinished.bind(this))
    this.emitter.on('importation-finished', this.handleImportationFinished.bind(this))
  }

  setupPlayers () {
    for (const [index, p] of this.players.entries()) {
      this.players[index].socket = new WebSocket(p.address)
      this.players[index].socket._index = index
      const ws = this.players[index].socket

      ws.on('open', () => {
        console.log('Connected to player.')
        ws.send(pack({ message: 'start' }))
      })

      ws.on('close', (code, reason) => {
        console.log('Disconnected from player.')
        this.players[ws._index].socket = null

        if (this.state.step !== step.COMPUTATION_END) {
          this.reject(new Error(`Unexpected close with code: ${code} and reason: ${reason}`))
        }
      })

      ws.on('message', (data) => {
        data = unpack(data)
        this.handleMessage('player', ws, data)
      })
    }
  }

  setupClients () {
    for (const [index, c] of this.clients.entries()) {
      this.clients[index].socket = new WebSocket(c.address)
      this.clients[index].socket._index = index
      const ws = this.clients[index].socket

      ws.on('open', () => {
        console.log('Connected to client.')
        ws.send(pack({ message: 'import' }))
      })

      ws.on('close', (code, reason) => {
        console.log('Disconnected from client.')
        this.clients[ws._index].socket = null
        if (this.state.step !== step.IMPORT_END) {
          this.reject(new Error(`Unexpected close with code: ${code} and reason: ${reason}`))
        }
      })

      ws.on('message', (data) => {
        data = unpack(data)
        this.handleMessage('client', ws, data)
      })
    }
  }

  handleMessage (entity, ws, data) {
    switch (data.message) {
      case 'listen':
        this.emitter.emit('listen', { entity, ws, data })
        break
      case 'exit':
        this.emitter.emit('exit', { entity, ws, data })
        break
      case 'error':
        this.handleError({ data })
        break
      default:
        console.log(data)
    }
  }

  handleError ({ data }) {
    this.reject(new Error('An error has occured!'))
  }

  handleExit ({ entity, data }) {
    if (data.code !== 0 || data.errors.length > 0) {
      this.reject(data.errors)
      return
    }

    switch (entity) {
      case 'player':
        this.state.exit += 1
        if (this.state.exit === this.players.length) {
          this.emitter.emit('computation-finished', { data })
        }
        break
      case 'client':
        this.state.import += 1
        if (this.state.import === this.clients.length) {
          this.emitter.emit('importation-finished', {})
        }
        break
      default:
    }
  }

  handleComputationFinished ({ data }) {
    console.log('Computation Finished')
    this.state.step = step.COMPUTATION_END
    this.state.exit = 0
    this.cleanUpPlayers()
    this.resolve(data.message)
  }

  handleImportationFinished () {
    console.log('Importation Finished')
    this.state.step = step.IMPORT_END
    this.cleanUpClients()
  }

  execute () {
    return new Promise((resolve, reject) => this._execute(resolve, reject))
  }

  sendToAll (message, entities) {
    for (const e of entities) {
      e.socket.send(message) // message must be packed to avoid expessive call to JSON API
    }
  }

  listen () {
    this.state.listen += 1
    if (this.state.listen === this.players.length) {
      console.log('Players are listening...')
      this.state.step = step.IMPORT_START
      this.setupClients()
      this.state.listen = 0
    }
  }

  cleanUpClients () {
    this.cleanUp(this.clients)
  }

  cleanUpPlayers () {
    this.cleanUp(this.players)
  }

  cleanUp (entities) {
    for (const e of entities) {
      e.socket.terminate()
    }
  }
}

module.exports = Computation
