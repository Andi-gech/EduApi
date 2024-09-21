const express = require("express");
const { Notifications } = require("../Model/Notifications");
const Router = express.Router();
const Authetication = require("../MiddleWare/AuthMiddleware");
const { roleAuth } = require("../MiddleWare/RoleAuth");
const { User } = require("../Model/User");

Router.get("/", Authetication, roleAuth("student"), async (req, res) => {
    try{
        
        const notifications = await Notifications.find({
            user:req.user._id
        })
        res.send(notifications)
    }
    catch(err){
        res.status(500).send(err.message || "Something went wrong")
    }
 
})

module.exports = Router