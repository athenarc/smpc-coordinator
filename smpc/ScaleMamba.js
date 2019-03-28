const { SMPC } = require('./SMPC')
const Player = require('./Player')

class ScaleMamba extends SMPC {
  constructor () {
    super()
    this.players = [
      { id: 0 },
      { id: 1 },
      { id: 2 }
    ]
    this.totalListen = 0
    this.importData = this.importData.bind(this)
  }

  async compute () {
    console.log('SMPC Enginge: SCALE-MAMBA')
    console.log('Initiating players')
    for (const [index, player] of this.players.entries()) {
      this.players[index].instance = new Player(player.id)
      this.players[index].instance.on('listen', (res) => this.listen(res))
      this.players[index].instance.on('exit', (res) => this.clear(res))
      this.players[index].instance.run()
    }
  }

  clear (res) {
    for (const [index, player] of this.players.entries()) {
      if (player.id === res.id) {
        this.players[index].instance = null
      }
    }
    this.totalListen = 0
  }

  listen (res) {
    console.log('mesa', res)
    this.totalListen += 1

    if (this.totalListen < 3) {
      return
    }

    this.importData()
  }

  importData () {
    console.log('import!')
  }
}

module.exports = ScaleMamba
