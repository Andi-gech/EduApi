const mongoose = require("mongoose");

const chatroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Chatroom = mongoose.model("Chatroom", chatroomSchema);
module.exports = { Chatroom }