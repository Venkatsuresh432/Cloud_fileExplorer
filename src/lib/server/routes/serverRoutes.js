const serverController = require("../controllers/serverController")
const token = require("../middleware/TokenVerifier") 

const express = require("express")
const router = express.Router();

router.use(token.userVerification);

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

router.put("/server/update/:id", serverController.updateServer)
module.exports = router;