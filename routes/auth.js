const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const { JWT_SECRET } = require('../config/constants')
const { HTTPError } = require('../errors')

const router = express.Router()

router.post('/login', async (req, res, next) => {
  if (!req.body.username || !req.body.password) {
    return next(new HTTPError(400, 'Bad request'))
  }

  try {
    const user = await User.findOne(req.body.username)

    if (!(await user.validatePassword(req.body.password))) {
      return next(new HTTPError(401, 'Unauthorized'))
    }

    const payload = { username: user.username }
    const token = jwt.sign(payload, JWT_SECRET)
    return res.status(200).json({ token: token })
  } catch (e) {
    console.log(e)

    if (e.notFound) {
      return next(new HTTPError(401, 'Unauthorized'))
    }

    return next(new HTTPError(500, 'Server error'))
  }
})

module.exports = router
