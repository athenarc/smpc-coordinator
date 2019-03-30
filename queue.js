const Queue = require('bee-queue')
const { compute } = require('./smpc/smpc')
const { HTTPError } = require('./errors')

const queue = new Queue('smpc', { delayedDebounce: 3000 })

const addToQueue = ({ id }) => {
  const job = queue.createJob({ id })
  job.setId(id)
  job.save((err, job) => {
    if (err) {
      throw new HTTPError(500, `Unable to save job ${job.id} on queue`)
    }
  })

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
