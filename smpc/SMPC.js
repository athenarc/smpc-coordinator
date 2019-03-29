const Computation = require('./Computation')

class SMPC {
  async compute () {
    const computation = new Computation()
    let out = await computation.execute()
    console.log(out)
  }
}

module.exports = {
  SMPC
}
