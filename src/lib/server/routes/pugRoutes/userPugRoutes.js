const express = require('express')
const pugC = require('./../../controllers/pugControllers')

const router = express.Router()


router.use(express.urlencoded({ extended: true }));


router.route('/').get(pugC.logPugController)
router.route('/loginUser').post(pugC.loginUserController)
router.route('/logout').get(pugC.logout)
 router.route('/userTable').get(pugC.userTables) //  pugC.jwtToken, 
router.route('/serverTable').get(pugC.jwtToken,pugC.serverTables)
router.route('/createUser').get(pugC.jwtToken,pugC.createUserViaPug)
router.route('/createServer').get(pugC.jwtToken,pugC.createServerViaPug)
router.route('/activateUser/:_id').get( pugC.jwtToken, pugC.adminAccess, pugC.userActiveStatus)
router.route('/activateServer/:_id').get(pugC.jwtToken,pugC.serverActiveStatus)
router.route('/proxyAccess').get(pugC.jwtToken,pugC.proxyAccess)
router.route('/addUser').post(pugC.addPugUser)
router.route('/addServer').post(pugC.jwtToken,pugC.addPugServer)
router.route('/deleteUser/:_id').get(pugC.jwtToken,pugC.deletePugUser)
router.route('/deleteServer/:_id').get(pugC.jwtToken,pugC.deletePugserver)
router.route('/updateActive/:_id').post(pugC.jwtToken,pugC.updateActiveStatus)
router.route('/updateServerStatus/:_id').get(pugC.jwtToken,pugC.updateServerStat)
router.route('/updateActiveServer/:_id').post(pugC.jwtToken,pugC.updateServerStatus)
router.route('/updateServerProxy/:_id').get(pugC.jwtToken,pugC.updateServerproxy)
router.route('/updateProxy/:_id').post(pugC.jwtToken,pugC.updateServerProxy)
router.route('/serverAllotment/:id').get(pugC.jwtToken,pugC.serverAllot)
router.route('/addServer/:id1/:id2').get(pugC.jwtToken,pugC.addServerToUser)
router.route('/connect/:id').get(pugC.jwtToken,pugC.connectServer)
router.route('/connectSuccess').get(pugC.jwtToken,pugC.connectToastMess)
router.route('/update-disable-date').post(pugC.jwtToken,pugC.updateDisableDate)
router.route('/update-disable-date-server').post(pugC.jwtToken,pugC.updateDisableDateServer)
router.route('/filemanager').get(pugC.sftpfileManager)

module.exports = router