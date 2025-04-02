const Client = require('ssh2-sftp-client');
const helper =  require("../services/sftpHelper")
const path = require('path');
const fs = require("fs");
const express = require('express')
const app =express();
const { createServer } = require('node:http');
const { join } = require('node:path');
const server = createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);


class SFTPService {
    constructor() {
        this.client = new Client();
    }

    async connect(option) {    
        try {
            await this.client.connect(option);
            console.log("SFTP Connected!");
        } catch (err) {
            console.error("SFTP Connection Failed:", err);
            throw err;
        }
    }

    async stat(remotePath) {
        try {
            const unixRemotePath = remotePath.replace(/\\/g, "/"); // Ensure UNIX format
            const stats = await this.client.stat(unixRemotePath);
            return stats || null;
        } catch (err) {
            if (err.code === "ENOENT") {
                console.warn(`Stat Error: ${remotePath} does not exist.`);
                return null;
            }
            console.error(`Stat Error for ${remotePath}:`, err.message);
            return null;
        }
    }
    
    
    async list(remotePath) {
        try {
            if (!this.client.sftp) await this.connect(sftpConfig); // Ensure connection
            const fileList = await this.client.list(remotePath);
            return fileList; // Returns array of { name, type, size, modifyTime }
        } catch (error) {
            console.error(`Error listing directory ${remotePath}:`, error);
            throw error;
        }
    }

    async exists(remotePath) {
        try {
            await this.client.stat(remotePath); // Try to get file/folder stats
            return true; // If successful, the file/folder exists
        } catch (error) {
            if (error.code === 'ENOENT') {
                return false; // File or folder does not exist
            }
            throw error; // Rethrow other errors
        }
    }
    


    async listingFiles(remoteDir, fileGlob) {
        console.log(`Listing ${remoteDir} ...`);
        let fileObjects;
        
        try {
            fileObjects = await this.client.list(remoteDir, fileGlob);
        } 
        catch (err) {
            console.log('Listing failed:', err);
            return [];
        }
    
        const items = await Promise.all(
            fileObjects.map(async (file) => { 
                if (file.type === 'd') {
                    return {
                        name: file.name,
                        type: "folder",
                        path: remoteDir.endsWith('/') ? `${remoteDir}${file.name}` : `${remoteDir}/${file.name}`,
                        icon: await helper.getFolderIcon(file.name) 
                    };  
                } else {
                    return {
                        name: file.name,
                        type: "file",
                        ext: await helper.extensionExtracter(file.name),
                        path: remoteDir.endsWith('/') ? `${remoteDir}${file.name}` : `${remoteDir}/${file.name}`,
                        icon: await helper.getFileIcon(file.name) 
                    };
                }
            })
        );
        return items;
    }
    async listingFiles2(remoteDir, fileGlob) {
        console.log(`Listing ${remoteDir} ...`);

        try {
            const fileObjects = await this.client.list(remoteDir, fileGlob);
            return await Promise.all(
                fileObjects.map(async (file) => ({
                    name: file.name,
                    type: file.type === 'd' ? 'folder' : 'file',
                    path: remoteDir.endsWith('/') ? `${remoteDir}${file.name}` : `${remoteDir}/${file.name}`,
                    ext: file.type !== 'd' ? await helper.extensionExtracter(file.name) : null,
                    icon: file.type === 'd' ? await helper.getFolderIcon(file.name) : await helper.getFileIcon(file.name),
                }))
            );
        } catch (err) {
            console.log('Listing failed:', err);
            return [];
        }
    }

    async uploadFile(localPath, remotePath) {
        try {
            await this.client.put(localPath, remotePath);
            console.log(` Uploaded: ${localPath} to ${remotePath}`);
        } catch (err) {
            console.error("Upload Failed:", err);
        }
    }

