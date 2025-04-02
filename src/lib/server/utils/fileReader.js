const multer = require('multer')
const path =require('path');
const PdfParse = require('pdf-parse');

const storage = multer.memoryStorage(); 
const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        console.log("Recived File:", file);
        const ext = path.extname(file.originalname).toLowerCase();
        if(ext !== '.pdf') return cb(new Error("Only PDF's are Allowed"), false);
        cb(null, true);
    }
}).single('passkeyFile')


exports.fileReader = async ( file ) => {
        upload(file, async (err) => {
            if(err) return console.error("Multer Error: ",err.message);
            console.log("File Recived:", file);
            let passkeyData;
            const pdfData = await PdfParse(file.buffer);
            passkeyData = JSON.stringify(pdfData.text.trim());
            return passkeyData;
        })
}