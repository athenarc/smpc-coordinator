#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const { Transform } = require('stream')
require('dotenv').config({ path: path.resolve(__dirname, '../', '.env') })

const level = require('level')
const { SMPC_DB_PATH } = require('../config/constants')

const dbTransform = new Transform({
  objectMode: true,
  writableObjectMode: true
})

dbTransform._started = false

dbTransform._transform = (data, _, done) => {
  try {
    if (!this._started) {
      this._started = true
      data = `[${JSON.stringify(data, null, 4)}`
    } else {
      data = `,\n${JSON.stringify(data, null, 4)}`
    }
  } catch (err) {
    return done(err)
  }

  done(null, data)
}

dbTransform._flush = function (callback) {
  this.push(']')
  callback()
}

const initDB = async () => {
  return new Promise((resolve, reject) => {
    level(SMPC_DB_PATH, { valueEncoding: 'json' }, (err, db) => {
      if (err) {
        return reject(err)
      }

      resolve(db)
    })
  })
}

const exportDB = async (db) => {
  return new Promise((resolve, reject) => {
    const dbStream = db.createReadStream()
    const fileStream = fs.createWriteStream('db.json')

    dbStream.on('error', reject)
    fileStream.on('error', reject)

    fileStream.on('close', resolve)

    dbStream.pipe(dbTransform).pipe(fileStream)
  })
}

const main = async () => {
  try {
    console.log('[*] Initiating database...')
    const db = await initDB()
    console.log('[*] Exporting database...')
    await exportDB(db)
    console.log('[*] Finished!')
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

main()
