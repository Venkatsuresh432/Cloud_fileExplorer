const express = require('express')
const colors = require('colors')
const cors = require("cors")
const app = express()
const morgan = require('morgan')
const dotenv = require('dotenv')
dotenv.config( { path:"./config.env" } ) 
const { createServer } = require('node:http');
const server = createServer(app);
const port = process.env.PORT || 7930

const userRoute = require("./routes/userRoutes")
const serverRoute = require("./routes/serverRoutes")
const sftpRoutes = require("./routes/sftpRoutes")
const listRoutes =require('./routes/listRoutes')
const userController = require("./controllers/userController")

app.use(cors({origin: ["https://iframe.example.com","http://localhost:5173"], credentials:true }))
app.use(express.json({ limit: "150mb" }))
app.use(express.urlencoded({  limit: "150mb",extended: true }))
app.use(morgan('dev'))
app.use(express.static('public'));


app.use(( req, res, next)=>{
    req.requestTime = new Date().toISOString();
    next();
})

const connectDB = require("./config/dbAccess")
//connection DB
connectDB();

app.post("/login",  userController.loginUserController)
app.use("/",userRoute,serverRoute)
app.use("/sftp", sftpRoutes)
app.use('/lists', listRoutes)

server.listen(port, ()=>{
    console.log(`Server is listening an port: ${port}`.bgBlue)
})