    async uploadFiles(localPath, remotePath, uploadId){
        try {
            const fileSize = fs.statSync(localPath).size;
            let uploadedBytes = 0;
            const stream = fs.createReadStream(localPath);
            await this.client.put(stream, remotePath,{
                step:(transferred, chunk, total) => {
                    uploadedBytes = transferred;
                    const progress = math.round(( uploadedBytes / fileSize )*100);
                    console.log(progress, uploadedBytes)
                        io.on('connection', function(socket){
                            console.log('connected')
                                io.emit(`uploadProgress-${uploadId}`, progress);
                                socket.on('disconnect', ()=>{
                                    console.log("disconnected")
                                })
                        })
                }
            });
            await this.client.end();
                io.on('connection', function(socket){
                    io.emit(`uploadProgress-${uploadId}`, 100)
                })
            
        } 
        catch (error) {
            console.error("Upload Failed:", err.message); 
        }
    }
    async uploadFiles2(localPath, remotePath, uploadId) {
        try {
            // Ensure SFTP client is connected
            if (!this.client.sftp) {
                throw new Error("SFTP connection not available.");
            }
            const fileSize = fs.statSync(localPath).size;
            let uploadedBytes = 0;
            const stream = fs.createReadStream(localPath);
    
            await this.client.put(stream, remotePath, {
                step: (transferred, chunk, total) => {
                    uploadedBytes = transferred;
                    const progress = Math.round((uploadedBytes / fileSize) * 100);
                    console.log(progress)
                    io.emit(`uploadProgress-${uploadId}`, progress);
                }
            });
            io.emit(`uploadProgress-${uploadId}`, 100);  
        } catch (err) {
            console.error("Upload Failed:", err.message);
        } 
    }
        //  Download a Single File
        async downloadFile(remotePath, localPath) {
            try {
                const unixRemotePath = remotePath.replace(/\\/g, "/"); // Convert to UNIX path
                console.log(`Downloading File: ${unixRemotePath} → ${localPath}`);
                await this.client.fastGet(unixRemotePath, localPath);
            } catch (err) {
                console.error("File Download Error:", err.message);
            }
        }
        
        // Recursively Download a Folder
        async downloadFolder(remoteFolder, localFolder) {
            try {
                const unixRemoteFolder = remoteFolder.replace(/\\/g, "/"); // Convert to UNIX path
                console.log(`Downloading Folder: ${unixRemoteFolder} → ${localFolder}`);
    
                if (!fs.existsSync(localFolder)) fs.mkdirSync(localFolder, { recursive: true });
    
                const fileList = await this.client.list(unixRemoteFolder);
                for (const file of fileList) {
                    const remoteFilePath = `${unixRemoteFolder}/${file.name}`;
                    const localFilePath = path.join(localFolder, file.name);
    
                    if (file.type === "d") {
                        await this.downloadFolder(remoteFilePath, localFilePath);
                    } else {
                        await this.downloadFile(remoteFilePath, localFilePath);
                    }
                }
            } catch (err) {
                console.error("Folder Download Error:", err);
            }
        }
    
        // Copy a File or Folder
        // async copyFile(srcPath, destPath) {
        //     try {
        //         console.log(` Copying file: ${srcPath} → ${destPath}`);
        //         const tempFile = `./temp-${Date.now()}`;
        
        //         await this.client.fastGet(srcPath, tempFile);
        
        //         //  Ensure destination directory exists
        //         await this.client.mkdir(path.dirname(destPath), true);
        
        //         //  Ensure file exists before uploading
        //         if (!fs.existsSync(tempFile)) {
        //             console.error("Temp file missing:", tempFile);
        //             throw new Error("Local file missing, copy failed.");
        //         }
        
        //         //  Ensure destination path includes a filename
        //         if (destPath.endsWith("/")) {
        //             const fileName = path.basename(srcPath);
        //             destPath = path.join(destPath, fileName);
        //         }
        
