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
router.route('/sftpLoading/:id').get( sftpController.navigateFolder2)
router.route('/sftpLoading2/:id').get( sftpController.initalizeServerFolder)
router.route('/files/:id').get( sftpController.navigateFolder2)
//sftp create folder
router.route('/createFolder/:id').post(sftpController.createFolder)
router.route('/downloads/:id').post(sftpController.downloads2)
router.route('/uploadFile/:id').post(upload, sftpController.uploadFiles3)

router.post("/copy", sftpController.copyItem3);
router.post("/copied", sftpController.copyMultipleItems);
router.post("/cutted",sftpController.cutMultipleItems)
router.post("/cut", sftpController.cutItem);
router.post("/paste/:id", sftpController.pasteItem2);
router.post("/pasted/:id", sftpController.pasteMultipleItems);
router.post("/rename", sftpController.renameItem);
router.post("/delete", sftpController.deleteItem2);




module.exports = router