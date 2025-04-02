const user = require("../services/userServices")


exports.adminCheck = async (req, res, next) => {
    try {
        const id = req.body.id;
        if (!id) return res.status(404).json({ message:"Id Not Found "})
        const data = await user.getUserbyId(id);
        if (!data) return res.status(404).json("User Not Found")
        if (data.role === process.env.ADMIN) 
        {
            next(); 
        }
        else return res.status(400).json("Access Denied")
    } 
    catch (error) {
        res.status(500).json({ message: "Server error during authentication"+ error.message });
    }
}