        //         await this.client.fastPut(tempFile, destPath);
        //         fs.unlinkSync(tempFile);
        //         console.log(" File Copied");
        //     } catch (err) {
        //         console.error(" Copy File Error:", err.message);
        //     }
        // }
        
  
    // Move (Cut-Paste) a File or Folder
    async moveItem(srcPath, destPath) {
        try {
        await this.client.rename(srcPath, destPath);
        console.log(`Moved from ${srcPath} to ${destPath}`);
        } catch (err) {
        console.error('Move Error:', err);
        }
    }
    async moveItems(srcPath, destPath) {
        try {
            // Ensure destination path includes filename if needed
            const isDestFolder = destPath.endsWith("/");
            const fileName = srcPath.split("/").pop(); 
            // const finalDestPath = isDestFolder ? destPath + fileName : destPath;
            console.log(path.join(destPath, fileName))
           console.log(path.posix.join(destPath, fileName))
            if(isDestFolder === false)
            {
                var finalDestPath = destPath; 
            }
            else{
                var finalDestPath = path.posix.join(destPath, fileName);
            }
            console.log(isDestFolder, fileName, finalDestPath)
            // Ensure destination folder exists
            await this.client.mkdir(destPath, true).catch(() => {}); 
    
            // Try moving file
            await this.client.rename(srcPath, finalDestPath);
            console.log(`Moved from ${srcPath} to ${finalDestPath}`);
        } catch (err) {
            console.error("Move Error:", err.message);
        }
    }
    
  
    // Rename a File or Folder
    async renameItem(oldPath, newPath) {
        try {
        await this.client.rename(oldPath, newPath);
        console.log(`Renamed ${oldPath} to ${newPath}`);
        } catch (err) {
        console.error('Rename Error:', err);
        }
    }
  
    // Delete a File or Folder
    async deleteItem(path) {
        try {
            let stats = await this.client.stat(path); 
    
            if (stats.isDirectory) {
                await this.client.rmdir(path, true); 
            } else {
                await this.client.delete(path); 
            }
    
            console.log(`Deleted: ${path}`);
        } catch (err) {
            console.error("Delete Error:", err);
            throw err; 
        }
    }
    

    // create folder 
    async createFolder(remotePath) {
        try {
            await this.client.mkdir(remotePath, true); 
            console.log(`Folder created at ${remotePath}`);
        } catch (error) {
            console.error(`Failed to create folder at ${remotePath}:`, error);
            throw error;
        }
    }

    async copyFile(srcPath, destPath) {
        try {
            console.log(` Copying file: ${srcPath} → ${destPath}`);
            const tempFile = `./temp-${Date.now()}`;
    
            await this.client.fastGet(srcPath, tempFile);
    
           
            if (!path.posix.isAbsolute(destPath)) {
                throw new Error(" Destination path must be absolute!");
            }
    
            
            const remoteExists = await this.client.exists(destPath);
            if (remoteExists === "d") {
                const fileName = path.basename(srcPath);
                destPath = path.posix.join(destPath, fileName);
            }
    
            if (!(await this.client.exists(path.posix.dirname(destPath)))) {
                console.log(" Creating remote directory:", path.posix.dirname(destPath));
                await this.client.mkdir(path.posix.dirname(destPath), true);
            }
    
          
            if (!fs.existsSync(tempFile)) {
                console.error(" Temp file does not exist:", tempFile);
                throw new Error("Local file missing, copy failed.");
            }
    
            await this.client.fastPut(tempFile, destPath);
            fs.unlinkSync(tempFile);
            console.log("File Copied to:", destPath);
        } catch (err) {
            console.error("Copy File Error:", err.message);
        }
    }
    
    
    
    
    async copyFolder(srcPath, destPath, rootFolderName = null) {
        try {
            console.log(`Copying folder: ${srcPath} → ${destPath}`);
    
          
            srcPath = path.posix.normalize(srcPath);
            destPath = path.posix.normalize(destPath);
    
       
            if (!rootFolderName) {
                rootFolderName = path.posix.basename(srcPath);
                destPath = path.posix.join(destPath, rootFolderName); 
            }
    
           
            const parentDir = path.posix.dirname(destPath);
            const parentExists = await this.client.exists(parentDir);
            if (!parentExists) {
                console.log(` Creating parent directory: ${parentDir}`);
                await this.client.mkdir(parentDir, true);
            }
   
            const folderExists = await this.client.exists(destPath);
            if (!folderExists) {
                await this.client.mkdir(destPath, true);
                console.log(` Created folder: ${destPath}`);
            }
    
           
            const fileList = await this.client.list(srcPath);
    
       
            const folders = fileList.filter((f) => f.type === "d");
            const files = fileList.filter((f) => f.type !== "d");
    
            for (const folder of folders) {
                const newSrc = path.posix.join(srcPath, folder.name);
                const newDest = path.posix.join(destPath, folder.name);
                await this.copyFolder(newSrc, newDest, rootFolderName);
            }
    

            for (const file of files) {
                const newSrc = path.posix.join(srcPath, file.name);
                const newDest = path.posix.join(destPath, file.name);
                await this.copyFile(newSrc, newDest);
            }
    
            console.log(` Folder Copied: ${destPath}`);
        } catch (err) {
            console.error(" Copy Folder Error:", err.message);
        }
    }



