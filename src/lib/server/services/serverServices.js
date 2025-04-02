const serverModel = require('../models/serverModel')

exports.createServer = async ( data )  =>{
    const { serverName, hostToConnect, port, bypassProxy, privateKey, password, status, disableDate } = data;
    const servers = new serverModel({
        serverName, hostToConnect, port, bypassProxy, password, privateKey, status, disableDate
    });
    servers.save();
    return servers;
}
exports.getAllServers = async () => {
    const servers = await serverModel.find();
    return servers;
}
exports.getServerById = async (id) => {
    console.log(id);
    const server = await serverModel.findById(id);
    return server;
}
exports.updateServer = async (id, data) =>{
        const server = await serverModel.findByIdAndUpdate(id, { $set:data}, {new:true});
        return server;
}
exports.updateServerById = async (id, data) =>{
    console.log(data)
    const server = await serverModel.findByIdAndUpdate(id, { $set: data}, {new:true});
    return server;
}
exports.addUserToServer = async (id, userId) => {
    const result = await serverModel.findByIdAndUpdate(id, { $addToSet:{ users:userId } },{new:true});
    return result;
}
exports.deleteServer = async (id) => {
    const result = await serverModel.findByIdAndDelete(id);
    return result;
}

exports.deleteUsers = async (id) => {
    const result = await serverModel.updateMany( {users:id }, { $pull:{users: id} });
    return result;
}