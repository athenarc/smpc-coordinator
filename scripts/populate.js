#!/usr/bin/env node

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../', '.env') })

const level = require('level')
const { SMPC_DB_PATH } = require('../config/constants')
const computations = require('./computations')

const db = level(SMPC_DB_PATH, { valueEncoding: 'json' })

const main = async () => {
  try {
    console.log('[*] Populating computations...')
    await db.batch(computations.map(c => ({ type: 'put', ...c })))
    console.log('[*] Finished!')
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

main()
