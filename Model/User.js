const mongoose = require("mongoose");
const Joi = require("joi");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 20
    },
    isMilitary: {
        type: Boolean,
        default: false
    },
    lastName: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 20
    },
    auth: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
        required: true
    },
    dob: {
        type: Date
    },
    gender: {
        type: String,
        required: true,
        enum: ["Male", "Female"]
    },
    phone: {
        type: Number,
      
    },
    yearLevel: {
        type:String,
        required: true,
        enum: ["1", "2", "3", "4", "5"]
    },
    department: {
        type: String,
        enum:["Computer Science","electronics","civil","Mechanical","Electrical","Aeronautical","Production","chemical","Motor Vehicles"]
    },
    semister: {
        type: String,
        required: true,
        enum: ["1", "2"]
    },
    address: {
        type: String
    },
    profilePic: {
        type: String,
       
    },
    date: {
        type: Date,
        default: Date.now
    },
    incomponund:{
        type:Boolean,
        default:false
    }
});

const User = mongoose.model("User", userSchema);

const validateUser = (user) => {
    const schema = Joi.object({
        firstName: Joi.string().min(3).max(20).required(),
        lastName: Joi.string().min(3).max(20).required(),
     
        dob: Joi.date().optional(),
        gender: Joi.string().valid("Male", "Female").required(),
        phone: Joi.number().optional(),
        yearLevel: Joi.string().valid("1", "2", "3", "4", "5").required(),
        department: Joi.string().valid("Computer Science","electronics","civil","Mechanical","Electrical","Aeronautical","Production","chemical","Motor Vehicles").required(),
        isMilitary: Joi.boolean().default(false),
        semister: Joi.string().valid("1", "2").required(),
        address: Joi.string().optional(),
        profilePic: Joi.string().optional(),
        incomponund:Joi.boolean().default(false),
        date: Joi.date().default(Date.now)
    });

    return schema.validate(user);
};

module.exports = {
    User,
    validateUser
};
