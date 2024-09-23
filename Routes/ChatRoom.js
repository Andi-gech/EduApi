const express = require("express");
const Router = express.Router();
const { Chatroom } = require("../Model/Chatrooms");
const { User } = require("../Model/User");
const AuthMiddleware = require("../MiddleWare/AuthMiddleware");
const EnsureChatrooms = require("../MiddleWare/EnsureChatrooms");
const { Chat } = require("../Model/Chat");

Router.get("/", AuthMiddleware, EnsureChatrooms, async (req, res) => {
  const chat = await Chatroom.find({
    user: req.user._id,
  });

  res.send(chat);
});
Router.get("/room", AuthMiddleware, async (req, res) => {
  const chat = await Chatroom.distinct("name");
  res.send(chat);
});
Router.post("/", AuthMiddleware, async (req, res) => {
  const chat = new Chatroom({
    name: req.body.name,
    user: req.user._id,
  });
  await chat.save();
  res.send(chat);
});
Router.get("/:name", AuthMiddleware, async (req, res) => {
  const chat = await Chatroom.findOne({
    name: req.params.name,
  });
  if (!chat) return res.status(400).send("Chatroom not found");
  const chathistory = await Chat.find({
    room: chat.name,
  })
    .populate({
      path: "sender",
      select: "profilePic date",
    })
    .sort({ date: -1 })
    .limit(20);

  res.send(chathistory);
});

module.exports = Router;
