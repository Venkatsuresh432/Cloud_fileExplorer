const express = require('express')
const router = express.Router()
const serverConnectCont = require('../controllers/serverConnectControllers')
const pugC = require("../controllers/pugControllers")
router.use(express.urlencoded({ extended: true }));

router.route('/connect/:id').get(pugC.jwtToken, serverConnectCont.connectServer)

module.exports =router