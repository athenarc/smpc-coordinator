const Queue = require('bee-queue')
const { compute } = require('./smpc/smpc')
const { HTTPError } = require('./errors')
const { db } = require('./db')
const { status } = require('./config/constants')

const queue = new Queue('smpc', { delayedDebounce: 3000 })

const addToQueue = ({ id }) => {
  const job = queue.createJob({ id })
  job.setId(id)
  job.backoff('fixed', 1000)

  // Consider changing to promise
  job.save((err, job) => {
    if (err) {
      throw new HTTPError(500, `Unable to save job ${job.id} on queue`)
    }
  })

  job.on('succeeded', (result) => onSucceeded(job, result))
}

const onSucceeded = async (job, results) => {
  console.log(`Done: ${job.id}: Results: ${results}`)
  await db.put(job.id, { 'status': status.COMPLETED, results })
}

queue.on('ready', () => {
  queue.process(async (job) => {
    console.log(`Processing job ${job.id}`)

    await db.put(job.id, { 'status': status.PROCESSING })
    const results = await compute(job)
    return results
  })

  console.log('Processing jobs...')
})

queue.on('error', (err) => {
  console.log(`A queue error happened: ${err.message}`)
})

queue.on('retrying', (job, err) => {
  console.log(`Job ${job.id} failed with error ${err.message} but is being retried!`)
})

queue.on('failed', async (job, err) => {
  console.log(`Job ${job.id} failed with error ${err.message}`)
  await db.put(job.id, { 'status': status.FAILED })
})

queue.on('stalled', (jobId) => {
  console.log(`Job ${jobId} stalled and will be reprocessed`)
})

module.exports = {
  queue,
  addToQueue
}
