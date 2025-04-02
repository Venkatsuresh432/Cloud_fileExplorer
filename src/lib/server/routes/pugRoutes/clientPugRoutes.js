const express = require('express')
const pugC = require('./../../controllers/pugControllers')
const clientPugC = require('./../../controllers/pugUserController')

const router = express.Router()
router.get('/userServer/:id', pugC.jwtToken,clientPugC.clientUserServerRoute)

module.exports = router