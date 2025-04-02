const express = require('express')
const colors = require('colors')
const cors = require("cors")
const app = express()
const morgan = require('morgan')
const dotenv = require('dotenv')
dotenv.config( { path:"./config.env" } ) 
const cookieparser = require('cookie-parser') 
const session = require('express-session');
const { createServer } = require('node:http');
const server = createServer(app);
const port = process.env.PORT || 8081

const userRoute = require("./routes/userRoutes")
const serverRoute = require("./routes/serverRoutes")
const userPugRoutes = require("./routes/pugRoutes/userPugRoutes")
const clientPugRoutes = require("./routes/pugRoutes/clientPugRoutes")
const sftpRoutes = require("./routes/sftpRoutes")
const serverConnectionRoutes = require("./routes/serverConnectionRoutes")
const createRoutes = require('./routes/createUserServerRoutes')
const listRoutes =require('./routes/listRoutes')
const userController = require("./controllers/userController")

app.use(cors({origin: ["https://iframe.example.com","http://localhost:5173"], credentials:true }))
app.use(express.json({ limit: "150mb" }))
app.use(express.urlencoded({  limit: "150mb",extended: true }))
app.use(morgan('dev'))
app.use(cookieparser())
app.use(express.static('public'));
app.use(( req, res, next)=>{
    req.requestTime = new Date().toISOString();
    next();
})

// for toast notifications
app.use(session({
    secret: process.env.SECRETTOKEN,
    resave:false,
    saveUninitialized:true,
}))
// set toast notifications
app.use((req, res, next) => {
    console.log('Session User:', req.session.user);
    res.locals.message = req.session.message;
    res.locals.type = req.session.type;
    res.locals.user = req.session.user || null
    res.locals.copiedPath = req.session.copiedPath || null;
    res.locals.currentP = req.session.currentP ||  null; 
    res.locals.action = req.session.action || null;
    delete req.session.message;
    delete req.session.type;
    next();
    console.log("copied:path"+ req.session.copiedPath)
})

const connectDB = require("./config/dbAccess")
//connection DB
connectDB();

app.post("/login",  userController.loginUserController)
app.use("/",userRoute,serverRoute)
app.use("/pug", userPugRoutes)
app.use("/pug/client", clientPugRoutes)
app.use("/sftp", sftpRoutes)
app.use("/serverConnection", serverConnectionRoutes)
app.use('/create', createRoutes)
app.use('/lists', listRoutes)

server.listen(port, ()=>{
    console.log(`Server is listening an port: ${port}`.bgBlue)
})

