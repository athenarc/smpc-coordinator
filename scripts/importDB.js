#!/usr/bin/env node

const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '../', '.env') })

const level = require('level')
const { SMPC_DB_PATH } = require('../config/constants')

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

const importDB = async (db) => {
  let records = require(process.argv[2])
  records = records.map(r => ({ type: 'put', key: r.key, value: r.value }))

  await db.batch(records)
}

const main = async () => {
  try {
    console.log('[*] Initiating database...')
    const db = await initDB()
    console.log('[*] Importing database...')
    await importDB(db)
    console.log('[*] Finished!')
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

main()
