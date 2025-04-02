const serverService = require("../services/serverServices")
const path = require('path');
const fs = require("fs");
const archiver = require("archiver");

//  server
const SFTPService = require("../services/sftpServices");
const sftp = new SFTPService()

// used
exports.navigateFolder2 = async (req, res) => {
    try {
        const { id } = req.params;
        const folderPath = req.query.path || '/home/newuser';     
        console.log("Requested Path:", folderPath);
        const server = await serverService.getServerById(id);
        if (!server) {
            return res.status(404)
            .json({ server: null, files: [], currentPath: folderPath, breadcrumbPaths: [], errorMessage: "Server not found!" });
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
            port: server.port,
            username: server.serverName,
            password: server.password,
        };
        const sftp = new SFTPService();
        try {
            await sftp.connect(sftpConfig);
            const files = await sftp.listingFiles2(folderPath);
            await sftp.disconnect();
            res.status(200)
            .json({ status: true, message:"Files fetched successfully!", server, files, currentPath: folderPath, breadcrumbPaths});
        } 
        catch (err)
            {
                console.error("SFTP Error:", err.message);
                res.status(404)
                .json({ status: false, server, files: [], currentPath: folderPath, breadcrumbPaths, message: "Failed to connect to SFTP!"+err.message });
            }
    } 
    catch (error) {
        console.error("Error in navigateFolder:", error.message);
        res.status(500).json({ status: false, server: null, files: [], currentPath: "/home/newuser",  breadcrumbPaths: [], message: "An unexpected error occurred!" });
    }
};

// used
exports.createFolder = async (req, res) => {
    const { id } = req.params;
    const { folderName } = req.body;
    try{
    const server = await serverService.getServerById(id);
    if (!server)  return res.status(404).json({ status:false, message:"Server NOt Found" })
        
    var data ={
        host:server.hostToConnect,
        port: server.port,
        username:server.serverName,
        password:server.password,
    }
    if (!folderName) return res.status(404).json({ message:"Folder Path Not Detected" });
    
    const sftp = new SFTPService();
    await sftp.connect(data);
    // Create the folder
     await sftp.createFolder(folderName);
     await sftp.disconnect();
     return res.status(200).json({ message:"folder created successfully" })
    }
    catch(err)
    {
       return res.status(500).json({message: "Error While Creating Server"+err.message});
    }
};

//used
exports.downloads2 = async (req, res) => {
    try {
        const { id } = req.params;
        let { selectedFiles } = req.body;
        if (!selectedFiles || selectedFiles.length === 0) return res.status(400).json({ message: "No files or folders selected for download." });

        const server = await serverService.getServerById(id);
        if (!server) return res.status(404).json({ message: "Server not found" });

        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: server.port,
            username: server.serverName,
            password: server.password,
        });

        const downloadDir = path.join(__dirname, "../downloads");
        if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

        const downloadedFiles = new Set();

        // Recursively download folders
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

        //  Process selected files and folders
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

        //  Create ZIP archive
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
    } 
    catch (error) {
        return res.status(500).json({ message: "Error While Download"+error.message });
    }
};

//used
exports.uploadFiles3 = async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files; // Get uploaded files
        const { path: remotePath } = req.query; // Use query instead of req.body

        if (!files || files.length === 0) return res.status(400).json({ message: "No files selected for upload." });
        

        const server = await serverService.getServerById(id);
        if (!server) return res.status(400).json({ message: "Server not found." });
        
        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: server.port,
            username: server.serverName,
            password: server.password,
        });

        for (let file of files) {
            const localFilePath = file.path;
            const remoteFilePath = `${remotePath}/${file.originalname}`;
            console.log("Uploading to:", remoteFilePath);

            if (fs.existsSync(localFilePath)) {
                await sftp.uploadFiles2(localFilePath, remoteFilePath);
                // Safe file deletion after successful upload
                try {
                    fs.unlinkSync(localFilePath);
                } catch (err) {
                    console.error(`Failed to delete temp file ${localFilePath}:`, err.message);
                }
            }
        }
        return res.status(200).send({ status: true, message: "File(s) uploaded successfully" });
    } 
    catch (error) {
        console.error("Upload error:", error);
        return res.status(500).json({ message: "Internal server error."});
    }
    finally {
        if (sftp && sftp.client && sftp.client.sftp) {
            await sftp.disconnect().catch(err => console.error("SFTP Disconnect Error:", err.message));
        }
    }
};

//used
exports.renameItem = async (req, res) => {
    const { serverId, oldPath, newPath } = req.body;

    try {
        const server = await serverService.getServerById(serverId);
        if (!server) return res.status(400).json({ message: "Server not found." });

        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: server.port,
            username: server.serverName,
            password: server.password,
        });

        await sftp.renameItem(oldPath, newPath);
        await sftp.disconnect();
        return res.json({ message: "File renamed successfully.", status:true }); 
    } catch (error) {
        console.error("Rename Error:", error);
        return res.status(500).json({ message: "Error renaming file.", status:false});
    }
};

//used
exports.deleteItem2 = async (req, res) => {
    const { serverId, filePaths } = req.body; // Expecting an array of file paths              
    try {
        const server = await serverService.getServerById(serverId);
        if (!server) return res.status(400).json({ message: "Server not found." });
        console.log(req.body.filePaths);
        console.log("Server ID:", serverId);
        console.log("Files to delete:", filePaths);

        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: server.port,
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
        return res.status(200).json({ message: "Deletion process completed.", results });
    } catch (error) {
        console.error("Delete Error:", error.message);
        return res.status(500).json({ message: "Error deleting files."+error.message });
    }
};

//used
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

//used
exports.pasteMultipleItems = async (req, res) => {
    try {
        const { id } = req.params;  // Server ID
        const { path } = req.query
        const destinationPath = path;
        const copiedPaths = req.body;  // Array of copied items

        if (!copiedPaths || copiedPaths.length === 0)  return res.status(400).json({ message: "No copied items found" });
        if (!destinationPath)  return res.status(400).json({ message: "No destination provided" });
        
        const server = await serverService.getServerById(id);
        if (!server) return res.status(400).json({ message: "Server not found" });
        
        const sftp = new SFTPService();
        await sftp.connect({
            host: server.hostToConnect,
            port: server.port,
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
        return res.status(200).json({ status:true, message: `${copiedPaths.length} items pasted successfully`});
    } 
    catch (error) {
        console.error("Paste Error:", error.message);
        return res.ststus(500).json({ message: "Paste failed"+error.message, status:false });
    }
};
