const serverModel = require("../models/serverModel")
const userModel = require("../models/userModel")

exports.clientUserServerRoute = async (req, res) => {
       try {
                const { id } = req.params;
                console.log(id)
                // const servers = await serverModel.find()
                const user = await userModel.findById(id).populate("servers")
                const servers = user.servers
                res.status(200).render('userServer',{
                    servers,
                })
       } 
       catch (error) {
            console.log(error.message)
            res.redirect('/pug')
       }
}