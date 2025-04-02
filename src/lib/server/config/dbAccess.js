const mongoose  = require("mongoose")

const connectDB = async () =>
    {
        try{
            mongoose.connect(process.env.MONGODBURL)
            console.log("Database has been sucessfully started".bgGreen.white)  
        }
        catch(error)
        {
            console.log("DB Connection error"+error.message.bgRed.white);
        }
}
module.exports = connectDB;