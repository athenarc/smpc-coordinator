const _ = require('lodash')
const WebSocket = require('ws')
const EventEmitter = require('events')

const { players, clients, ROOT_CA, KEY, CERT } = require('../config')

class Protocol {
  constructor ({ job, name, opts = { entities: 'both' } }) {
    if (new.target === Protocol) {
      throw new TypeError('Cannot construct abstract Protocol instances directly')
    }

    this._validate({ job })
    this.job = job
    this.protocolName = name
    this.emitter = new EventEmitter()

    this.players = players.map(p => ({ ...p, socket: null, type: 'player' }))
    this.clients = clients
      .filter(c => _.includes(this.job.data.dataProviders, c.id))
      .map(c => ({ ...c, socket: null, type: 'client' }))

    this.job.data.totalClients = this.clients.length

    this.opts = {
      ca: ROOT_CA,
      key: KEY,
      cert: CERT,
      rejectUnauthorized: true,
      requestCert: true,
      checkServerIdentity: (host, cert) => {
        return undefined
      }
    }

    if (opts.entities === 'clients' || opts.entities === 'both') {
      this._initClients()
    }

    if (opts.entities === 'players' || opts.entities === 'both') {
      this._initPlayers()
    }
  }

  _validate ({ job }) {
    if (!job) {
      throw new Error('Protocol: Job must be defined!')
    }
  }

  _initEntity (key, index, entity) {
    // connection errors are handle on ws.on('error')
    this[key][index].socket = new WebSocket(entity.address, { ...this.opts })
    this[key][index].socket._index = index

    const ws = this[key][index].socket

    ws.on('open', () => this.handleOpen({ ws, entity }))

    ws.on('close', (code, reason) => this.handleClose({ ws, code, reason, entity }))

    ws.on('error', (err) => this.handleError({ ws, err, entity }))

    ws.on('message', (msg) => this.handleMessage({ ws, msg, entity }))
  }

  _initPlayers () {
    for (const [index, p] of this.players.entries()) {
      this._initEntity('players', index, p)
    }
  }

  _initClients () {
    for (const [index, c] of this.clients.entries()) {
      this._initEntity('clients', index, c)
    }
  }

  execute () {
    return new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
      this._execute()
    })
  }

  sendToAll (message, entities) {
    for (const e of entities) {
      if (e.socket && e.socket.readyState === WebSocket.OPEN) {
        e.socket.send(message) // Assume message is already packed. Message must be packed beforehand to avoid expessive call to JSON API
      }
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
      if (e.socket) {
        e.socket.close(1000)
      }
    }
  }

  /* Abstract Methods */
  _execute () {
    throw new Error('_execute: Implementation Missing!')
  }

  handleOpen ({ ws, entity }) {
    throw new Error('handleOpen: Implementation Missing!')
  }

  handleClose ({ ws, code, reason, entity }) {
    throw new Error('handleClose: Implementation Missing!')
  }

  handleError ({ ws, err, entity }) {
    throw new Error('handleError: Implementation Missing!')
  }

  handleMessage ({ ws, msg, entity }) {
    throw new Error('handleMessage: Implementation Missing!')
  }
}

module.exports = Protocol
