const  nodemailer = require('nodemailer')

// craete transporter

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,  //if port is 465 secure is true
    auth:{
        user: process.env.SENDEREMAIL,
        pass: process.env.SENDERMAILPASSWORD
    }
})

// sending mails 
 
const accountCreation = {
    from: {
        name:"Admin-Cloud Explorer",
        address:process.env.SENDEREMAIL
    },
    to: "venkatsureshsk432@gmail.com",
    subject: "Account Creation",
    text: "Hi user Your Account Created sucessfully - Cloud Explorer",
    html:"<p>Hi user Your Account Created sucessfully - Cloud Explorer</p>"
}

const updateActivation = {
    from:{
         name: "Admin-Cloud Explorer",
         address: process.env.SENDEREMAIL
    },
    to:"venkatsureshsk432@gmail.com",
    subject:"Account Activation Reg",
    text: "Account Activated Sucessfully",
    html :"<p>Account Activated Sucessfully</p>"
}

const updateDeactivation ={
    from :{
        name: "Admin-Cloud Explorer",
        address:process.env.SENDEREMAIL
    },
    to: 'venkatsureshsk432@gmail.com',
    subject: "Account Deactivation Reg",
    text: "Your Account Has Been Deactivated. To Activate Please Contact Admin",
    html: "<p>Your Account Has Been Deactivated. To Activate Please Contact Admin</p>"
}


exports.sendActivateMail = async (transporter, accountCreation) => {
    try {
        await transporter.sendActivateMail(accountCreation)
        console.log("Mail Sent Successfully")
    }  
    catch (error) {
        console.error(error)
    }
}

exports.sendActivationMail = async (transporter, updateActivation) => {

    try 
    {
        await transporter.sendActivationMail(updateActivation);
        console.log("message sent successfully")
    } 
    catch (error)
    {
        console.error(error)
    }
}

exports.sendDeactivationMail = async (transporter, updateDeactivation) => {
    try {
        await transporter.sendDeactivationMail(transporter, updateDeactivation)
        console.log("mail sent successfully")
    } 
    catch (error) 
    {
        console.error(error)
    }
}



sendActivateMail(transporter, accountCreation);
sendActivationMail(transporter, updateActivation);
sendDeactivationMail(transporter, updateDeactivation);