const serverModel = require("../models/serverModel")
const userModel = require("../models/userModel")
const multer = require('multer')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const path = require('path');
const PdfParse = require("pdf-parse");
const { hashedPassword, hashedPassKey }=require("../utils/passwordUtils");
const { body } = require("express-validator");
const admin = require("../middleware/adminMiddleware")
const cron = require("node-cron");
const fs = require("fs");
const archiver = require("archiver");
//  server
const SFTPService = require("../services/sftpServices");



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

// login page
exports.logPugController = (req, res) =>{
        res.status(200).render('login2')
}

// login user
exports.loginUserController = async (req, res) =>{
    try {
        const {email, password } = req.body;
        console.log(req.body)
        if(!email | !password)
        {
            req.session.message = "Provide Email Password"
            req.session.type= "alert-warning"
            res.redirect('/pug/loginUser')
        } 
        const user = await userModel.findOne({email})
        if(!user){
            req.session.message = "User Not Found"
            req.session.type = "alert-warning"
            res.redirect('/pug/loginUser')
        }
        console.log("user ="+ user)
        const passwordData = await bcrypt.compare(password, user.password)
        if(!passwordData)
            {
                req.session.message = "Enter Valid Email Password"
                req.session.type = "alert-warning"
                res.redirect('/pug/loginUser')
        }
        if(user.status == 0){
            req.session.message = "Session Expired Please Contact Admin"
            req.session.type = "alert-warning"
            res.redirect('/pug/loginUser')
        }
        const token = await jwt.sign( { id: user._id, email: user.email }, process.env.SECRETTOKEN, {expiresIn:"7d"} )
        // store cookie in token and send
        res.cookie("token", token, { 
            maxAge: 3600000,
            httpOnly: true,
            // secure: true,   // Ensures it's only sent over HTTPS
            // sameSite: "Strict"
         })
         req.session.user={
            id : user._id,
            name: user.userName,
            role: user.role
         }

        req.session.message = "Login Successfully"
        req.session.type = "alert-success"
        if(user.role === process.env.ADMIN){
            res.redirect('/pug/userTable')
        }
        else{
            res.redirect(`/pug/client/userServer/${user._id}`)
        }
        
    }
    catch(error)
    {
        return res.redirect('/pug')
    }
}


// user Logout 
exports.logout= async (req, res) =>{
    res.clearCookie("token")
    res.redirect("/pug")
}


exports.jwtToken = async (req, res, next) => {
   try{
    const { token } = req.cookies;
   if(!token)
    {
          return  res.redirect('/pug')
    }
    await jwt.verify(token, process.env.SECRETTOKEN, (err, decode)=>{
        if(err)
        {
            return  res.redirect('/pug')
        }
        next()
    })
   }
   catch(error)
   {
        return res.redirect('/pug')
   }

}
exports.adminAccess = async (req, res, next) => {
   try{
    const { token } = req.cookies;
    if(!token)
        {
            req.session.message = "Authentication required";
            req.session.type = "alert-warning";
            return res.redirect("back"); 
        }
        await jwt.verify(token, process.env.SECRETTOKEN, (err, decode)=>{
         if(err)
         {
            req.session.message = "Session expired Please Login"
            req.session.type = "alert-info"
            res.redirect('/pug')
         }
        else
        {
            console.log(decode)
            req.body.id = decode.id
            admin.adminCheck(req, res, next)

        }
     })
   }
   catch(err){
    return  res.redirect("/pug")
   }
 }
// exports.home = (req, res) => {
//     try {
//         res.status(200).render('main')
//     } 
//     catch (error) {
//         res.status(500).json({
//             message:'fetch error'
//         })  
//     }
// }
// user Table
exports.userTables =async  (req, res) => {
    try
    {
        const users = await userModel.find()
        if(!users) return res.status(404).json({ status:false, message:"No user found"})
        res.status(200).json({ status:true, message:"user data fetch successfully", users : users })
    }
    catch(error)
    {
       res.status(500).json({ status:false, message:"error while fatch api", error:error.message})
    }
}


// server table
exports.serverTables = async (req, res) =>{
    try{
        const servers = await serverModel.find();
        console.log(servers)
        res.status(200).render('serverList',
            {
                title:"Server Tables",
                servers
            }
        )
    }
    catch(error)
    {
         return res.redirect('back')
    }
}
// create server
exports.createUserViaPug = (req, res) => {
    res.status(200).render('createUser')
}

