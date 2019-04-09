const HistogramComputation = require('./HistogramComputation')

const compute = async (job) => {
  const computation = new HistogramComputation(job)
  let out = await computation.execute()
  return out
}

module.exports = {
  compute
}
