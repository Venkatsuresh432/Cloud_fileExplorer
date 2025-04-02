const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:[true, "please provide email "],
        unique:true,
        lowercase:true,
        trim:true,
        match:[/\S+@\S+\.\S+/, "provide an valid email"]
    },
    userName:{
        type:String,
        required:[true, "please provide userName"],
    },
    password:{
        type:String,
        minlength: [6, "password mustbe atleast 6 charecter long"],
        required:[true, "please provide password"],
        
    },
    status:{
        type:Number,
        enum:[0, 1],
        default: 1
    },
    role:{
        type: String,
        enum:["admin", "client"],
        default: "client"
    },
    disableDate:{
        type:Date,
    },
    servers:[{
            type: mongoose.Schema.Types.ObjectId,
            ref:'server'
    }],
    createdAt:{
        type:Date,
        default:Date.now,
        immutable:true,
        select :false
        
    },
    updatedAt:{
        type:Date,
        default:Date.now,
        select:false
    }
})


userSchema.pre('save', function(next){
if(!this.isNew){
    this.updatedAt = Date.now();
}
next();
})


const userModel = mongoose.model("users", userSchema);
module.exports = userModel;