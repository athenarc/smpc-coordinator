const Queue = require('bee-queue')
const queue = new Queue('smpc')
const { compute } = require('./smpc/smpc')

const addToQueue = ({ id }) => {
  const job = queue.createJob({ id })
  job.save()

  job.on('succeeded', (result) => onSucceeded(job, result))
}

const onSucceeded = (job, results) => {
  console.log(`Done: ${job.id}: Results: ${results}`)
}

// Process jobs from as many servers or processes as you like
queue.process(async (job, done) => {
  console.log(`Processing job ${job.id}`)
  const results = await compute()
  return done(null, results)
})

module.exports = {
  queue,
  addToQueue
}
