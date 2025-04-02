const serverModel = require("../models/serverModel")
const serverService = require("../services/serverServices")
const path = require('path');
const fs = require("fs");
const multer = require("multer");
const archiver = require("archiver");
const busboy = require("busboy");

//  server
const SFTPService = require("../services/sftpServices");
const sftp = new SFTPService()

exports.initalizeServerFolder = async ( req, res ) =>{
   try {
    const { id } = req.params;
    const server = await serverModel.findById(id);
    const folderPath = req.query.path || '/home/newuser';  
   
    const pathParts = folderPath.split("/").filter(Boolean);
    let breadcrumbPaths = [];
    let accumulatedPath = "";
    
    pathParts.forEach((folder) => {
        accumulatedPath += `/${folder}`;
        breadcrumbPaths.push({ name: folder, path: accumulatedPath });
    });


    if(server){
        res.render('sftpManager3', { 
            server,
            currentPath:folderPath,
            breadcrumbPaths: [],
            message:"server found" 
        })
    }
    else{
        res.render('sftpManager3', { message:"server not found" })
    }
   } 
   catch (error)
        {
        res.render('sftpManager3', { message:"error while fetch server" })
    }
} 
exports.navigateFolder2 = async (req, res) => {
    try {
        const { id } = req.params;
        const folderPath = req.query.path || '/home/newuser';     
        console.log("Requested Path:", folderPath);
        const server = await serverModel.findById(id);
        if (!server) {
            return res.status(404).json({
                server: null,
                files: [],
                currentPath: folderPath,
                breadcrumbPaths: [],
                errorMessage: "Server not found!",
            });
        }

        // Generate breadcrumbs with links
        const pathParts = folderPath.split("/").filter(Boolean);
        let breadcrumbPaths = [];
        let accumulatedPath = "";
        
        pathParts.forEach((folder) => {
            accumulatedPath += `/${folder}`;
            breadcrumbPaths.push({ name: folder, path: accumulatedPath });
        });

        const sftpConfig = {
            host: server.hostToConnect,
            port: 22,
            username: server.serverName,
            password: server.password,
        };

        const sftp = new SFTPService();
        try {
            await sftp.connect(sftpConfig);
            const files = await sftp.listingFiles2(folderPath);
            await sftp.disconnect();
            
            req.session.currentP = folderPath;
            req.session.message = "Files fetched successfully!";
            req.session.type = "alert-success";

            res.status(200).json({
                status: true,
                message:"Files fetched successfully!",
                server,
                files,
                currentPath: folderPath,
                breadcrumbPaths,
                errorMessage: null, // No error
            });
        } catch (sftpError) {
            console.error("SFTP Error:", sftpError.message);
            res.status(404).json({
                status: false,
                server,
                files: [],
                currentPath: folderPath,
                breadcrumbPaths,
                errorMessage: "Failed to connect to SFTP!",
            });
        }
    } catch (error) {
        console.error("Error in navigateFolder:", error.message);
        res.status(500).json({
            status: false,
            server: null,
            files: [],
            currentPath: "/home/newuser",
            breadcrumbPaths: [],
            errorMessage: "An unexpected error occurred!",
        });
    }
};



