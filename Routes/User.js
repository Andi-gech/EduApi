const express = require("express");
const Router = express.Router();
const { User, validateUser } = require("../Model/User");
const QRCode = require("qrcode");

const Authetication = require("../MiddleWare/AuthMiddleware");
const upload = require("../utils/multerConfig");
const { signData, verifyData } = require("../utils/Signiture");
const { encrypt, decrypt } = require("../utils/Crypto");
const { Class } = require("../Model/Class");

Router.post("/", Authetication, async (req, res) => {
  try {
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    console.log("user registration");
    console.log(req.body);
    const classRoom = await Class.findOne({
      department: req.body.department,
      year: req.body.yearLevel,
      semester: req.body.semister,
    });
    if (!classRoom) return res.status(400).send("Class not found");

    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      auth: req.body.auth,

      gender: req.body.gender,
      studentid: req.body.studentid,

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
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     tokenAuth:
 *       type: apiKey
 *       in: header
 *       name: Authorization
 *       description: JWT token required (without Bearer)
 *
 * /user/me:
 *   get:
 *     summary: Retrieve the authenticated user's profile information.
 *     tags:
 *       - User
 *     security:
 *       - tokenAuth: []  # JWT token required (without Bearer)
 *     responses:
 *       200:
 *         description: Successfully retrieved the user's profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Unique identifier for the user.
 *                 email:
 *                   type: string
 *                   description: Email of the user.
 *                 Role:
 *                   type: string
 *                   description: Role of the user.
 *       401:
 *         description: Unauthorized - User not authenticated.
 *       403:
 *         description: Forbidden - User lacks sufficient permissions.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Internal server error"
 */

Router.get("/me", Authetication, async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 5000)); // delay for 3 seconds

  try {
    const user = await User.findById(req.user.userid).select("-password");

    res.send(user);
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
});

/**
 * @swagger
 * /user/GenerateQR:
 *   get:
 *     summary: Generate a QR code for the authenticated user.
 *     tags:
 *       - QR Code
 *     security:
 *       - tokenAuth: []  # JWT token required (without Bearer)
 *     responses:
 *       200:
 *         description: QR code generated successfully.
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized - User not authenticated.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Internal server error"
 */
Router.get("/GenerateQR", Authetication, async (req, res) => {
  try {
    const encrypted = encrypt(req.user._id);

    const signed = signData(encrypted);

    const datatoEncode = encrypted + ":" + signed;

    const qrcode = await QRCode.toDataURL(datatoEncode);

    return res.send(qrcode);
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
});

/**
 * @swagger
 * /user/getprofilepic/{id}:
 *   get:
 *     summary: Get the profile picture of a user by ID.
 *     tags:
 *       - User
 *     security:
 *       - tokenAuth: []  # JWT token required (without Bearer)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the user whose profile picture is to be retrieved.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved the user's profile picture.
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: User not found.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Internal server error"
 */
Router.get("/getprofilepic/:id", Authetication, async (req, res) => {
  try {
    console.log(req.params.id);
    const user = await User.findById(req.params.id, { profilePic: 1 });
    if (!user) return res.status(400).send("User not found");
    res.send(user.profilePic);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
/**
 * @swagger
 * /user/updateProfilePic:
 *   put:
 *     summary: Update the user's profile picture.
 *     tags:
 *       - User
 *     security:
 *       - tokenAuth: []  # JWT token required (without Bearer)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePic:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Successfully updated the user's profile picture.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Unique identifier for the user.
 *                 profilePic:
 *                   type: string
 *                   description: URL/path of the updated profile picture.
 *       400:
 *         description: No file uploaded.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Internal server error"
 */
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

/**
 * @swagger
 * user/verifyQR:
 *   post:
 *     summary: Verify the QR code data and return decrypted information.
 *     tags:
 *       - QR Code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrurl:
 *                 type: string
 *                 description: The QR code URL or data.
 *     responses:
 *       200:
 *         description: Successfully verified the QR code and returned decrypted data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   description: Decrypted data from the QR code.
 *       400:
 *         description: Invalid QR code.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Internal server error"
 */
Router.post("/verifyQR", async (req, res) => {
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

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Retrieve user information by ID.
 *     tags:
 *       - User
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the user to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved user information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Unique identifier for the user.
 *                 email:
 *                   type: string
 *                   description: Email of the user.
 *                 role:
 *                   type: string
 *                   description: Role of the user.
 *       404:
 *         description: User not found.
 *       400:
 *         description: Invalid user ID.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "Internal server error"
 */
Router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    res.send(user);
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
});

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Retrieve all users.
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Unique identifier for the user.
 *                   email:
 *                     type: string
 *                     description: Email of the user.
 *                   role:
 *                     type: string
 *                     description: Role of the user.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
Router.get("/", async (req, res) => {
  try {
    const user = await User.find();
    res.send(user);
  } catch (err) {
    res.send(err.message);
  }
});
module.exports = Router;
