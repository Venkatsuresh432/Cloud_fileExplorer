const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service:'gmail',
    host:'smtp.gmail.com',
    port:587,
    secure:false,
    auth:{
        user : process.env.SENDERMAIL,
        pass : process.env.SENDERMAILPASSWORD
    }
});


const sendMail = async (req, res, subject, text, html, remail) => {
    try {
        if(!remail | !req.body.email){
            console.log("mail not found")
        }
     const mailOptions = {
        from:   {
                    name:"Admin-Cloud Explorer",
                    address:process.env.SENDERMAIL
                },
        to: req.body.email || remail,
        subject,
        text,
        html
     };
     await transporter.sendMail(mailOptions);
     console.log("mail sent successfully")   
    }
    catch(error){
        console.error(error);
        // res.status(500).json({message:"failed to send mail",error})
    }
}


exports.sendActivationMail = (req, res) => {
    sendMail (req, res, "Account Creation", "Hi user Your Account Created sucessfully - Cloud Explorer","<p>Hi user Your Account Created sucessfully - Cloud Explorer</p>" )
}

// exports.sendActivationMail = (req, res) => {
//     sendMail(req, res, "Account Activation Reg", "Account Activated Sucessfully", "<p>Account Activated Sucessfully</p>") 
// }

// exports.sendDeactivationMail = (req, res) =>{
//     sendMail(req, res, "Account Deactivation Reg","Your Account Has Been Deactivated. To Activate Please Contact Admin","<p>Your Account Has Been Deactivated. To Activate Please Contact Admin</p>")
// }

exports.sendConfirmMail = (req, res, status, remail) =>{
    console.log(remail)
    sendMail(req, res, status == 1 ? "Account Activation Reg" : "Account Deactivation Reg",  status == 1 ? "Account Activated Sucessfully" : "Your Account Has Been Deactivated. To Activate Please Contact Admin", status == 1 ? "<p>Account Activated Sucessfully</p>" : "<p>Your Account Has Been Deactivated. To Activate Please Contact Admin</p>", remail)
}