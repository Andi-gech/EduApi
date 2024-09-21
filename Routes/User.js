const express = require("express");
const Router = express.Router();
const { User, validateUser } = require("../Model/User");
const QRCode = require("qrcode");

const Authetication = require("../MiddleWare/AuthMiddleware");
const upload = require("../utils/multerConfig");
const { signData, verifyData } = require("../utils/Signiture");
const { encrypt, decrypt } = require("../utils/Crypto");

Router.post("/", Authetication, async (req, res) => {
  try {
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    console.log("user registration");

    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      auth: req.body.auth,

      gender: req.body.gender,

      yearLevel: req.body.yearLevel,
      department: req.body.department,
      semister: req.body.semister,

      profilePic: req.body.profilePic,
    });

    const result = await user.save();
    res.send(result);
  } catch (err) {
    res.send(err.message);
  }
});
Router.get("/me", Authetication, async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 5000)); // delay for 3 seconds

  try {
    const user = await User.findOne({ auth: req.user._id }).select("-password");
    console.log(user);
    res.send(user);
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
});
Router.get("/GenerateQR", Authetication, async (req, res) => {
  try {
    console.log(req.user._id, "req.user");
    const encrypted = encrypt(req.user._id);

    const signed = signData(encrypted);

    const datatoEncode = encrypted + ":" + signed;

    const qrcode = await QRCode.toDataURL(datatoEncode);
    console.log(qrcode);
    return res.send(qrcode);
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
});
Router.get("/getprofilepic/:id", Authetication, async (req, res) => {
  try {
    console.log(req.params.id)
    const user = await User.findById(req.params.id, { profilePic: 1 });
    if (!user) return res.status(400).send("User not found");
    res.send(user.profilePic);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

Router.put(
  "/updateProfilePic",
  Authetication,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      console.log("update profile pic");
      const uploadedFile = req.file;
      if (!uploadedFile) return res.status(400).send("No file uploaded");
      req.body.profilePic = uploadedFile.path;
      const user = await User.findOneAndUpdate(
        { auth: req.user._id },
        {
          profilePic: req.body.profilePic,
        },
        { new: true }
      );

      console.log(user);

      res.send(user);
    } catch (err) {
      return res.status(500).send(err.message);
    }
  }
);

Router.post("/verifyQR", Authetication, async (req, res) => {
  try {
    const qrurl = req.body.qrurl;

    // Extract encrypted data and signature from QR code
    const data = qrurl.split(":");
    console.log(data);

    const encrypted = data[0] + ":" + data[1];
    const signed = data[2];

    // Decrypt the encrypted data
    const datatoDecode = decrypt(encrypted);
    console.log(encrypted, "datatoDecode");

    // Verify the signature
    const verified = verifyData(encrypted, signed);

    if (verified) {
      // Signature is valid, send the decrypted data
      res.send(datatoDecode);
    } else {
      // Signature verification failed, QR code is invalid
      res.status(400).send("Invalid QR code");
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});
Router.get("/:id", Authetication, async (req, res) => {
  try {
    const user = await User.findOne({ auth: req.params.id }).select(
      "-password"
    );
    console.log(user);
    res.send(user);
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
});
module.exports = Router;
