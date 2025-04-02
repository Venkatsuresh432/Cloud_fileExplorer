const express = require('express');
const router = express.Router();
const createController = require("../controllers/createUserServerControllers")
const pugC = require("../controllers/pugControllers")

// server creations
router.route('/createUser').get(pugC.jwtToken,createController.createUserViaPug)
router.route('/addUser').post(pugC.jwtToken,createController.addUser)

// user creations
router.route('/createServer').get(pugC.jwtToken,createController.createServerViaPug)
router.route('/addServer').post(pugC.jwtToken,createController.addServer)


module.exports = router