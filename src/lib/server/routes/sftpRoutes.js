const express = require('express')
const sftpController = require('./../controllers/sftpControllers')
const router = express.Router()
const multer = require("multer");
const token = require("../middleware/TokenVerifier") 

router.use(token.userVerification);  
let uploadProgress = {}; 
router.get("/progress/:uploadId", (req, res) => {
    const { uploadId } = req.params;
    res.json({ progress: uploadProgress[uploadId] || 0 });
});
const upload = multer({ dest: "uploads/" }).array("files", 10);
//sftp routes
router.get('/files/:id',sftpController.navigateFolder2)
//sftp create folder
router.post('/createFolder/:id',sftpController.createFolder)
router.post('/downloads/:id',sftpController.downloads2)
router.post('/uploadFile/:id' ,upload, sftpController.uploadFiles3 )

router.post("/pasted/:id", sftpController.pasteMultipleItems);
router.post("/rename", sftpController.renameItem);
router.post("/delete", sftpController.deleteItem2);




module.exports = router