exports.createFolder = async (req, res) => {
    const { id } = req.params;
    const { folderName } = req.body
    console.log(req.params, req.body);
    console.log(folderName)
    try{
    const server = await serverModel.findById(id);
    if (!server)
        {
            console.log("server not available")
            return res.status(400).json({ message:"server not detected" })
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
    res.status(200).json({
        status:"Success",
        message:"folder created successfully",
        type:"alert-success",   
    })
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

        console.log("Received files:", selectedFiles);
        if (!selectedFiles || selectedFiles.length === 0) {
            return res.status(400).json({ message: "No files selected for download." });
        }

        const server = await serverModel.findById(id);
        if (!server) return res.status(400).json({ message: "Server not found" });

        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: 22,
            username: server.serverName,
            password: server.password,
        });

        const downloadDir = path.join(__dirname, "../downloads");
        if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

        const downloadedFiles = new Set();

        for (const remotePath of selectedFiles) {
            const localPath = path.join(downloadDir, path.basename(remotePath));

            //  Skip duplicate downloads
            if (downloadedFiles.has(localPath)) {
                console.warn(`Skipping duplicate download: ${localPath}`);
                continue;
            }

            await sftp.downloadFile(remotePath, localPath);
            downloadedFiles.add(localPath);
        }

        await sftp.disconnect();
        console.log("SFTP Disconnected");

        // 🔹 Create ZIP archive
        const zipFilePath = path.join(downloadDir, "downloaded_files.zip");
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        archive.pipe(output);
        downloadedFiles.forEach((file) => {
            if (fs.existsSync(file)) {
                console.log(`Adding to ZIP: ${file}`);
                archive.file(file, { name: path.basename(file) });
            } else {
                console.warn(`Skipping missing file: ${file}`);
            }
        });

        await archive.finalize();

        output.on("close", () => {
            console.log("ZIP File Created:", zipFilePath);

            res.download(zipFilePath, "downloaded_files.zip", (err) => {
                if (err) {
                    console.error("Download error:", err.message);
                    return res.status(500).json({ message: "Error downloading file." });
                }
            
                console.log("Download complete. Cleaning up files...");
                setTimeout(() => { //  Wait before deleting
                    downloadedFiles.forEach((file) => {
                        try {
                            if (fs.existsSync(file)) {
                                const stats = fs.statSync(file);
                                if (stats.isDirectory()) {
                                    console.log(`Deleting folder: ${file}`);
                                    fs.rmSync(file, { recursive: true, force: true });
                                } else {
                                    console.log(`Deleting file: ${file}`);
                                    fs.unlinkSync(file);
                                }
                            }
                        } catch (error) {
                            console.warn(`Failed to delete: ${file}`, error);
                        }
                    });
            
                    if (fs.existsSync(zipFilePath)) {
                        fs.unlinkSync(zipFilePath);
                        console.log("Deleted ZIP file.");
                    }
                }, 3000); //  Wait 3 seconds before deleting files
            });
            
        });
        res.status(200).json({ message: "Download started.", status:true});
    } catch (error) {
        console.error("Download Error:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};


exports.downloads2 = async (req, res) => {
    try {
        const { id } = req.params;
        let { selectedFiles } = req.body;
        console.log(req.params, req.body)
        if (!selectedFiles || selectedFiles.length === 0) {
            return res.status(400).json({ message: "No files or folders selected for download." });
        }

        const server = await serverModel.findById(id);
        if (!server) return res.status(404).json({ message: "Server not found" });

        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: 22,
            username: server.serverName,
            password: server.password,
        });

        const downloadDir = path.join(__dirname, "../downloads");
        if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

        const downloadedFiles = new Set();

        // ✅ Recursively download folders
        async function downloadFolder(remoteFolder, localFolder) {
            if (!fs.existsSync(localFolder)) fs.mkdirSync(localFolder, { recursive: true });

            const fileList = await sftp.list(remoteFolder);
            for (const file of fileList) {
                const remotePath = `${remoteFolder}/${file.name}`;
                const localPath = path.join(localFolder, file.name);

                if (file.type === "d") {
                    console.log(`Downloading folder: ${remotePath}`);
                    await downloadFolder(remotePath, localPath);
                } else {
                    console.log(`Downloading file: ${remotePath}`);
                    await sftp.downloadFile(remotePath, localPath);
                    downloadedFiles.add(localPath);
                }
            }
        }

        // ✅ Process selected files and folders
        for (const remotePath of selectedFiles) {
            const unixRemotePath = remotePath.replace(/\\/g, "/"); // Ensure UNIX path
            const localPath = path.join(downloadDir, path.basename(unixRemotePath));

            if (downloadedFiles.has(localPath)) {
                console.warn(`Skipping duplicate download: ${localPath}`);
                continue;
            }

            try {
                const stat = await sftp.stat(unixRemotePath);
                if (!stat) {
                    console.warn(`Skipping ${unixRemotePath}: File does not exist`);
                    continue;
                }

                if (stat.isDirectory) {
                    console.log(`Downloading folder: ${unixRemotePath}`);
                    await downloadFolder(unixRemotePath, localPath);
                } else {
                    console.log(`Downloading file: ${unixRemotePath}`);
                    await sftp.downloadFile(unixRemotePath, localPath);
                    downloadedFiles.add(localPath);
                }
            } catch (err) {
                console.warn(`Skipping ${unixRemotePath}: Unable to get stats`, err);
            }
        }

        await sftp.disconnect();
        console.log("SFTP Disconnected");

        // ✅ Create ZIP archive
        const zipFilePath = path.join(downloadDir, "downloaded_files.zip");
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        archive.pipe(output);
        downloadedFiles.forEach((file) => {
            if (fs.existsSync(file)) {
                console.log(`Adding to ZIP: ${file}`);
                archive.file(file, { name: path.relative(downloadDir, file) });
            } else {
                console.warn(`Skipping missing file: ${file}`);
            }
        });

        output.on("close", async () => {
            console.log("ZIP File Created:", zipFilePath);

            // Send ZIP file as a response
            res.download(zipFilePath, "downloaded_files.zip", async (err) => {
                if (err) {
                    console.error("Download error:", err.message);
                    return res.status(500).json({ message: "Error downloading file." });
                }

                console.log("Download complete. Cleaning up files...");

                // Cleanup files
                downloadedFiles.forEach((file) => {
                    if (fs.existsSync(file)) fs.unlinkSync(file);
                });

                if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);
                console.log("Deleted ZIP file.");
            });
        });

        await archive.finalize();
    } catch (error) {
        console.error("Download Error:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};




// Multer storage configuration (Temporary upload folder)
const upload = multer({ dest: "uploads/" }).array("files", 10);

exports.uploadFiles = async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files; // Get uploaded files
        const { path: remotePath } = req.query; ;
        const { uploadId } = req.body;

        
        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files selected for upload." });
        }

        const server = await serverModel.findById(id);
        if (!server) {
            return res.status(400).json({ message: "Server not found." });
        }
        console.log(uploadId)
        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: 22,
            username: server.serverName,
            password: server.password,
        });

        for (let file of files) {
            const localFilePath = file.path;
            const remoteFilePath = `${remotePath}/${file.originalname}`; // Change as needed
            console.log(remotePath)
                if (fs.existsSync(localFilePath)) {
                    await sftp.uploadFiles2(localFilePath, remoteFilePath, uploadId);
                    // uploadedFiles.push(remoteFilePath);
                    fs.unlinkSync(localFilePath); // Delete after upload
                } 
        }
        await sftp.disconnect();
        res.status(200).send({ status:true, message:"file/folder uploaded successfully", uploadId: uploadId})
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Multer storage configuration (Temporary upload folder)


