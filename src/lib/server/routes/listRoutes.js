const express = require('express')
const listController = require('../controllers/listControllers')
const token = require("../middleware/TokenVerifier") 
const router = express.Router()

router.use(token.adminVerification);
router.get('/serverAllotment/:id',listController.serverAllot);
router.put('/addServer/:id1/:id2', listController.addServerToUser);

module.exports = router