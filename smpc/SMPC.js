const PLAYER_1 = process.env.PLAYER_1 || 'ws://localhost:3005'
const PLAYER_2 = process.env.PLAYER_2 || 'ws://localhost:3006'
const PLAYER_3 = process.env.PLAYER_3 || 'ws://localhost:3007'
const WebSocket = require('ws')
const { pack, unpack } = require('../helpers')

class SMPC {
  constructor () {
    this.players = [
      { address: PLAYER_1, socket: null },
      { address: PLAYER_2, socket: null },
      { address: PLAYER_3, socket: null }
    ]

    this.totalListen = 0
  async compute () {
    console.log('Initiating SMPC Engine...')

    for (const [index, p] of this.players.entries()) {
      this.players[index].socket = new WebSocket(p.address)
      const ws = this.players[index].socket

      ws.on('open', () => {
        console.log('Connected to player.')
        ws.send(pack({ message: 'start' }))
      })

      ws.on('close', () => {
        console.log('Disconnected from player.')
      })

      ws.on('message', (data) => {
        data = unpack(data)

        if (data.message === 'listen') {
          this.listen(ws)
        }
      })
    }
  }

  listen (ws) {
    this.totalListen += 1
  }

  }
}

module.exports = {
  SMPC
}
