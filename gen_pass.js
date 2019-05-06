#!/usr/bin/env node

const crypto = require('crypto')
const bcrypt = require('bcrypt')

const password = crypto.randomBytes(32).toString('hex')
const salt = bcrypt.genSaltSync(10)
const hash = bcrypt.hashSync(password, salt)

console.log({ password, salt, hash })
