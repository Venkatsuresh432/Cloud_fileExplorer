const mongoose = require("mongoose")


const serverSchema = new mongoose.Schema({
    serverName:{
        type:String,
        required:[true, "Please provide Server Name"],
        minlength:[3, "please named above 3 char"],
    },
   hostToConnect: {
    type: String,
    required: [true, "Please provide a host to connect"],
    validate: {
        validator: function (v) {
            return /^(\d{1,3}\.){3}\d{1,3}$|^([a-fA-F0-9:]+)$/.test(v);
        },
        message: "Please provide a valid server IP address",
    },
},
    port:{
        type:Number,
        required:[true, "please provide port number"],
        min:[1, "port Starting from 1"],
        max:[65535, "port must be lesser than 65536"],
        validate:{
            validator:Number.isInteger,
            message:"Port must Be an Integer"
        }

    },
    bypassProxy:{
        type: Boolean,
        default: false,
    },
    password:{
        type:String,
        required:[true, "please provide password"],
    },
    privateKey:{
        type:String,
    },
    status:{
        type: Boolean,
        default: false
    },
    disableDate:{
        type:Date
    },
    users:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    }],
    createdAt:{
        type:Date,
        default: Date.now(),
        immutable:true,
        select:false
    },
    updatedAt:{
        type:Date,
        default: Date.now(),
        select:false
    }
});

serverSchema.pre('save', function(next){
    if(!this.isNew){
        this.updatedAt = Date.now();
    }
    next();
})

const serverModel = mongoose.model('server', serverSchema);

module.exports = serverModel;