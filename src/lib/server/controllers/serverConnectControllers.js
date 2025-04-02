const serverModel = require("../models/serverModel")


exports.connectServer= async (req, res) => {
    const {id} = req.params;
    const server = await serverModel.findById(id);
    const password = server.password;
    const encodedPassword = btoa(password);  // Encode password
    // const encodedPassword = Buffer.from(password).toString("base64"); // Encode password  
    req.session.message = "file fetch successfully"
    req.session.type="alert-success"
    res.render('serverConnection',{
        server,
        password: encodedPassword,
    })
}