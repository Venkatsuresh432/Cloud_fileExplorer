const express = require('express');
const userController = require('../controllers/userController');
const { authUser, adminAuthentication } = require('../middleware/authController');
const { adminAuth } = require('../middleware/adminMiddleware');
const { validateUser } = require("../validators/userValidator");


const router = express.Router();

router.route('/user')
.post(userController.createUserController)
.get(userController.getAllUserController)

router.put('/user/status/:id', userController.updateStatusController)
router.delete("/user/server/:id", userController.deleteUserWithServerController);


router.route('/user/:id')
.get(userController.getUserByIdController)
.put(userController.UpdateUserController)
.delete(userController.deleteUserController)
.put(userController.updateStatusController)



module.exports = router

