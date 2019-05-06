#!/usr/bin/env node

const { userDB } = require('../db')

const users = require('./users')

const populate = async () => {
  let batch = []

  for (let user of users) {
    batch.push({
      type: 'put',
      key: user.username,
      value: {
        ...user,
        createdAt: new Date()
      }
    })
  }

  await userDB.batch(batch)
}

populate()
  .then(v => {
    console.log('Done!')
  })
  .catch(err => {
    console.log(err)
    process.exit(1)
  })
