const userModel = require('../models/userModel')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
// const colors = require('colors')
// const mailSender = require('../mailSender/mailResponseSender') 
const serverModel = require('../models/serverModel')
const userService = require('../services/userServices')
const serverService = require("../services/serverServices")


exports.createUserController = async (req, res) =>{ 
    try 
    {
        const userValue = req.body;
        const userData = await userService.getUserByEmail(req.body.email)
        if(userData) {  return res.send({ message:"user Already exists"}); } 
        const user = await userService.createUser(userValue)
        // mailSender.sendActivationMail(req, res);
        if(!user) return res.status(500).json({ status: false, message:"Error While creating user"})
        res.status(201).send({ requestedAt : req.requestTime, message:"user created successfully" , user })
    } 
    catch (error) {
       res.status(500).json({ message:"error in api created", error :error.message}) 
    }
}

exports.getAllUserController = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json({ status:true, message:"Getting User Details", users })
    }
     catch (error) {
        res.status(500).json({ status:false, message:'Error while fetch api '+ error.message,})   
    }
}

exports.getUserByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserbyId(id);
    if(!user) return res.status(400).json({ status:false, message:'User Not Found'});
    return res.status(200).json({ status:true, message:'Getting User Detail', user });
  } 
  catch (error) {
        return res.status(500).json({ status:false, message:"Error in Api: "+error.message })
  }
}

exports.UpdateUserController = async ( req, res ) => {
    try {
        const { id } = req.params;
        const user = await userService.findById(id);
        if(!user) return res.status(404).json({ status:false, message :'User Not Found' });
        const update = await userService.updateUserById(id, req.body);
        return res.status(200).json({ status:true, message:"User Updated Successfully", update});
    }
     catch (error) {
        res.status(500).json({ status: false, message:"Error in Update Api: "+error.message})
    }  
} 
// login user
exports.loginUserController = async (req, res) =>{
    try {
        const { email, password } = req.body;
        if(!email || !password) return res.status(404).send({status:false, message:"please include email and password" });

        const user = await userService.getUserByEmail(email)
        if(!user) return res.status(404).json({ status:false, message:"user not found" }) 

        const passwordData = await bcrypt.compare(password, user.password)
        if(!passwordData) return res.status(404).send({status:false, message: "please provide email and password"})
        
        if(user.status == 0)  return res.status(500).send({status:false, message:"please activate your Account contact Admin"})
        const token = await jwt.sign({id:user._id, email:user.email}, process.env.SECRETTOKEN, {expiresIn:"7d"} )
        return res.status(200).json({
            status:true,
            message:'User Login Successfully',
            requestedAt: req.requestTime,
            data: user,
            token,
        });
    }
     catch (error) {
       return res.status(500).send({ status:false, message:"error in fetch Login Api :"+error.message })
    }
}


// update Status
exports.updateStatusController = async (req, res) =>{
    try {
        const { status , email } = req.body;
        const { id } = req.params;       
        if(!id) return res.status(404).send({ status:false, message: "enter an id" });
        if(status == undefined) return res.status(404).send({ status:false, message:"status not found" }); 
        const user = await userService.getUserbyId(id);
        if(!user) return res.status(404).send({ status:false, message:"user not found" })
        const remail = email ||  user.email;
        if(!remail)  return res.status(404).send({message:"email not found"})
        await userService.updateUserById(id, {status});

    //    await mailSender.sendConfirmMail(req, res, status, remail)  
        return res.status(200).send({
            status:true,
            message:"Status Updated Sucessfully",
            requestedAt : req.requestTime
        })
    } 
    catch(error) {
        return res.status(500).send({ status:false, message:"error in fetch api"+error.message }) 
    }
}

// delete an user
exports.deleteUserController = async (req, res) => {
    try 
    {
        const { id } = req.params;
        if(!id) return res.status(200).json({ status:false, message:"User Not Found" });
        const result = await userService.deleteUserById(id);
        if(!result) return res.status(500).json({ status:false, message: "Error In delete User"})
        return res.status(204).json({ status:true, message:"User Deleted SuccessFully" });
    } 
    catch (error) {
        res.status(500).send({status:false, message:"error in fetch api"+error.message }) 
    }
}

// assigning server from user
exports.assignServerController = async (req, res) => {
    try {
        const { id, serverId } = req.body;
        // Validate input
        if (!id || !serverId || serverId.length === 0) {
            return res.status(400).json({ message: "User ID or Server ID(s) not provided" });
        }
        // Find the user
        const user = await userService.getUserbyId(id);
        if(!user)  return res.status(404).json({ message: "User not found" });
        // Find all servers
        const servers = await serverService.findById(serverId)
        // const servers = await Promise.all(serverId.map( id => serverModel.findById(id)));
        // Check if any server does not exist
        if (!servers) return res.status(404).json({ message: "One or more servers not found" });
        // Add user to multiple server
        await userModel.findByIdAndUpdate(id, { $addToSet: { servers: serverId }})
        await serverModel.findByIdAndUpdate(serverId, { $addToSet: { users: id }})
        res.status(200).json({ message: "User assigned to servers successfully" });
    } 
    catch (error) {
        res.status(500).json({ message: "Error in API", error });
    }
};


exports.deleteUserWithServerController = async (req, res) => {
    try {
    const {id} = req.params;
    console.log(req.params)
    if(!id) return res.status(404).send({ message:"user id not found" });
    const data = await userService.getUserbyId( id );
    if( !data )return res.status(404).send({ message:"user not found" });
    // await serverModel.updateMany({ users: id }, { $pull:{ users: id } })
    const serverdelete = serverService.deleteUsers(id);
    if(!serverdelete) return  res.status(500).json({ message:"error while delete server"})
    const result =  await userService.deleteUserById(id);
    if(result) return res.status(204).json({ message:'user Deleted successfully'})
    } 
    catch (error)
    {
        res.status(500).json({ message: "Error in API", error });
    }
}

