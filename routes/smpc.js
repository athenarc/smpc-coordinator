const express = require('express')

const { createSimpleSMPCRouter } = require('../helpers')
const { SMPCEngine } = require('../smpc/SMPC')

const Sharemind = require('../smpc/Sharemind')

let router = express.Router()
const smpc = new SMPCEngine(new Sharemind())

router.get('/histogram/categorical', async (req, res, next) => {})

router = createSimpleSMPCRouter(router, '/histogram/numerical', smpc)
router = createSimpleSMPCRouter(router, '/histogram/categorical', smpc)
router = createSimpleSMPCRouter(router, '/decisionTree', smpc)

module.exports = router