exports.uploadFiles3 = async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files; // Get uploaded files
        const { path: remotePath, uploadId } = req.query; // Use query instead of req.body

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files selected for upload." });
        }

        const server = await serverModel.findById(id);
        if (!server) {
            return res.status(400).json({ message: "Server not found." });
        }

        console.log("Upload ID:", uploadId);

        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: 22,
            username: server.serverName,
            password: server.password,
        });

        for (let file of files) {
            const localFilePath = file.path;
            const remoteFilePath = `${remotePath}/${file.originalname}`;
            console.log("Uploading to:", remoteFilePath);

            if (fs.existsSync(localFilePath)) {
                await sftp.uploadFiles2(localFilePath, remoteFilePath, uploadId);
                // Safe file deletion after successful upload
                try {
                    fs.unlinkSync(localFilePath);
                } catch (err) {
                    console.error(`Failed to delete temp file ${localFilePath}:`, err.message);
                }
            }
        }

        res.status(200).send({ status: true, message: "File(s) uploaded successfully", uploadId });

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Internal server error." });

    }
    finally {
        if (sftp && sftp.client && sftp.client.sftp) {
            await sftp.disconnect().catch(err => console.error("SFTP Disconnect Error:", err.message));
        }
    }
};

const uploadProgress = {}; // Store progress per session
exports.uploadFiles2 = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(500).json({ message: "Upload failed", error: err });
            }

            const { id } = req.params;
            const files = req.files;
            const { path: remotePath } = req.query;
            const uploadId = Date.now().toString();
            console.log(req.files, req.query, req.params)
            if (!files || files.length === 0) {
                return res.status(400).json({ message: "No files selected for upload." });
            }

            const server = await serverModel.findById(id);
            if (!server) {
                return res.status(400).json({ message: "Server not found." });
            }

            const sftp = new SFTPService();
            await sftp.connect({
                host: server.hostToConnect,
                port: 22,
                username: server.serverName,
                password: server.password,
            });

            let uploadedSize = 0;
            let totalSize = files.reduce((acc, file) => acc + file.size, 0);
            uploadProgress[uploadId] = 0;

            for (let file of files) {
                const localFilePath = file.path;
                const remoteFilePath = `${remotePath}/${file.originalname}`;

                if (fs.existsSync(localFilePath)) {
                    const stream = fs.createReadStream(localFilePath);
                    let chunkSize = 0;

                    stream.on("data", (chunk) => {
                        chunkSize += chunk.length;
                        uploadedSize += chunk.length;
                        uploadProgress[uploadId] = Math.round((uploadedSize / totalSize) * 100);
                    });

                    await sftp.uploadFile(stream, remoteFilePath);
                    fs.unlinkSync(localFilePath); // Delete after upload
                } else {
                    console.error(`File not found: ${localFilePath}`);
                }
            }

            await sftp.disconnect();
            delete uploadProgress[uploadId]; // Cleanup after completion
            res.json({ message: "File upload successful", uploadId, progress: 100, status:true });
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Internal server error.", status:false});
    }
};



