const express = require("express");
const Router = express.Router();
const mongoose = require("mongoose");
const { User } = require("../Model/User");
const AuthMiddleware=require("../MiddleWare/AuthMiddleware")

const {roleAuth}=require("../MiddleWare/RoleAuth")

Router.put("/scanIn/:id",AuthMiddleware,roleAuth("WardControll"),async (req, res) => {
 try {
    const isvalidMongooseId = mongoose.Types.ObjectId.isValid(req.params.id);
    if (!isvalidMongooseId) return res.status(400).send("Invalid id");
    const user = await User.findOne({ auth: req.params.id });
    console.log(user,req.params.id)
    if (!user) return res.status(400).send("User not found");
    user.incomponund = true;
    await user.save();
    return res.send(user);
    




    
 } catch (error) {
    return res.status(500).send(error.message || "Something went wrong");
    
 }
});
Router.put("/scanOut/:id",AuthMiddleware,roleAuth("WardControll"),async (req, res) => {
    try {
        const isvalidMongooseId = mongoose.Types.ObjectId.isValid(req.params.id);
        if (!isvalidMongooseId) return res.status(400).send("Invalid id");
        const user = await User.findOne({ auth: req.params.id });
        console.log(user,req.params.id)
        if (!user) return res.status(400).send("User not found");
        user.incomponund = false;
        await user.save();
        return res.send(user);

        
    } catch (error) {
        return res.status(500).send(error.message || "Something went wrong");
        
    }
})


module.exports = Router;