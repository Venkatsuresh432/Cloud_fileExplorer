const Client = require("ssh2-sftp-client");
const path = require("path");
const fs = require("fs");

class SFTPService {
    constructor() {
        this.client = new Client();
    }

    async connect(server) {
        try {
            await this.client.connect({
                host: server.hostToConnect,
                port: 22,
                username: server.serverName,
                password: server.password,
            });
            console.log("SFTP Connected!");
        } catch (err) {
            console.error("SFTP Connection Failed:", err);
            throw err;
        }
    }

    async uploadFile(localPath, remotePath) {
        try {
            await this.client.put(localPath, remotePath);
            console.log(`Uploaded: ${localPath} to ${remotePath}`);
        } catch (err) {
            console.error("Upload Failed:", err);
        }
    }

    async downloadFile(remotePath, localPath) {
        try {
            await this.client.get(remotePath, localPath);
            console.log(`Downloaded: ${remotePath} to ${localPath}`);
        } catch (err) {
            console.error("Download Failed:", err);
        }
    }

    async copyItem(srcPath, destPath) {
        try {
            let tempFile = `./temp-${Date.now()}`;
            await this.client.fastGet(srcPath, tempFile);
            await this.client.fastPut(tempFile, destPath);
            fs.unlinkSync(tempFile);
            console.log(`Copied ${srcPath} to ${destPath}`);
        } catch (err) {
            console.error("Copy Error:", err);
        }
    }

    async moveItem(srcPath, destPath) {
        try {
            await this.client.rename(srcPath, destPath);
            console.log(`Moved ${srcPath} to ${destPath}`);
        } catch (err) {
            console.error("Move Error:", err);
        }
    }

    async renameItem(oldPath, newPath) {
        try {
            await this.client.rename(oldPath, newPath);
            console.log(`Renamed ${oldPath} to ${newPath}`);
        } catch (err) {
            console.error("Rename Error:", err);
        }
    }

    async deleteItem(filePath) {
        try {
            let stats = await this.client.stat(filePath);
            if (stats.isDirectory) {
                await this.client.rmdir(filePath, true);
            } else {
                await this.client.delete(filePath);
            }
            console.log(`Deleted: ${filePath}`);
        } catch (err) {
            console.error("Delete Error:", err);
        }
    }

    async createFolder(remotePath) {
        try {
            await this.client.mkdir(remotePath, true);
            console.log(`Folder created at ${remotePath}`);
        } catch (error) {
            console.error("Create Folder Error:", error);
        }
    }

    async disconnect() {
        await this.client.end();
        console.log("SFTP Disconnected!");
    }
}

module.exports = SFTPService;
