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

queue.on('ready', () => {
  queue.process(async (job) => {
    console.log(`Processing job ${job.id}`)
    const results = await compute(job)
    return results
  })

  console.log('Processing jobs...')
})

module.exports = {
  queue,
  addToQueue
}
