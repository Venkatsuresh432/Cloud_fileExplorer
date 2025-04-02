const userModel = require("../models/userModel")

exports.adminAuth = async (req, res, email, next) =>{
    try {
        const user = await userModel.findOne({
            email: email
        })
        if(!user){
            return res.status(404).send({
                message:"user not found"
            })
        } 
        if(user.role === process.env.ADMIN) 
            {
            next()
        }
        else{
            return res.status(401).send({
                message: "access denied"
            })
        }
    } 
    catch (error) {
       res.status(500).send({
        message:"fetch error",
         error:error.message
       }) 
    }
}



exports.adminCheck = async (req, res, next) => {
    try {
        const id = req.body.id// Extract ID from req.user (JWT) or req.params
        if (!id)
        {
           req.session.message = "User Id Is Required"
           req.session.type = "alert-warning"
             return res.redirect("back");
        }

        console.log("Admin check for ID:", id);
        
        const data = await userModel.findById(id);
        if (!data) 
        {
            req.session.message = "User Not Found"
            req.session.type = "alert-warning"
            return res.redirect("back");
        }

        if (data.role === process.env.ADMIN) 
        {
            next(); // Proceed to the next middleware
        }
        else 
         {
           req.session.message = "Access denied"
           req.session.type = "alert-warning"
           return res.redirect("back");
        }

    } catch (error) {
        console.error("Error in adminCheck:", error);
        res.status(500).json({ message: "Server error during authentication" });
    }
};








// exports.adminCheck = async (req, res, id, next) =>{
//         try {
//           console.log(id)
//            const data = await  userModel.findById(id)
           
//            if(!data)
//             {
//                 res.status(404).send({
//                     message:"admin auth failed"
//                 })
//            }
//            if(data.role = process.env.ADMIN)
//             {
//             next();
//             }
//             else {
//                 return res.status(401).send({
//                     message: "access denied"
//                 })
//         }
//         } 
//         catch (error) {
//              res.status(500).send({
//              message:"fetch error"
//             }) 
//          }
// }