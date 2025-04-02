const serverModel = require("../models/serverModel")
const userModel = require("../models/userModel")


// server Allocation For User
exports.serverAllot = async (req, res) => {
   try {
    const { id } = req.params;
    console.log(id)
    const data = await userModel.findById(id).populate('servers')
    var servers = await serverModel.find().select('-bypassProxy -password')
   
    servers = servers.filter(server => 
        !data.servers.some(userServer => userServer._id.equals(server._id)) &&
        !server.users.includes(id) // Assuming `server.users` is an array of user IDs
    );
    console.log(servers)
    // res.render('serverAllotment',{ data, servers })
    return res.status(200).json({status:true, message:"Getting Details", data, servers})
   } 
   catch (error) {
      return res.status(500).json({status:false, message:"Error While work with Api "+error.message })
   }
}

// User Active status renderer
exports.userActiveStatus = async (req, res) => {
    const { _id } = req.params; 
    const data = await userModel.findById( _id )
    var status 
    data.status == 1 ? status = "checked" : status = ""
    console.log(data._id)
    res.status(200).render('userActive', { 
        name: data.userName,
        id: data._id,
        status
    })
}

// delete User From Database
exports.deletePugUser = async (req, res) => {
    try{
            const { _id } = req.params;
            console.log(_id)
            const data = await userModel.findById(_id)
            if(!data)
            {
                res.status(404).json({
                    message:"user not found"
                })
            }
            await userModel.findByIdAndDelete(_id)
            req.session.message = "user-deleted successfully"
            req.session.type = 'alert-success'
            res.redirect("/pug/userList")
    }
    catch(error)
    {
         return res.redirect('back')
    }
}
// user List end



exports.updateServerStat = async (req, res) =>{
    const { _id } = req.params; 
    console.log(_id)
    const data = await serverModel.findById( _id )
    console.log(data)
    var status 
    data.status == true ? status = "checked" : status = ""
    res.status(200).render('serverStatus', { 
        name: data.serverName,
        id: data._id,
        status
    })
}


// update serverStatus
exports.updateServerStatus = async (req, res) => {
    try
    {
        const { _id } = req.params;
        var update ;
        req.body.status ? update = true : update = false
        await serverModel.findByIdAndUpdate(_id, { $set:{status: update}},{new:true}) 
        res.redirect('/lists/serverList')
    }
    catch(error)
   {
        return res.redirect('back')
   }
}
// update serverproxy renderer
exports.updateServerproxy = async (req, res) =>{
    const { _id } = req.params; 
    const data = await serverModel.findById( _id )
    var status 
    data.bypassProxy == true ? status = "checked" : status = ""
    console.log(data._id)
    res.status(200).render('proxyAccess', { 
        name: data.serverName,
        id: data._id,
        status
    })
}

// delete server from db
exports.deletePugserver = async (req, res) => {
    try{
            const { _id } = req.params;
            console.log(_id)
            const data = await serverModel.findById(_id)
            if(!data)
            {
                res.status(404).json({
                    message:"user not found"
                })
            }
            await serverModel.findByIdAndDelete(_id)
            req.session.message = "Server Deleted Successfully"
            req.session.type = "alert-success"
            res.redirect("/pug/serverTable")
    }
    catch(error)
    {
         return res.redirect('back')
    }
}

// Cloud Server Page Navigation
exports.connectServer= async (req, res) => {
    const {id} = req.params;
    const server = await serverModel.findById(id);
    const password = server.password;
    const encodedPassword = btoa(password);
    console.log(encodedPassword);  
    // const encodedPassword = Buffer.from(password).toString("base64"); // Encode password  
    req.session.message = "file fetch successfully"
    req.session.type="alert-success"
    res.render('serverConnection',{
        server,
        password: encodedPassword,
    })
}
// Server List end

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