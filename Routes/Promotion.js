const express = require("express");
const { User } = require("../Model/User");
const { Class } = require("../Model/Class");
const mongoose = require("mongoose");

const Router = express.Router();
const Years = ["1", "2", "3", "4", "5"];

Router.post("/promote", async (req, res) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const classToUpdate = await Class.find().session(session);
    console.log(classToUpdate);

    const updatedclass = classToUpdate.map(async (classroom) => {
      console.log("classroom semester is ", classroom.semister);
      if (classroom.semister === "2") {
        // Increase the year if the semester is 2
        console.log("classroom semester is ", classroom.semister);
        if (Years.indexOf(classroom.yearLevel) !== Years.length - 1) {
          classroom.yearLevel = Years[Years.indexOf(classroom.yearLevel) + 1];
          classroom.semister = "1";
        }
      } else if (classroom.semister === "1") {
        // Increase the semester if the semester is 1
        classroom.semister = "2";
      }
    });

    await Promise.all(updatedclass);

    await Class.bulkWrite(
      classToUpdate.map((classroom) => ({
        updateOne: {
          filter: { _id: classroom._id },
          update: {
            $set: {
              yearLevel: classroom.yearLevel,
              semister: classroom.semister,
            },
          },
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