exports.copyItem = async (req, res) => {
    const { serverId, srcPath, destPath } = req.body;
    
    try {
        const server = await serverModel.findById(serverId);
        if (!server) return res.status(400).json({ message: "Server not found." });

        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: 22,
            username: server.serverName,
            password: server.password,
        });

        await sftp.copyItem(srcPath, destPath);
        await sftp.disconnect();

        res.json({ message: "File copied successfully." });
    
    } catch (error) {
        console.error("Copy Error:", error);
        res.status(500).json({ message: "Error copying file." });
    }
};

exports.moveItem = async (req, res) => {
    const { serverId, srcPath, destPath } = req.body;

    try {
        const server = await serverModel.findById(serverId);
        if (!server) return res.status(400).json({ message: "Server not found." });

        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: 22,
            username: server.serverName,
            password: server.password,
        });

        await sftp.moveItem(srcPath, destPath);
        await sftp.disconnect();

        res.status(200).json({ message: "File moved successfully." , status:true});
        // res.redirect(req.get("Referrer") || "/");
    } catch (error) {
        console.error("Move Error:", error);
        res.status(500).json({ message: "Error moving file.", status:false });
    }
};

exports.renameItem = async (req, res) => {
    const { serverId, oldPath, newPath } = req.body;

    try {
        const server = await serverModel.findById(serverId);
        if (!server) return res.status(400).json({ message: "Server not found." });

        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: 22,
            username: server.serverName,
            password: server.password,
        });

        await sftp.renameItem(oldPath, newPath);
        await sftp.disconnect();
        res.json({ message: "File renamed successfully.", status:true }); 
    } catch (error) {
        console.error("Rename Error:", error);
        res.status(500).json({ message: "Error renaming file.", status:false});
    }
};

exports.deleteItem = async (req, res) => {
    const { serverId, filePath } = req.body;
    try {
        const server = await serverModel.findById(serverId);
        if (!server) return res.status(400).json({ message: "Server not found." });
        console.log(serverId, filePath)
        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: 22,
            username: server.serverName,
            password: server.password,
        });
        await sftp.deleteItem(filePath);
        await sftp.disconnect();
        res.status(204).json({ message: "File deleted successfully." , status:true});
    } catch (error) {
        console.error("Delete Error:", error.message);
        res.status(500).json({ message: "Error deleting file." , status:false});
    }
};

