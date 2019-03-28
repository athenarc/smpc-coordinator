const { spawn } = require('child_process')
const EventEmitter = require('events')

const SCALE = process.env.SMPC_ENGINE
const PLAYER_CMD = `${SCALE}/Player.x`

class Player extends EventEmitter {
  constructor (id) {
    super()
    this.player = null
    this.id = id
  }

  run () {
    this.player = spawn(PLAYER_CMD, [this.id, 'Programs/sedp', '-f 1'], { cwd: SCALE, shell: true })

    this.player.stdout.on('data', (data) => {
      console.log(data.toString())
      if (data.toString().includes('Opening channel 1')) { // better search message. SCALE should print specilized message
        this.emit('listen', { id: this.id })
      }
    })

    this.player.stderr.on('data', (data) => {
      console.log(data.toString())
    })

    this.player.on('exit', (code) => {
      console.log(`Child exited with code ${code}`)
      this.emit('exit', { id: this.id })
    })
  }
}

module.exports = Player
