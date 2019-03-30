const Computation = require('./Computation')

const compute = async (job) => {
  const computation = new Computation(job)
  let out = await computation.execute()
  return out
}
module.exports = {
  compute
}
