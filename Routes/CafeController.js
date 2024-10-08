const express = require("express");
const { Cafe, validateCafe } = require("../Model/Cafe");
const Router = express.Router();
const Authetication = require("../MiddleWare/AuthMiddleware");
const { roleAuth } = require("../MiddleWare/RoleAuth");
const { CafeGate } = require("../Model/CafeGate");
const { Auth, validateAuth } = require("../Model/Auth");
const { signData, verifyData } = require("../utils/Signiture");
const { encrypt, decrypt } = require("../utils/Crypto");
Router.post(
  "/subscribe",
  Authetication,
  roleAuth("student"),
  async (req, res) => {
    const { error } = validateCafe(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const subs = await Cafe.findOne({
      user: req.user._id,
      enddate: { $gt: Date.now() },
    });
    if (subs) return res.status(400).send("Already Subscribed");
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    if (currentDay > 7)
      return res.status(400).send("Month Subscription not available");
    const cafe = new Cafe({
      location: req.body.location,
      user: req.user._id,
    });
    await cafe.save();
    return res.send(cafe);
  }
);
Router.get("/subscription/status", Authetication, async (req, res) => {
  try {
    const cafe = await Cafe.findOne({
      user: req.user._id,
      enddate: { $gt: Date.now() },
    });
    if (!cafe)
      return res.send({
        status: false,
      });

    return res.send({
      status: true,
    });
  } catch (err) {
    res.status(500).send(err.message || "Something went wrong");
  }
});
Router.get("/subscriptions", Authetication, async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).send("Month and year parameters are required.");
    }

    const parsedMonth = parseInt(month);
    const parsedYear = parseInt(year);

    if (isNaN(parsedMonth) || isNaN(parsedYear)) {
      return res.status(400).send("Invalid month or year format.");
    }

    if (parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).send("Month must be between 1 and 12.");
    }

    const startDate = new Date(parsedYear, parsedMonth - 1, 1);
    const endDate = new Date(parsedYear, parsedMonth, 0);
    const cafes = await Cafe.find({
      startdate: { $gte: startDate, $lte: endDate },
    });
    return res.send(cafes);
  } catch (err) {
    res.status(500).send(err.message || "Something went wrong");
  }
});
Router.get("/subscriptions/report", async (req, res) => {
  try {
    const cafes = await Cafe.find();
    return res.send(cafes);
  } catch (err) {
    res.status(500).send(err.message || "Something went wrong");
  }
});
Router.post("/subscribe/manual", Authetication, async (req, res) => {
  const { error } = validateCafe(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let usersToSubscribe = [];

  if (Array.isArray(req.body.users)) {
    usersToSubscribe = req.body.users;
  } else {
    usersToSubscribe.push(req.body.users);
  }

  const subscriptions = [];
  for (let userId of usersToSubscribe) {
    const cafe = new Cafe({
      location: req.body.location,
      user: userId,
      startdate: req.body.startdate,
    });
    await cafe.save();
    subscriptions.push(cafe);
  }

  return res.send(subscriptions);
});
const mealTimes = {
  breakfast: { start: 6, end: 10 }, // Breakfast time range (6:00 AM - 10:00 AM)
  lunch: { start: 12, end: 14 }, // Lunch time range (12:00 PM - 2:00 PM)
  dinner: { start: 18, end: 20 }, // Dinner time range (6:00 PM - 8:00 PM)
};

// Function to get current meal based on time
const getCurrentMeal = () => {
  const currentHour = new Date().getHours();

  if (
    currentHour >= mealTimes.breakfast.start &&
    currentHour < mealTimes.breakfast.end
  ) {
    return "BreakFast";
  } else if (
    currentHour >= mealTimes.lunch.start &&
    currentHour < mealTimes.lunch.end
  ) {
    return "Lunch";
  } else if (
    currentHour >= mealTimes.dinner.start &&
    currentHour < mealTimes.dinner.end
  ) {
    return "Dinner";
  }
  return null; // No meal available for check-in outside of these times
};

Router.put("/check/meal/", async (req, res) => {
  try {
    const qrurl = req.body.qrurl;
    if (!qrurl) {
      return res.status(400).send("QR URL is required.");
    }

    // Extract encrypted data and signature from QR code
    const data = qrurl.split(":");
    if (data.length !== 3) {
      return res.status(400).send("Invalid QR format.");
    }

    const encrypted = `${data[0]}:${data[1]}`;
    const signed = data[2];

    // Decrypt the encrypted data to get the student ID
    const studentid = decrypt(encrypted);
    if (!studentid) {
      return res.status(400).send("Decryption failed.");
    }

    // Verify the signature to ensure data integrity
    const verified = verifyData(encrypted, signed);
    if (!verified) {
      return res.status(400).send("Invalid QR code signature.");
    }

    // Find the student based on the decrypted ID
    const student = await Auth.findById(studentid);
    if (!student) {
      return res.status(400).send("Student not found.");
    }

    // Determine the current meal time (breakfast, lunch, dinner)
    const currentMeal = getCurrentMeal();
    if (!currentMeal) {
      return res
        .status(400)
        .send("It's not time for breakfast, lunch, or dinner.");
    }

    // Check if the student has already checked in for the current meal today
    const existingCafe = await CafeGate.findOne({
      user: studentid,
      Date: {
        $gte: new Date(new Date().setHours(0, 0, 0)), // Start of the day
        $lt: new Date(new Date().setHours(23, 59, 59)), // End of the day
      },
    });

    // If the student has already checked in for the current meal, return an error
    if (existingCafe && existingCafe[currentMeal] === true) {
      return res
        .status(400)
        .send(`${currentMeal} has already been checked for today.`);
    }

    // Update or create the student's meal check-in for the current day
    const cafe = await CafeGate.findOneAndUpdate(
      {
        user: studentid,
        Date: {
          $gte: new Date(new Date().setHours(0, 0, 0)), // Start of the day
          $lt: new Date(new Date().setHours(23, 59, 59)), // End of the day
        },
      },
      {
        $set: {
          [currentMeal]: true,
        },
      },
      { new: true, upsert: true } // Create if doesn't exist
    );

    // Return the updated or created meal check-in
    return res.send(`${currentMeal} checked for today.`);
  } catch (err) {
    // Handle any unexpected errors
    return res.status(500).send(err.message || "Something went wrong.");
  }
});
Router.get("/report", async (req, res) => {
  const cafe = await CafeGate.find();
  return res.send(cafe);
});

module.exports = Router;