//create server
exports.createServerViaPug = (req, res) => {
    res.status(200).render('createServer')
}

// edit active status
exports.userActiveStatus = async (req, res) => {
    const { _id } = req.params; 
    const data = await userModel.findById( _id )
    var status 
    data.status == 1 ? status = "checked" : status = ""
    console.log(data._id)
    res.status(200).render('userActive', { 
        name: data.userName,
        id: data._id,
        status
    })
}


exports.serverActiveStatus = (req, res) => {
    res.status(200).render('serverStatus')
}


exports.proxyAccess = (req, res) => {
    res.status(200).render('proxyAccess')
}



exports.addPugUser = async (req, res) => 
    {
        try
        {
            const  { userName, email, password, status, disableDate } = req.body;
            console.log(req.body)
            console.log(userName, email, password, status)
            if(!userName | !email | !password ){
                req.session.message = "Enter all details";
                req.session.type = "alert-danger";
                return res.redirect('/pug/createUser');
            }
            const hPassword = await hashedPassword( password );
            console.log(hPassword)

            const data = await userModel.findOne({email});
            if(data)
            {
                req.session.message = "User Already Found"
                req.session.type = "alert-warning"
                res.redirect('/pug/createUser')
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
            res.redirect('/pug/userTable')
        }
        catch(error)
   {
        return res.redirect('back')
   }
}


exports.addPugServer = async (req, res) => {
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
            res.redirect('/pug/serverList');
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



exports.deletePugUser = async (req, res) => {
    try{
            const { _id } = req.params;
            console.log(_id)
            const data = await userModel.findById(_id)
            if(!data)
            {
                res.status(404).json({
                    message:"user not found"
                })
            }
            await userModel.findByIdAndDelete(_id)
            req.session.message = "user-deleted successfully"
            req.session.type = 'alert-success'
            res.redirect("/pug/userTable")
    }
    catch(error)
    {
         return res.redirect('back')
    }
}
exports.deletePugserver = async (req, res) => {
    try{
            const { _id } = req.params;
            console.log(_id)
            const data = await serverModel.findById(_id)
            if(!data)
            {
                res.status(404).json({
                    message:"user not found"
                })
            }
            await serverModel.findByIdAndDelete(_id)
            req.session.message = "Server Deleted Successfully"
            req.session.type = "alert-success"
            res.redirect("/pug/serverList")
    }
    catch(error)
    {
         return res.redirect('back')
    }
}

exports.updateActiveStatus = async (req, res) => {
    try 
    {
        const { _id } = req.params;
        var stat 
        req.body.status ? stat = 1 : stat = 0
        await userModel.findByIdAndUpdate(_id, {$set:{ status:stat }},{new:true})
            req.session.message = stat == 1 ? "User Activated Successfully" : "User Deactivated Successfully"
            req.session.type = "alert-info"
        res.redirect('/pug/userTable')  
    }
    catch(error)
    {
         return res.redirect('back')
    }
}  
exports.updateActiveStatusServer = async (req, res) => {
    try 
    {
        const { _id } = req.params;
        var stat 
        req.body.status ? stat = 1 : stat = 0
        await serverModel.findByIdAndUpdate(_id, {$set:{ status:stat }},{new:true})
        req.session.message = stat == 1 ? "User Activated Successfully" : "User Deactivated Successfully"
        req.session.type = "alert-info"
        res.redirect('/pug/serverList')  
    }
    catch(error)
    {
         return res.redirect('back')
    }
}

exports.updateServerStat = async (req, res) =>{
    const { _id } = req.params; 
    console.log(_id)
    const data = await serverModel.findById( _id )
    console.log(data)
    var status 
    data.status == true ? status = "checked" : status = ""
    res.status(200).render('serverStatus', { 
        name: data.serverName,
        id: data._id,
        status
    })
}


exports.updateServerStatus = async (req, res) => {
    try
    {
        const { _id } = req.params;
        var update ;
        req.body.status ? update = true : update = false
        await serverModel.findByIdAndUpdate(_id, { $set:{status: update}},{new:true}) 
        res.redirect('/pug/serverList')
    }
    catch(error)
   {
        return res.redirect('back')
   }
}
exports.updateServerproxy = async (req, res) =>{
    const { _id } = req.params; 
    const data = await serverModel.findById( _id )
    var status 
    data.bypassProxy == true ? status = "checked" : status = ""
    console.log(data._id)
    res.status(200).render('proxyAccess', { 
        name: data.serverName,
        id: data._id,
        status
    })
}


exports.updateServerProxy = async (req, res) => {
    try
    {
        const { _id } = req.params;
        var update;
        req.body.bypassProxy ? update = true : update = false
        await serverModel.findByIdAndUpdate(_id, { $set:{bypassProxy: update}},{new:true}) 
        res.redirect('/pug/serverList')
    }
    catch(error)
    {
         return res.redirect('back')
    }
}
exports.serverAllot = async (req, res) => {
    const { id } = req.params;
    console.log(id)
    const data = await userModel.findById(id).populate('servers')
    var servers = await serverModel.find().select('-bypassProxy -password')
   
    servers = servers.filter(server => 
        !data.servers.some(userServer => userServer._id.equals(server._id)) &&
        !server.users.includes(id) // Assuming `server.users` is an array of user IDs
    );
    console.log(servers)
    res.render('serverAllotment',{ data, servers })
}

exports.addServerToUser = async (req, res) => {
    const { id1, id2 } = req.params;
    await userModel.findByIdAndUpdate(id1, { $addToSet: { servers: id2  }},{ new:true })
    await serverModel.findByIdAndUpdate(id2, { $addToSet: { users: id1 }},{ new:true })
    req.session.message = "Server Alloted Successfully"
    res.session.type="alert-success"
    res.redirect(`/pug/serverAllotment/${id1}`)
}


// cloud server
exports.connectServer= async (req, res) => {
        const {id} = req.params;
        const server = await serverModel.findById(id);
        const password = server.password;
        const encodedPassword = btoa(password);
        console.log(encodedPassword);  
        // const encodedPassword = Buffer.from(password).toString("base64"); // Encode password  
        req.session.message = "file fetch successfully"
        req.session.type="alert-success"
        res.render('serverConnection',{
            server,
            password: encodedPassword,
        })
}

exports.navigateFolder= async (req, res) => {
    const {id} = req.params;
    const folderPath = req.query.path || '/home/newuser';
    const server = await serverModel.findById(id);
        // Split the path into parts
    const pathParts = folderPath.split("/").filter(Boolean); // Remove empty strings
     // Generate breadcrumbs with links
     let breadcrumbPaths = [];
     let accumulatedPath = "";
        pathParts.forEach((folder, index) => {
            accumulatedPath += `/${folder}`;
            breadcrumbPaths.push({ name: folder, path: accumulatedPath });
        });
        var data ={
            host:server.hostToConnect,
            port: 22,
            username:server.serverName,
            password:server.password,
        }
        const sftp = new SFTPService();
        await sftp.connect(data);
        const files = await sftp.listingFiles(folderPath);
        await sftp.disconnect();
        console.log(folderPath)
        req.session.message = "file fetch successfully"
        req.session.type="alert-success"
        res.render('sftpManager',{
            server,
            files,
            currentPath :folderPath,
            breadcrumbPaths
        })
}


// create folder 
exports.createFolder= async (req, res) => {
    const { id } = req.params;
    const { folderName } = req.body
    try{
    const server = await serverModel.findById(id);
    if (!server)
        {
            console.log("server not available")
            req.session.message = "no path detected"
            return res.status(400).json({
                message:"no path detected"
            })
        }
    var data ={
        host:server.hostToConnect,
        port: 22,
        username:server.serverName,
        password:server.password,
    }
    console.log(folderName)
    if (!folderName)
        {
            console.log("folder not available")
            req.session.message = "no folder detected"
            return res.status(400).json({
                message:"no path detected"
            });
    }
    const sftp = new SFTPService();
    await sftp.connect(data);
    // Create the folder
     await sftp.createFolder(folderName);
     await sftp.disconnect();
     req.session.message = "folder created successfully"
     req.session.type = "alert-success"
     res.redirect("back")
        }
    catch(err)
    {
        console.log(err.message)
    }
};


exports.downloads = async (req, res) => {
    try {
        const { id } = req.params;
        let { selectedFiles } = req.body;

        const files = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles];

        if (!files.length || files[0] === undefined) {
            return res.status(400).json({ message: "No files selected for download." });
        }

        const server = await serverModel.findById(id);
        if (!server) {
            return res.status(400).json({ message: "No server detected" });
        }

        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: 22,
            username: server.serverName,
            password: server.password,
        });

        const downloadDir = path.join(__dirname, "../downloads");
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }

        const downloadedFiles = [];
        for (let remotePath of files) {
            const localPath = path.join(downloadDir, path.basename(remotePath));
            await sftp.downloadFile(remotePath, localPath);
            downloadedFiles.push(localPath);
        }

        await sftp.disconnect();
            console.log("sftp disconnected")
        const zipFilePath = path.join(__dirname, "../downloads/downloaded_files.zip");
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        archive.pipe(output);
        downloadedFiles.forEach((file) => archive.file(file, { name: path.basename(file) }));
        archive.finalize();

        output.on("close", () => {
            res.download(zipFilePath, "downloaded_files.zip", (err) => {
                if (err) console.error("Download error:", err);
                fs.unlinkSync(zipFilePath);
                downloadedFiles.forEach((file) => fs.unlinkSync(file));
            });
        });
        console.log("Download completed.");

    } catch (error) {
        console.error("Download error:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};


exports.multiDownload = async (req, res) => {
    try {
        const { files } = req.body;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files selected." });
        }

        const zipFilePath = path.join(__dirname, "../files/downloaded_files.zip");
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        archive.pipe(output);

        files.forEach(file => {
            let filePath = path.join(__dirname, "../uploads", file);
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: path.basename(file) });
            }
        });

        archive.finalize();

        output.on("close", () => {
            res.download(zipFilePath, "downloaded_files.zip", (err) => {
                if (err) console.error("Download error:", err);
                fs.unlinkSync(zipFilePath); // Delete the zip after download
            });
        });

    } catch (error) {
        console.error("Multi-download error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};


exports.connectToastMess = async (req, res) => {
    res.render('serverConnection',{
        message:" Temp Success"
    });
}
exports.updateDisableDate = async (req, res) => {
    try {
        const { userId, disableDate } = req.body;
        console.log(req.body);
        if (disableDate) {
            const disableDateTime = new Date(disableDate);
            if (disableDateTime <= new Date()) {
                req.session.message ="Selected Date must Above Current Date"
                req.session.type = "alert-info"
                // return res.status(400).json({ success: false, message: "Disable date must be in the future." });
            }
            req.session.message = "Disable data updated Successfully"
            req.session.type="alert-success"
            await userModel.findByIdAndUpdate(userId, { disableDate: disableDateTime });
        } else {
            req.session.message = "Disable data updated Successfully"
            req.session.type="alert-warning"
            await userModel.findByIdAndUpdate(userId, { $unset: { disableDate: "" } });
        }
          
    }  
    catch(error)
    {
         return res.redirect('back')
    }
};



cron.schedule("*/10 * * * *", async () => {
    const now = new Date();
    await userModel.updateMany(
        { disableDate: { $lte: now } },
        { status: 0 }
    );
    console.log("Checked and disabled expired users.");
});



exports.updateDisableDateServer = async (req, res) => {
    try {
        const { serverId, disableDate } = req.body;
        console.log(req.body);
        if (disableDate) {
            const disableDateTime = new Date(disableDate);
            if (disableDateTime < new Date()) {
                 req.session.message ="Selected Date must Above Current Date"
                 req.session.type = "alert-info"
                // return res.status(400).json({ success: false, message: "Disable date must be in the future." });
            }
            req.session.message = "Disable data updated Successfully"
            req.session.type="alert-success"
            await serverModel.findByIdAndUpdate(serverId, { disableDate: disableDateTime });
        } 
        else {
            req.session.message = "Disable data updated Successfully"
            req.session.type="alert-warning"
            await serverModel.findByIdAndUpdate(serverId, { $unset: { disableDate: "" } });
        }

        res.json({ success: true, message: "Server disable date updated" });
    }  catch(error)
    {
         return res.redirect('back')
    }
};


cron.schedule("*/10 * * * *", async () => {
    const now = new Date();
    await serverModel.updateMany(
        { disableDate: { $lte: now } },
        { status: "disabled" }
    );
    console.log("Checked and disabled expired servers.");
});

exports.sftpfileManager = async (req, res) => {
    req.session.message = "Success"
    req.session.type = "alert-success"
    res.render('fileManager2')
}


