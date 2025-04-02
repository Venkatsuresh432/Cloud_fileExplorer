const express = require('express')
const pugC = require('../controllers/pugControllers')
const listController = require('../controllers/listControllers')
const token = require("../middleware/TokenVerifier") 
const router = express.Router()
router.use(express.urlencoded({ extended: true }));

router.use(token.adminVerification);


// user Lists
router.route('/serverAllotment/:id').get(listController.serverAllot)
router.route('/activateUser/:_id').get( listController.userActiveStatus)
router.route('/deleteUser/:_id').get(listController.deletePugUser)


// server lists 
router.route('/updateServerStatus/:_id').get(pugC.updateServerStat)
router.route('/updateActiveServer/:_id').post(listController.updateServerStatus)
router.route('/updateServerProxy/:_id').get(listController.updateServerproxy)
router.route('/deleteServer/:_id').get(listController.deletePugserver)
router.route('/connect/:id').get(listController.connectServer)

// server allocation for user
router.route('/addServer/:id1/:id2').put(listController.addServerToUser)

module.exports = router