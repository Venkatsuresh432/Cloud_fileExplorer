const userModel = require('../models/userModel')
const bcrypt = require('bcryptjs')


exports.createUser = async (data) => {
    const { userName, email, role, password, status, disableDate } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user  = new userModel({
     userName,
     email,
     password : hashedPassword,
     disableDate,
     role: role || "client",
     status : Boolean(status)
    })
     user.save();
     return user;
}  

exports.getAllUsers = async () => {
    const users = await userModel.find();
    return users;
} 
exports.getUserbyId = async (id) => {
    if(!id) return console.log("provide user id")
    const user = await userModel.findById(id).populate("servers");
    return user;
}
exports.getUserByEmail = async (email) =>{
    if(!email)  return console.log("provide user email");
    const user = await userModel.findOne({ email:email }).populate("servers")
    return user;
}
exports.updateUserById = async (id, data) =>{
    const user = await userModel.findByIdAndUpdate(id, {$set: data },{new:true});
    return user;
}
exports.updateUser = async (id, data) =>{
    const { userName, email, status, disableDate } = data;
    console.log(data);
    const user = await userModel.findByIdAndUpdate(id, {$set: {userName, email, status, disableDate } },{new:true});
    return user;
}
exports.deleteUserById = async (id) =>{
    const result = await userModel.findByIdAndDelete(id);
    return result;
}

exports.addServerToUser = async (id, serverId) => {
    const result  = await userModel.findByIdAndUpdate(id, { $addToSet:{ servers: serverId }}, {new:true})
    return result;
}

exports.deleteServer = async (id) => {
    const result = await userModel.updateMany({servers: id},{$pull:{servers: id}})
    return result;
}