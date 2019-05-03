#!/usr/bin/env node

const crypto = require('crypto')

const password = crypto.randomBytes(32).toString('hex')
const salt = crypto.randomBytes(16).toString('hex')
const hash = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('hex')

console.log({ password, salt, hash })
