const Client = require("ssh2-sftp-client");
    const fs = require("fs");
const path = require("path");
const helper = require("../services/sftpHelper");

class SFTPService {
    constructor() {
        this.client = new Client();
        this.sftp = null;
    }

    async connect(options) {
        return new Promise((resolve, reject) => {
            this.client.on("ready", () => {
                console.log("✅ SSH Connected!");

                this.client.sftp((err, sftp) => {
                    if (err) {
                        console.error("❌ SFTP Connection Failed:", err.message);
                        reject(err);
                    } else {
                        this.sftp = sftp;
                        console.log("✅ SFTP Ready!");
                        resolve();
                    }
                });
            });

            this.client.on("error", (err) => {
                console.error("❌ SSH Connection Error:", err.message);
                reject(err);
            });

            this.client.connect(options);
        });
    }

    async stat(remotePath) {
        try {
            return await this.client.stat(remotePath);  // ✅ Correct function for `ssh2-sftp-client`
        } catch (err) {
            console.error(`❌ Stat Error for ${remotePath}:`, err.message);
            throw err;
        }
    }
    
    async listingFiles(remoteDir) {
        console.log(`📂 Listing ${remoteDir} ...`);
        return new Promise((resolve, reject) => {
            this.sftp.readdir(remoteDir, async (err, fileList) => {
                if (err) {
                    console.error("❌ Listing Failed:", err.message);
                    reject(err);
                } else {
                    try {
                        const items = await Promise.all(
                            fileList.map(async (file) => ({
                                name: file.filename,
                                type: file.longname.startsWith("d") ? "folder" : "file",
                                path: remoteDir.endsWith("/") ? `${remoteDir}${file.filename}` : `${remoteDir}/${file.filename}`,
                                ext: file.longname.startsWith("d") ? null : await helper.extensionExtracter(file.filename),
                                icon: file.longname.startsWith("d") ? await helper.getFolderIcon(file.filename) : await helper.getFileIcon(file.filename),
                            }))
                        );
                        resolve(items);
                    } catch (error) {
                        console.error("❌ Processing File List Error:", error.message);
                        reject(error);
                    }
                }
            });
        });
    }

    async uploadFile(localPath, remotePath) {
        return new Promise((resolve, reject) => {
            this.sftp.fastPut(localPath, remotePath, (err) => {
                if (err) {
                    console.error("❌ Upload Failed:", err.message);
                    reject(err);
                } else {
                    console.log(`📤 Uploaded: ${localPath} → ${remotePath}`);
                    resolve();
                }
            });
        });
    }



    // ✅ Download a File
    async downloadFile(remotePath, localPath) {
        try {
            await sftp.connect(config);
            console.log("✅ SFTP Connected");

            // Use fastGet for better performance
            await sftp.fastGet(remotePath, localPath);
            console.log(`📥 Downloaded File: ${remotePath} → ${localPath}`);

            await sftp.end();
        } catch (err) {
            console.error("❌ File Download Error:", err);
        }
    }
    // ✅ Download a Folder (Recursively)
        async downloadFolder(remoteFolder, localFolder) {
            try {
                await sftp.connect(config);
                console.log("✅ SFTP Connected");

                // Ensure local folder exists
                if (!fs.existsSync(localFolder)) {
                    fs.mkdirSync(localFolder, { recursive: true });
                }

                const fileList = await sftp.list(remoteFolder);
                for (const file of fileList) {
                    const remoteFilePath = `${remoteFolder}/${file.name}`;
                    const localFilePath = path.join(localFolder, file.name);

                    if (file.type === "d") {
                        // If it's a directory, call recursively
                        await downloadFolder(remoteFilePath, localFilePath);
                    } else {
                        await sftp.fastGet(remoteFilePath, localFilePath);
                        console.log(`📥 Downloaded: ${remoteFilePath} → ${localFilePath}`);
                    }
                }

                await sftp.end();
            } catch (err) {
                console.error("❌ Folder Download Error:", err);
            }
        }
    async downloadFile(remotePath, localPath) {
        return new Promise((resolve, reject) => {
            this.sftp.fastGet(remotePath, localPath, (err) => {
                if (err) {
                    console.error("❌ Download Failed:", err.message);
                    reject(err);
                } else {
                    console.log(`📥 Downloaded: ${remotePath} → ${localPath}`);
                    resolve();
                }
            });
        });
    }

    async copyItem(srcPath, destPath) {
        try {
            console.log(`📄 Copying ${srcPath} → ${destPath}`);
            const tempFile = `./temp-${Date.now()}`;
            await this.downloadFile(srcPath, tempFile);
            await this.uploadFile(tempFile, destPath);
            fs.unlinkSync(tempFile);
            console.log(`✅ Copied Successfully`);
        } catch (err) {
            console.error("❌ Copy Error:", err.message);
        }
    }

    async moveItem(srcPath, destPath) {
        return new Promise((resolve, reject) => {
            this.sftp.rename(srcPath, destPath, (err) => {
                if (err) {
                    console.error("❌ Move Error:", err.message);
                    reject(err);
                } else {
                    console.log(`📂 Moved: ${srcPath} → ${destPath}`);
                    resolve();
                }
            });
        });
    }

    async renameItem(oldPath, newPath) {
        return new Promise((resolve, reject) => {
            this.sftp.rename(oldPath, newPath, (err) => {
                if (err) {
                    console.error("❌ Rename Error:", err.message);
                    reject(err);
                } else {
                    console.log(`📂 Renamed: ${oldPath} → ${newPath}`);
                    resolve();
                }
            });
        });
    }

    async deleteItem(filePath) {
        return new Promise(async (resolve, reject) => {
            this.sftp.stat(filePath, (err, stats) => {
                if (err) {
                    console.error("❌ Stat Error:", err.message);
                    reject(err);
                } else {
                    if (stats.isDirectory) {
                        this.sftp.rmdir(filePath, (err) => {
                            if (err) {
                                console.error("❌ Delete Folder Error:", err.message);
                                reject(err);
                            } else {
                                console.log(`🗑️ Deleted Folder: ${filePath}`);
                                resolve();
                            }
                        });
                    } else {
                        this.sftp.unlink(filePath, (err) => {
                            if (err) {
                                console.error("❌ Delete File Error:", err.message);
                                reject(err);
                            } else {
                                console.log(`🗑️ Deleted File: ${filePath}`);
                                resolve();
                            }
                        });
                    }
                }
            });
        });
    }

    async createFolder(remotePath) {
        return new Promise((resolve, reject) => {
            this.sftp.mkdir(remotePath, (err) => {
                if (err) {
                    console.error("❌ Create Folder Error:", err.message);
                    reject(err);
                } else {
                    console.log(`📁 Folder Created: ${remotePath}`);
                    resolve();
                }
            });
        });
    }

    async disconnect() {
        this.client.end();
        console.log("❌ SFTP Disconnected!");
    }
}

module.exports = SFTPService;
