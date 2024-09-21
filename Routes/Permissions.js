const express = require("express");
const { Permission, validatePermission } = require("../Model/Permission");
// const {User}=require("../Model/User")
const Router = express.Router();
const AuthMiddleware = require("../MiddleWare/AuthMiddleware");

const { roleAuth } = require("../MiddleWare/RoleAuth");
const mongoose = require("mongoose");
const { getIo } = require("./Chat");
const { Notifications } = require("../Model/Notifications");

Router.post("/", AuthMiddleware, roleAuth("student"), async (req, res) => {
  try {
    const { error } = validatePermission(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const prevPermission = await Permission.findOne({
      user: req.user._id,
      permissionDate: req.body.permissionDate,
    });
    if (prevPermission)
      return res
        .status(400)
        .send("Permission already created check For Approval in History");
    const permission = new Permission({
      Reason: req.body.Reason,
      user: req.user._id,
      permissionDate: req.body.permissionDate,
    });

    await permission.save();
    return res.send(permission);
  } catch (err) {
    res.status(500).send(err.message || "Something went wrong");
  }
});
Router.get(
  "/History",
  AuthMiddleware,
  roleAuth("student"),
  async (req, res) => {
    try {
      const permissions = await Permission.find({
        user: req.user._id,
      });
      return res.send(permissions);
    } catch (err) {
      res.status(500).send(err.message || "Something went wrong");
    }
  }
);
Router.get("/new", AuthMiddleware, async (req, res) => {
  try {
    const permissions = await Permission.find({
      permissionDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      status: "pending",
    });
    return res.send(permissions);
  } catch (err) {
    res.status(500).send(err.message || "Something went wrong");
  }
});
Router.get("/all", AuthMiddleware, async (req, res) => {
  try {
    const permissions = await Permission.find();
    return res.send(permissions);
  } catch (err) {
    res.status(500).send(err.message || "Something went wrong");
  }
});
Router.put("/approve/:id", AuthMiddleware, async (req, res) => {
  try {
    const { io, userSocketMap } = getIo();
    const isvalidMongooseId = mongoose.Types.ObjectId.isValid(req.params.id);
    if (!isvalidMongooseId) return res.status(400).send("Invalid id");

    const permission = await Permission.findById(req.params.id);
    if (!permission) return res.status(400).send("Permission not found");
    permission.status = "approved";
    await permission.save();
    const notification = new Notifications({
      user: permission.user,
      notification: permission.status
        ? `${permission.permissionDate} permission approved`
        : `${permission.permissionDate} permission denied`,
    });
    await notification.save();

    const socketId = userSocketMap.get(permission.user.toString());
    console.log(permission.user, "emited to socketId");
    console.log(socketId, "socketId");

    io.to(socketId).emit("notification", notification);
    return res.send(permission);
  } catch (err) {
    return res.status(500).send(err.message || "Something went wrong");
  }
});
Router.put(
  "/reject/:id",
  AuthMiddleware,
  roleAuth("StudentOfficer"),
  async (req, res) => {
    try {
      const isvalidMongooseId = mongoose.Types.ObjectId.isValid(req.params.id);
      if (!isvalidMongooseId) return res.status(400).send("Invalid id");

      const permissions = await Permission.findById(req.params.id);
      if (!permissions) return res.status(400).send("Permission not found");
      permissions.status = "denied";
      await permissions.save();

      return res.send(permissions);
    } catch (err) {
      res.status(500).send(err.message || "Something went wrong");
    }
  }
);

module.exports = Router;
