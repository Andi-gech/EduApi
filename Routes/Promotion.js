const express = require("express");
const { User } = require("../Model/User");
const mongoose = require("mongoose");

const Router = express.Router();
const Years = ["1", "2", "3", "4", "5"];

Router.post("/promote", async (req, res) => {
    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        const usersToUpdate = await User.find().session(session);
        console.log(usersToUpdate);

        const updatedUsers = usersToUpdate.map(async (user) => {
            console.log("user semester is ", user.semister);
            if (user.semister === "2") {
                // Increase the year if the semester is 2
                console.log("user semester is ", user.semister);
                if (Years.indexOf(user.yearLevel) !== Years.length - 1) {
                    user.yearLevel = Years[Years.indexOf(user.yearLevel) + 1];
                    user.semister = "1";
                }
            } else if (user.semister === "1") {
                // Increase the semester if the semester is 1
                user.semister = "2";
            }
        });

        await Promise.all(updatedUsers);

        await User.bulkWrite(
            usersToUpdate.map((user) => ({
                updateOne: {
                    filter: { _id: user._id },
                    update: { $set: { yearLevel: user.yearLevel, semister: user.semister } },
                },
            }))
        );

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: "Users promoted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = Router;