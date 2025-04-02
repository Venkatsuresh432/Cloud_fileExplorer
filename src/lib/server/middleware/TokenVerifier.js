const JWT = require('jsonwebtoken')
const adminMiddleware =require('./adminMiddleware')

exports.userVerification = async (req, res, next) =>{
   try{
    if(!req.headers.authorization) return res.status(401).json({ message: "Unauthorized: No token provided" });
    const token = await req.headers["authorization"].split(" ")[1]
    await JWT.verify(token, process.env.SECRETTOKEN, (err, decode)=>{
        if(err) return res.status(400).json({ message:'token error' });
        else { req.body.id = decode.id, next(); }
    })
   }
   catch(error){
        res.status(500).send({ message:"api error: "+error.message})
   }
}

exports.adminVerification = async (req, res, next) => {
    try
    {
        if(!req.headers.authorization) return res.status(401).json({ message: "Unauthorized: No token provided" });
        const token = req.headers['authorization'].split(" ") [1];
        await JWT.verify(token, process.env.SECRETTOKEN, (err, decode)=>{
                if(err){
                    res.status(500).send({message: err.message});
                }
                else
                {
                    req.body.id = decode.id;
                    adminMiddleware.adminCheck(req, res, next)
                }
        })
     }
    catch(error)
    {
        res.status(500).send({ message:"admin auth failed"+error.message })
    }
}