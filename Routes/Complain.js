const express = require("express");
const { Complain, validateComplain } = require("../Model/Complain");
const mongoose = require("mongoose");
const Router = express.Router();
const Authetication = require("../MiddleWare/AuthMiddleware");
const { roleAuth } = require("../MiddleWare/RoleAuth");

Router.post("/", Authetication, roleAuth("student"), async (req, res) => {
try {
    const { error } = validateComplain(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const complain = new Complain({
        complain: req.body.complain,
        type: req.body.type,
        user: req.user._id
    });
    await complain.save();
    return res.send(complain);

} catch (error) {
    return res.status(500).send(error.message || "Something went wrong");
}
})

module.exports = Router