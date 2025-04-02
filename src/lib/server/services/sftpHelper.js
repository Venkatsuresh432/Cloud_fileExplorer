const path = require('path');

exports.extensionExtracter = async (filename) =>{
    const ext =  path.extname(filename).toLowerCase()
}

exports.getFolderIcon= async (folderName) => {
    // Convert folder name to lowercase for case-insensitive matching
    const lowerCaseName = folderName.toLowerCase();

    // Define icon mappings for folder names
    const iconMap = {
        'documents': '/assets/icons/document.png',
        'downloads': '/assets/icons/downloads.png',
        'pictures': '/assets/icons/pictures.png',
        'videos': '/assets/icons/videos.png',
        'music': '/assets/icons/music.png',
        'desktop': '/assets/icons/desktop.png',
        'projects': '/assets/icons/projects.png',
        'code': '/assets/icons/code.png',
        'backup': '/assets/icons/backup.png',
        'work': '/assets/icons/work.png',
        'games': '/assets/icons/games.png',
        'server': '/assets/icons/server.png'
    };

    // Default folder icon if no match is found
    return iconMap[lowerCaseName] || '/assets/icons/folder.png';
}

exports.getFileIcon= async (fileName) => {
    // Extract file extension
    const ext = path.extname(fileName).toLowerCase();  

    // Define icon mappings for file extensions
    const iconMap = {
        '.jpg': '/assets/icons/jpg.png',
        '.jpeg': '/assets/icons/jpeg.png',
        '.png': '/assets/icons/png.png',
        '.gif': '/assets/icons/gif.png',
        
        '.pdf': '/assets/icons/pdf.png',
        '.doc': '/assets/icons/doc.png',
        '.docx': '/assets/icons/docx.png',
        '.xls': '/assets/icons/xls.png',
        '.xlsx': '/assets/icons/xlsx.png',
        '.ppt': '/assets/icons/ppt.png',
        '.pptx': '/assets/icons/pptx.png',
        
        '.txt': '/assets/icons/txt.png',
        '.zip': '/assets/icons/zip.png',
        '.rar': '/assets/icons/rar.png',
        '.tar': '/assets/icons/tar.png',
        
        '.mp3': '/assets/icons/mp3.png',
        '.wav': '/assets/icons/wav.png',
        
        '.mp4': '/assets/icons/mp4.png',
        '.avi': '/assets/icons/avi.png',
        '.mkv': '/assets/icons/mkv.png',

        '.js': '/assets/icons/js.png',
        '.html': '/assets/icons/html.png',
        '.css': '/assets/icons/css.png',
        '.json': '/assets/icons/json.png',
        '.java': '/assets/icons/java.png',
        '.py': '/assets/icons/py.png',
        '.c':  '/assets/icons/c.png',
        '.c++':  '/assets/icons/c++.png',
        '.c#':  '/assets/icons/c#.png',
        
        '.exe': '/assets/icons/exe.png',
        '.dll': '/assets/icons/dll.png'
    };

    // Default icon if no match is found
    return iconMap[ext] || '/assets/icons/anonymity.png';
}

exports.typesOfFileFolder = async (filename) => {
            
}