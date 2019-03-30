const PLAYER_1 = process.env.PLAYER_1 || 'ws://localhost:3005'
const PLAYER_2 = process.env.PLAYER_2 || 'ws://localhost:3006'
const PLAYER_3 = process.env.PLAYER_3 || 'ws://localhost:3007'
const CLIENT_1 = process.env.CLIENT_1 || 'ws://localhost:3008'
const CLIENT_2 = process.env.CLIENT_2 || 'ws://localhost:3009'
const CLIENT_3 = process.env.CLIENT_3 || 'ws://localhost:3010'

const WebSocket = require('ws')
const { pack, unpack } = require('../helpers')

class Computation {
  constructor (job) {
    this.job = job

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
      exit: 0
    }
  }

  execute () {
    return new Promise((resolve, reject) => this._execute(resolve, reject))
  }

  sendToAll (message, entities) {
    for (const e of entities) {
      e.socket.send(message) // message must be packed to avoid expessive call to JSON API
    }
  }

  _execute (resolve, reject) {
    console.log('Initiating SMPC Engine...')

    for (const [index, p] of this.players.entries()) {
      this.players[index].socket = new WebSocket(p.address)
      this.players[index].socket._index = index
      const ws = this.players[index].socket

      ws.on('open', () => {
        console.log('Connected to player.')
        ws.send(pack({ message: 'start' }))
      })

      ws.on('close', () => {
        console.log('Disconnected from player.')
        this.players[ws._index].socket = null
      })

      ws.on('message', (data) => {
        data = unpack(data)

        if (data.message === 'listen') {
          this.listen(ws)
        }

        if (data.message === 'exit') {
          this.state.exit += 1
          if (this.state.exit === this.players.length) {
            console.log('Computation Finished')
            this.state.exit = 0
            this.cleanUpPlayers()
            resolve('Finished!')
          }
        }
      })
    }
  }

  listen (ws) {
    this.state.listen += 1
    if (this.state.listen === this.players.length) {
      console.log('Players are listening...')
      this.state.listen = 0
      this.importData(ws)
    }
  }

  importData (ws) {
    for (const [index, c] of this.clients.entries()) {
      this.clients[index].socket = new WebSocket(c.address)
      this.clients[index].socket._index = index
      const ws = this.clients[index].socket

      ws.on('open', () => {
        console.log('Connected to client.')
        ws.send(pack({ message: 'import' }))
      })

      ws.on('close', () => {
        console.log('Disconnected from client.')
        this.clients[ws._index].socket = null
      })

      ws.on('message', (data) => {
        data = unpack(data)

        if (data.message === 'exit') {
          this.state.import += 1
          if (this.state.import === this.clients.length) {
            console.log('Importation Finished')
            this.cleanUpClients()
          }
        }
      })
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
