const serverModel = require("../models/serverModel")
const userModel = require("../models/userModel")
const multer = require('multer')
const path = require('path');
const PdfParse = require("pdf-parse");
const { hashedPassword }=require("../utils/passwordUtils");


const storage = multer.memoryStorage(); // files stored in memory as an buffer
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        console.log("Received file:", file); // Debugging
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.pdf') {
            return cb(new Error("Only PDFs are allowed"), false);
        }
        cb(null, true);
    }
}).single('passKeyFile'); 

// Create Server page renderer
exports.createServerViaPug = (req, res) => {
    res.status(200).render('createServer')
}

// create user page renderer
exports.createUserViaPug = (req, res) => {
    res.status(200).render('createUser')
}

// add server in database 
exports.addServer = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error("Multer error:", err);
            res.session.message = err.message;
        }
        console.log("File received:", req.file);
        console.log("Body received:", req.body);
        let passkeyData;
        if (req.file) {
            const pdfData = await PdfParse(req.file.buffer);
            passkeyData = JSON.stringify(pdfData.text.trim());
        } 
        else if (req.body.passKey) {
            // Convert array to string if needed
            passkeyData = Array.isArray(req.body.passKey) ? req.body.passKey.join(' ') : req.body.passKey;
        } 
        else {
            req.session.message = "Passkey Is Required Either";
        }

        try {       
            const { serverName, hostToConnect, port, bypassProxy, password, status, disableDate } = req.body;

            if (!serverName || !hostToConnect || !port || !password) {
                req.session.message = "Enter mandate field"; 
            }

            const proxyData = bypassProxy === 'on';
            const stats = status === 'on';

            // Ensure passkey is converted to a string
            const hashedkey = String(passkeyData);

            const data = await serverModel.create({
                serverName,
                hostToConnect,
                port,
                bypassProxy: proxyData,
                disableDate,
                password,
                privateKey: hashedkey, // Ensure it's a string
                status: stats
            });

            await data.save();
            req.session.message = "Server Created Successfully";
            req.session.type = "alert-success";
            res.redirect('/pug/serverTable');
        } 
        catch(error)
        {
            console.log(error.message)
            return res.status(500).send({
                message:"failed",
                error: error.message
            })
        }
    });
};


// add user in database
exports.addUser = async (req, res) => 
    {
        try
        {
            const  { userName, email, password, status, disableDate } = req.body;
            console.log(req.body)
            console.log(userName, email, password, status)
            if(!userName | !email | !password ){
                req.session.message = "Enter all details";
                req.session.type = "alert-danger";
                return res.redirect('/create/createUser');
            }
            const hPassword = await hashedPassword( password );
            console.log(hPassword)

            const data = await userModel.findOne({email});
            if(data)
            {
                req.session.message = "User Already Found"
                req.session.type = "alert-warning"
                res.redirect('/create/createUser')
            }
            const user = new userModel({
                userName,
                email,
                password: hPassword,
                disableDate
            })
            await user.save()
            
            req.session.message = "User Created Sucessfully"
            req.session.type = "alert-success"
            res.redirect('/create/userTable')
        }
        catch(error)
   {
        return res.redirect('back')
   }
}