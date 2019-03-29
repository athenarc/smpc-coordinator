const Computation = require('./Computation')

const compute = async () => {
  const computation = new Computation()
  let out = await computation.execute()
  console.log(out)
}
module.exports = {
  compute
}
