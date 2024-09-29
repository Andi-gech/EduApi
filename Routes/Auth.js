const express = require("express");
const Router = express.Router();
const { Auth, validateAuth } = require("../Model/Auth");
const { securePassword, comparePassword } = require("../utils/Secure");
const { generateAuthToken } = require("../utils/jwt");
const mongoose = require("mongoose");
const { User, validateUser } = require("../Model/User");
const { Class, validateClass } = require("../Model/Class");
const { Chatroom } = require("../Model/Chatrooms");

Router.post("/register", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { error: authError } = validateAuth(req.body.auth);
    if (authError) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send(authError.details[0].message);
    }

    // Validate user data
    const { error: userError } = validateUser(req.body.user);
    if (userError) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send(userError.details[0].message);
    }

    // Check if email already exists
    let auth = await Auth.findOne({ email: req.body.auth.email }).session(
      session
    );
    if (auth) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send("Email already registered.");
    }

    // Hash password

    const hashedPassword = securePassword(req.body.auth.password);

    // Create new Auth document
    console.log("classRoom");
    auth = new Auth({
      email: req.body.auth.email,
      password: hashedPassword,
      Role: req.body.auth.Role,
    });
    await auth.save({ session });

    const { error: classError } = validateClass(req.body.class);
    if (classError) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send(classError.details[0].message);
    }

    let classRoom = await Class.findOne(req.body.class).session(session);

    if (!classRoom) {
      classRoom = new Class(req.body.class);
      await classRoom.save({ session });
    }
    console.log(classRoom, "classRoom is created");

    // Create new User document
    const user = new User({
      firstName: req.body.user.firstName,
      lastName: req.body.user.lastName,
      auth: auth._id,
      Class: classRoom._id,

      gender: req.body.user.gender,

      isMilitary: req.body.user.isMilitary,
    });

    await user.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Respond with created user (excluding sensitive information)
    res.send({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: auth.email,
        dob: user.dob,
        gender: user.gender,
        phone: user.phone,
        yearLevel: user.yearLevel,
        department: user.department,
        semester: user.semester,
        address: user.address,
        profilePic: user.profilePic,
        date: user.date,
        isMilitary: user.isMilitary,
      },
    });
  } catch (err) {
    // Abort transaction on error
    console.log(err);
    await session.abortTransaction();

    session.endSession();
    res.status(500).send("Something went wrong.");
  }
});
Router.post("/login", async (req, res) => {
  try {
    const { error } = validateAuth(req.body);

    if (error) return res.status(400).send(error.details[0].message);
    const user = await Auth.findOne({ email: req.body.email });
    if (!user) return res.status(400).send("Invalid email or password");
    const validPassword = comparePassword(req.body.password, user.password);
    if (!validPassword)
      return res.status(400).send("Invalid email or password");
    const Profile = await User.findOne({
      auth: user._id,
    });

    const token = generateAuthToken({
      _id: user._id,
      email: user.email,
      Role: user.Role,
      userid: Profile._id,
    });
    res.send({
      token: token,
      isapproved: user.isapproved,
      user: {
        id: user._id,
        email: user.email,
        userid: Profile._id,
      },
    });
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
});
module.exports = Router;