    async moveFile(srcPath, destPath) {
        try {
            console.log(`Moving file: ${srcPath} → ${destPath}`);

            // Ensure destination path is absolute
            if (!path.posix.isAbsolute(destPath)) {
                throw new Error("❌ Destination path must be absolute!");
            }

            // If the destination is a folder, append the filename
            const remoteExists = await this.client.exists(destPath);
            if (remoteExists === "d") {
                const fileName = path.basename(srcPath);
                destPath = path.posix.join(destPath, fileName);
            }

            // Ensure the destination folder exists
            const parentDir = path.posix.dirname(destPath);
            if (!(await this.client.exists(parentDir))) {
                console.log("Creating remote directory:", parentDir);
                await this.client.mkdir(parentDir, true);
            }

            // Move (Rename)
            await this.client.rename(srcPath, destPath);
            console.log(` File Moved: ${srcPath} → ${destPath}`);
        } catch (err) {
            console.error("Move File Error:", err.message);
        }
    }

    /** Move Folder (Cut-Paste) */
    async moveFolder(srcPath, destPath, rootFolderName = null) {
        try {
            console.log(`Moving folder: ${srcPath} → ${destPath}`);

            srcPath = path.posix.normalize(srcPath);
            destPath = path.posix.normalize(destPath);

            if (!rootFolderName) {
                rootFolderName = path.posix.basename(srcPath);
                destPath = path.posix.join(destPath, rootFolderName);
            }

            // Ensure parent directory exists
            const parentDir = path.posix.dirname(destPath);
            if (!(await this.client.exists(parentDir))) {
                console.log(`Creating parent directory: ${parentDir}`);
                await this.client.mkdir(parentDir, true);
            }

            // Attempt to move the entire folder
            try {
                await this.client.rename(srcPath, destPath);
                console.log(`Folder Moved: ${srcPath} → ${destPath}`);
                return;
            } catch (renameError) {
                console.log("Rename failed, using manual move method...");
            }

            // If rename fails, manually move files and folders
            const fileList = await this.client.list(srcPath);
            const folders = fileList.filter((f) => f.type === "d");
            const files = fileList.filter((f) => f.type !== "d");

            for (const folder of folders) {
                const newSrc = path.posix.join(srcPath, folder.name);
                const newDest = path.posix.join(destPath, folder.name);
                await this.moveFolder(newSrc, newDest, rootFolderName);
            }

            for (const file of files) {
                const newSrc = path.posix.join(srcPath, file.name);
                const newDest = path.posix.join(destPath, file.name);
                await this.moveFile(newSrc, newDest);
            }

            // Delete the original empty folder
            await this.client.rmdir(srcPath);
            console.log(` Folder Deleted after Move: ${srcPath}`);
        } catch (err) {
            console.error(" Move Folder Error:", err.message);
        }
    }



    async disconnect() {
        await this.client.end();
        console.log("SFTP Disconnected!");
    }
}
   

module.exports = SFTPService;
