const Queue = require('bee-queue')
const { compute } = require('./smpc/smpc')
const { HTTPError } = require('./errors')
const { status, step } = require('./config/constants')
const { appEmitter } = require('./emitters.js')
const { updateJobStatus } = require('./helpers.js')

const queue = new Queue('smpc', { delayedDebounce: 3000 })

const addJobToQueue = (jobDescription) => {
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
  job.on('progress', (progress) => {
    console.log(`Job ${job.id} reported progress ${progress}`) // Next release will inlude the feature to pass arbitrary data in reportProgress
    // console.log(`Job ${job.id} reported progress: page ${step.properties[progress.step].msg}`) // Next release will inlude the feature to pass arbitrary data in reportProgress
  })
}

const onSucceeded = async (job, results) => {
  console.log(`Done: ${job.id}`)
  job.data = { ...job.data, 'status': status.COMPLETED, results }
  appEmitter.emit('update-computation', { ...job.data })
}

queue.on('ready', () => {
  queue.process(async (job) => {
    console.log(`Processing job ${job.id}`)
    try {
      updateJobStatus(job, status.PROCESSING)
      const results = await compute(job)
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
  updateJobStatus(job, status.PENDING)
})

queue.on('failed', async (job, err) => {
  console.log(`Job ${job.id} failed with error ${err.message}`)
  updateJobStatus(job, status.FAILED)
})

queue.on('stalled', async (jobId) => {
  console.log(`Job ${jobId} stalled and will be reprocessed`)
})

module.exports = {
  queue,
  addJobToQueue
}
