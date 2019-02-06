class SMPC {
  constructor () {
    if (new.target === SMPC) {
      throw new TypeError('Cannot construct Abstract instances directly')
    }
  }
  async compute () {
    throw new Error('compute: Implementation Missing!')
  }
}

class SMPCEngine {
  constructor (engine) {
    this.engine = engine
  }

  async execute () {
    await this.engine.compute()
  }
}

module.exports = {
  SMPC,
  SMPCEngine
}