exports.deleteItem2 = async (req, res) => {
    const { serverId, filePaths } = req.body; // Expecting an array of file paths
                  
    try {
        const server = await serverModel.findById(serverId);
        if (!server) return res.status(400).json({ message: "Server not found." });
        console.log(req.body.filePaths);
        console.log("Server ID:", serverId);
        console.log("Files to delete:", filePaths);

        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: 22,
            username: server.serverName,
            password: server.password,
        });

        let results = [];
        
        for (const filePath of filePaths) {
            try {
                await sftp.deleteItem(filePath);
                results.push({ filePath, status: "Deleted" });
            } catch (error) {
                console.error(`Failed to delete ${filePath}:`, error.message);
                results.push({ filePath, status: "Failed", error: error.message });
            }
        }

        await sftp.disconnect();

        res.status(200).json({ message: "Deletion process completed.", results });

    } catch (error) {
        console.error("Delete Error:", error.message);
        res.status(500).json({ message: "Error deleting files.", error: error.message });
    }
};



exports.copyItem2 = async (req, res) => {
    try {
        const { remotePath } = req.body;
        if (!remotePath) return res.status(400).json({ message: "No path provided" });
        console.log(remotePath);
        req.session.copiedPath = remotePath;  // Store in session
        req.session.message = "Item copied successfully";
        req.session.type = "alert-success";
        res.redirect(req.get("Referrer") || "/");
    } catch (error) {
        console.error(" Copy Error:", error.message);
        req.session.message = "Copy failed";
        req.session.type = "alert-danger";
        res.redirect(req.get("Referrer") || "/");
    }
};

exports.copyItem3 = async (req, res) => {
    try {
        const { remotePath, action } = req.body;
        if (!remotePath) return res.status(400).json({ message: "No path provided" });
        console.log(remotePath);

        req.session.copiedPath = remotePath;  
        req.session.message = "Item copied successfully";
        req.session.action = action;
        req.session.type = "alert-success";
        res.status(200).json({
            status: true,
            message:"Item copied successfully",
        })
    } 
    catch (error) {
        console.error("Copy Error:", error.message);
        req.session.message = "Copy failed";
        req.session.type = "alert-danger";
        return res.status(500).json({ message: "Copy failed", success: false });
    }
};


exports.cutItem = async ( req, res ) => {
    try {
        const {remotePath, action} = req.body;
        if(!remotePath){
            return res.status(400).json({ status:false, message:"path not found" })
        }
        console.log(remotePath)
        req.session.copiedPath = remotePath ;
        req.session.action = action
        req.session.message = "item cut successfully",
        req.session.type = "alert-info"
        return res.status(200).json({ status:true, message: "file/folder cut successfully" })
    } 
    catch (error) {
        req.session.message = "error while fetch api",
        req.session.type = "alert-warning"
        return res.status(500).json({ status:false, message: "error while fetch api" }) 
    }
}


exports.copyMultipleItems = async (req, res) => {
    try {
        const { files, action } = req.body;  // Expecting an array of paths
        console.log(req.body.files)
        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ message: "No files selected for copying" });
        }

        console.log(" Files copied:", files);

        //  Store multiple copied paths in session
        req.session.copiedPaths = files;  
        req.session.message = `${files.length} items copied successfully`;
        req.session.type = "alert-success";
        req.session.action = action;
        res.status(200).json({
            status: true,
            message: `${files.length} items copied successfully`,
        })
    } catch (error) {
        console.error("Copy Error:", error.message);
        req.session.message = "Copy failed";
        req.session.type = "alert-danger";
        return res.status(500).json({ message: "Copy failed", success: false });
    }
};



