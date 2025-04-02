const serverModel = require("../models/serverModel")
const user = require("../services/userServices")
const server = require("../services/serverServices")
const userModel = require("../models/userModel")


// server Allocation For User
exports.serverAllot = async (req, res) => {
   try {
    const { id } = req.params;
    const data = await user.getUserbyId(id);
    var servers = await server.getAllServers();
   
    servers = servers.filter(server => 
        !data.servers.some(userServer => userServer._id.equals(server._id)) && !server.users.includes(id) );
    console.log(servers)
    return res.status(200).json({status:true, message:"Getting Details", data, servers})
   } 
   catch (error) {
      return res.status(500).json({status:false, message:"Error While work with Api "+error.message })
   }
}

//Server Allocation To User 
exports.addServerToUser = async (req, res) => {
   try {
    const { id1, id2 } = req.params;
    await userModel.findByIdAndUpdate(id1, { $addToSet: { servers: id2  }},{ new:true })
    await serverModel.findByIdAndUpdate(id2, { $addToSet: { users: id1 }},{ new:true })
    return res.status(200).json({status:true, message:"Server Added Successfully"})
   } 
   catch (error) {
    return res.status(500).send({status:false, message:"error while update server: "+ error.message})
   }
   

}