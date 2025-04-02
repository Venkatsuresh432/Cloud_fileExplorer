const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const token = require("../middleware/TokenVerifier"); 
router.use(token.userVerification);

router.route('/user')
.post(userController.createUserController)
.get(userController.getAllUserController)
router.route('/user/:id')
.get(userController.getUserByIdController)
.put(userController.UpdateUserController)
.delete(userController.deleteUserController)

router.put('/user/status/:id', userController.updateStatusController)
router.delete("/user/server/:id", userController.deleteUserWithServerController);



module.exports = router;