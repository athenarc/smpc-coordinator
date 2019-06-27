const Queue = require('bee-queue')
const { URL } = require('url')
const { compute } = require('./smpc/smpc')
const { HTTPError } = require('./errors')
const { status, REDIS_URL } = require('./config/constants')
const { appEmitter } = require('./emitters.js')
const { updateJobStatus, sha256 } = require('./helpers.js')
const { addToCache } = require('./cache.js')
const logger = require('./config/winston')

const redisURL = new URL(REDIS_URL)

const redis = {
  host: redisURL.hostname,
  port: redisURL.port
}

const queue = new Queue('smpc', { delayedDebounce: 3000, redis })

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
    logger.info(`Job ${job.id} reported progress ${progress}`) // Next release will inlude the feature to pass arbitrary data in reportProgress
    // logger.info(`Job ${job.id} reported progress: page ${step.properties[progress.step].msg}`) // Next release will inlude the feature to pass arbitrary data in reportProgress
  })
}

const onSucceeded = async (job, results) => {
  logger.info(`Done: ${job.id}`)
  job.data = { ...job.data, 'status': status.COMPLETED, results, timestamps: { ...job.data.timestamps, done: Date.now() } }
  const key = sha256(JSON.stringify({ attributes: job.data.attributes, filters: job.data.filters, algorithm: job.data.algorithm }))
  await addToCache(key, job.data)
  appEmitter.emit('update-computation', { ...job.data })
}

queue.on('ready', () => {
  queue.process(async (job) => {
    logger.info(`Processing job ${job.id}`)
    try {
      job.data.status = status.PROCESSING
      job.data.timestamps = { ...job.data.timestamps, process: Date.now() }
      appEmitter.emit('update-computation', { ...job.data })
      const results = await compute(job)
      return results
    } catch (e) {
      console.error(e)
      throw new Error(e.message)
    }
  })

  logger.info('Start processing jobs...')
})

queue.on('error', (err) => {
  logger.error(`A queue error happened: ${err.message}`)
})

queue.on('retrying', async (job, err) => {
  logger.error(`Job ${job.id} failed with error ${err.message} but is being retried!`)
  updateJobStatus(job, status.PENDING)
})

queue.on('failed', async (job, err) => {
  logger.error(`Job ${job.id} failed with error ${err.message}`)
  updateJobStatus(job, status.FAILED)
})

queue.on('stalled', async (jobId) => {
  logger.warn(`Job ${jobId} stalled and will be reprocessed`)
})

module.exports = {
  queue,
  addJobToQueue
}
