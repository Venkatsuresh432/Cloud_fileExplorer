const serverService = require('../services/serverServices');
const userService = require("../services/userServices")

// create an server
exports.createServerComponent = async (req, res) => {
try {
    const server = await serverService.createServer(req.body);
    if(!server) return res.status(500).json({ status:false, message:'error while creating server' });
    res.status(201).json({ status:true, message:'Server Created', server });  
}
catch (error) {
    console.log('error occured in creating server:',error.message);
    res.status(500).send({ status:false, message:"error occured in creating server: "+error.message })
}};

// update an server Details
exports.updateStatus = async (req, res) =>{
    try 
    {
        const { status } =req.body;
        const { id } = req.params;
        var stat ='';
        status == 1 ? stat = true : stat = false
        if(status === undefined && status >=1 && status <= -1){ res.status(404).send({status:false, message:"error in set status" })}
        const data = await serverService.getServerById(id);
        if(!data) return res.status(404).json({ status:false, message:"server not found" })
        const update = await serverService.updateServer(id, { status: stat });
        if (!update) return res.status(500).json({message: "error while update status"})
        res.status(200).json({ message:"status upadated successfully",})
    } 
    catch (error)
    {
        res.status(500).json({ status:false, message: "error occured while upadate", error:error.message });
    }
}

//update proxy
exports.updateByPassProxy = async (req, res) =>{
    try {
        const { bypassProxy } =req.body;
        const {id} = req.params; 
        var stat = '';
        bypassProxy == 1 ? stat = true : stat =  false
        if(bypassProxy == undefined && bypassProxy >=1 && bypassProxy <= -1)
        {
            return res.status(404).send({ status:false, message:"error in set proxy" })
        }
        const data = await serverService.getServerById(id)
        if(!data)  return res.status(404).json({status: false, message:"server not found"});
        const update = await serverService.updateServer(id, {bypassProxy: stat})
        res.status(200).json({ status:true, message:"proxy upadated successfully", update })
    } 
    catch (error) 
    {
       return res.status(500).json({ status:false, message:"error occured while upadate", error:error.message })
    }
}
 
// delete server only
exports.deleteServer = async (req, res) => {
    try {
        const { id } = req.params;
        if(!id) return res.status(404).send({ status:false, message:"id not found" });
        const data = await serverService.getServerById(id);
        if(!data) return res.status(404).json({ status:false, message:"data not found" });
        const result = await serverService.deleteServer(id);
        if(!result) return res.status(500).send({ status: false, message:"error wlile delete server"})  
        return res.status(204).json({ status:true, message:"server deleted successfully"})  
    } 
    catch (error) {
        return res.status(500).json({ status:false, message:"Error While Fetch Api "+error.message })
    }
} 

// get all servers
exports.getallServers = async (req, res) => {
    try{
        const data = await serverService.getAllServers();
        data.password = null;
        return res.status(200).send({ status:true, message:"Getting Server Data", data });
    }
    catch(error){
        res.status(500).json({ status:false, message:"error in fetch api "+error.message });
    }
}

// get single server
exports.getServerById = async (req, res) => {
    try {
        const { id } = req.params;
        if(!id) return res.status(404).send({ status:false, message:"id not found"});
        const data = await serverService.getServerById(id)
        if(!data) return res.status(404).json({status:false, message:"data not found"});
        return res.status(200).json({ status:true, message: "Server Found", server:data });
    }
    catch (error) 
    {
        return res.status(500).json({ status:false, message:"error in fetch api"+error.message });
    }
}

//  delete server with user
exports.deleteServerWithUser = async (req, res) => {
    try {
        const { id } = req.params;
        if(!id) return res.status(404).send({ status:false, message:"id not found" }); 
        const data = await serverService.getServerById( id )
        if( !data ) return res.status(404).send({ message:"user not found" })
        // data.users.forEach(e => {
        //     userService.updateUserById({ users: e }, { $pull: { servers: id } });
        // })
        const userDelete = await userService.deleteServer(id)
        if(!userDelete) return res.status(500).json({message: "Error while delete User"})
        const result = await serverService.deleteServer(id);
        if( !result ) return res.status(500).send({ status:false, message:'Error In Delete Server' })
        return res.status(204).json({ status:true, message:'server deleted successfully'})
    } 
    catch (error) 
    {
        return res.status(500).json({ status:false, message: "Error in API: "+error.message }); 
    }
}

// Update Server 
exports.updateServer = async (req, res) => {
    try {
        const { id } =req.params;
        const server = await serverService.getServerById(id);
        if(!server) return res.status(404).send({ message:"Server Not Found" });
        const update = await serverService.updateServerById(id, req.body);
        if(!update) return res.status(500).send({ message:"Update Failed" });
        return res.status(200).send({message: "Server Updated Successfully" });
    } 
    catch (error) {
        return res.status(500).send({ message:"Error While Update Server"+error.message })
    }
}
