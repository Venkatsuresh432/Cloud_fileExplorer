const serverController = require("../controllers/serverController")


const express = require("express")
const router = express.Router();


router.route("/server")
.post(serverController.createServerComponent)
.get( serverController.getallServers)
//  validateServer 
router.route("/server/:id")
.get(serverController.getServerById)
.put(serverController.updateStatus)
.delete(serverController.deleteServer)

router.route("/servers/:id")
.put( serverController.updateByPassProxy)
.delete( serverController.deleteServerWithUser)
module.exports = router;