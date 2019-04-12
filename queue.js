const Queue = require('bee-queue')
const { compute } = require('./smpc/smpc')
const { HTTPError } = require('./errors')
const { db } = require('./db')
const { status } = require('./config/constants')
const { appEmitter } = require('./emitters.js')

const queue = new Queue('smpc', { delayedDebounce: 3000 })

const addJob = (jobDescription) => {
  const job = queue.createJob({ ...jobDescription })
  job.setId(jobDescription.id)
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
  job.data = { ...job.data, 'status': status.COMPLETED, results }
  await db.put(job.id, { ...job.data })
  appEmitter.emit('update-computation', { ...job.data })
}

queue.on('ready', () => {
  queue.process(async (job) => {
    console.log(`Processing job ${job.id}`)
    try {
      job.data.status = status.PROCESSING
      appEmitter.emit('update-computation', { ...job.data })
      await db.put(job.id, { ...job.data })
      const results = await compute({ ...job.data })
      return results
    } catch (e) {
      console.error(e)
      throw new Error(e.message)
    }
  })

  console.log('Start processing jobs...')
})

queue.on('error', (err) => {
  console.log(`A queue error happened: ${err.message}`)
})

queue.on('retrying', async (job, err) => {
  console.log(`Job ${job.id} failed with error ${err.message} but is being retried!`)
  job.data.status = status.PENDING
  appEmitter.emit('update-computation', { ...job.data })
  await db.put(job.id, { ...job.data })
})

queue.on('failed', async (job, err) => {
  console.log(`Job ${job.id} failed with error ${err.message}`)
  job.data.status = status.FAILED
  appEmitter.emit('update-computation', { ...job.data })
  await db.put(job.id, { ...job.data })
})

queue.on('stalled', async (jobId) => {
  console.log(`Job ${jobId} stalled and will be reprocessed`)
})

module.exports = {
  queue,
  addJob
}