exports.cutMultipleItems = async ( req, res ) => {
    try {
        const { files , action} = req.body;  // Expecting an array of paths
        console.log(req.body.files)
        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ message: "No files selected for copying" });
        }

        console.log("Files copied:", files);

        //  Store multiple copied paths in session
        req.session.copiedPaths = files;  
        req.session.message = `${files.length} items copied successfully`;
        req.session.type = "alert-success";
        req.session.action = action;
        res.status(200).json({
            status: true,
            message: `${files.length} items copied successfully`,
        })
    } catch (error) {
        console.error("Copy Error:", error.message);
        req.session.message = "Copy failed";
        req.session.type = "alert-danger";
        return res.status(500).json({ message: "Copy failed", success: false });
    }
}


//  Paste File/Folder from Session
exports.pasteItem2 = async (req, res) => {
    try {
        const { id } = req.params; 
       const { path } = req.query;
        console.log(req.body)
        console.log("path:"+ path + " data: "  )
        const  destinationPath  = req.session.currentP;
        const copiedPath = req.body;

        if (!copiedPath) return res.status(400).json({ message: "No copied item found" });
        if (!destinationPath) return res.status(400).json({ message: "No destination provided" });

        const server = await serverModel.findById(id);
        if (!server) return res.status(400).json({ message: "Server not found" });

        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: 22,
            username: server.serverName,
            password: server.password,
        });

        const stats = await sftp.stat(copiedPath);
        if(req.session.action === "copy")
        {
            if (stats.isDirectory) {
                await sftp.copyFolder(copiedPath, destinationPath);
            }
            else {
                await sftp.copyFile(copiedPath, destinationPath);
            }
        }
        else
        {   
            if(stats.isDirectory)
               {
                    await sftp.moveFolder(copiedPath, destinationPath)
               } 
               else{
                    await sftp.moveFile(copiedPath, destinationPath)
               }
        }

        await sftp.disconnect();
        console.log("Paste Completed");

        req.session.message = "Item pasted successfully";
        req.session.type = "alert-success";
        res.status(200).json({ 
            status: true,
            message: "Item pasted successfully" 
        });
    } catch (error) {
        console.error("Paste Error:", error.message);
        req.session.message = "Paste failed";
        req.session.type = "alert-danger";
        res.status(500).json({ message: "Paste failed", success: false });
    }
};

exports.pasteMultipleItems = async (req, res) => {
    try {
        const { id } = req.params;  // Server ID
        const { path } = req.query
        const destinationPath = path;
        const copiedPaths = req.body;  // Array of copied items

        if (!copiedPaths || copiedPaths.length === 0) {
            return res.status(400).json({ message: "No copied items found" });
        }
        if (!destinationPath) {
            return res.status(400).json({ message: "No destination provided" });
        }

        const server = await serverModel.findById(id);
        if (!server) {
            return res.status(400).json({ message: "Server not found" });
        }

        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: 22,
            username: server.serverName,
            password: server.password,
        });

        for (const copiedPath of copiedPaths) {
            try {
                const stats = await sftp.stat(copiedPath);
                if(req.session.action === "copy"){
                    if (stats.isDirectory) {
                        await sftp.copyFolder(copiedPath, destinationPath);
                    } else {
                        await sftp.copyFile(copiedPath, destinationPath);
                    }
                }else{
                    if (stats.isDirectory) {
                        await sftp.moveFolder(copiedPath, destinationPath);
                    } else {
                        await sftp.moveFile(copiedPath, destinationPath);
                    } 
                }

                console.log(`Successfully pasted: ${copiedPath}`);
            } catch (copyError) {
                console.error(`Error pasting ${copiedPath}:`, copyError.message);
            }
        }
        await sftp.disconnect();
        req.session.message = `${copiedPaths.length} items pasted successfully`;
        req.session.type = "alert-success";
        res.status(200).json({
            ststus:true,
            message: `${copiedPaths.length} items pasted successfully` 
        });
    } 
    catch (error) {
        console.error("Paste Error:", error.message);
        req.session.message = "Paste failed";
        req.session.type = "alert-danger";
        res.ststus(500).json({ message: "Paste failed", success: false });
    }
};
