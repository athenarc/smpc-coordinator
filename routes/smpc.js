const winston = require('winston')
const express = require('express')

const router = express.Router()

router.get('/queue', async (req, res, next) => {})

router.get('/histogram/numerical', async (req, res, next) => {})

router.get('/histogram/categorical', async (req, res, next) => {})

router.get('/decisionTree', async (req, res, next) => {})

module.exports = router
