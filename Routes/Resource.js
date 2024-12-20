const express = require("express");
const { CourseResource } = require("../Model/CourseResource");
const Router = express.Router();
const Authetication = require("../MiddleWare/AuthMiddleware");
const { roleAuth } = require("../MiddleWare/RoleAuth");
const upload = require("../utils/multerConfig");

/**
 * @swagger
 * /resource/:
 *   get:
 *     summary: Retrieve course resources
 *     description: Returns a list of all course resources populated with their associated course details. This endpoint requires authentication.
 *     tags: [Course Resources]
 *     security:
 *       - tokenAuth: []  # Specify your authentication method, like bearer token
 *     responses:
 *       200:
 *         description: A list of course resources
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Unique identifier for the resource.
 *                     example: "60c72b2f9b1e8e001f4f1d1e"
 *                   title:
 *                     type: string
 *                     description: Title of the resource.
 *                     example: "Introduction to Node.js"
 *                   description:
 *                     type: string
 *                     description: Description of the resource.
 *                     example: "A comprehensive guide to Node.js."
 *                   course:
 *                     type: object
 *                     description: The course associated with this resource.
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Unique identifier for the course.
 *                         example: "60c72b2f9b1e8e001f4f1d1f"
 *                       name:
 *                         type: string
 *                         description: Name of the course.
 *                         example: "Node.js Fundamentals"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message describing the issue.
 *                   example: "Something went wrong."
 */
Router.get("/", Authetication, async (req, res) => {
  try {
    const resources = await CourseResource.find().populate("course");
    res.send(resources);
  } catch (err) {
    res.status(500).send(err.message || "Something went wrong");
  }
});

/**
 * @swagger
 * /resource/{courseid}:
 *   post:
 *     summary: Upload a course resource
 *     description: Uploads a new resource for a specific course. Requires authentication and a file upload. The file is sent in the request body under the key "resource".
 *     tags: [Course Resources]
 *     security:
 *       - tokenAuth: []  # Specify your authentication method, like bearer token
 *     parameters:
 *       - name: courseid
 *         in: path
 *         required: true
 *         description: The ID of the course to which the resource is being uploaded.
 *         schema:
 *           type: string
 *           example: "60c72b2f9b1e8e001f4f1d1f"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resource:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload (e.g., PDF, image).
 *     responses:
 *       200:
 *         description: The resource was successfully uploaded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Unique identifier for the resource.
 *                   example: "60c72b2f9b1e8e001f4f1d1e"
 *                 course:
 *                   type: string
 *                   description: ID of the associated course.
 *                   example: "60c72b2f9b1e8e001f4f1d1f"
 *                 resource:
 *                   type: string
 *                   description: Path to the uploaded resource file.
 *                   example: "/uploads/resource.pdf"
 *                 type:
 *                   type: string
 *                   description: MIME type of the uploaded file.
 *                   example: "application/pdf"
 *                 size:
 *                   type: integer
 *                   description: Size of the uploaded file in bytes.
 *                   example: 204800
 *       400:
 *         description: Bad request if no file is uploaded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No file uploaded"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message describing the issue.
 *                   example: "Something went wrong."
 */

Router.post(
  "/:courseid",
  Authetication,
  upload.single("resource"),
  async (req, res) => {
    try {
      const uploadedFile = req.file;
      if (!uploadedFile) return res.status(400).send("No file uploaded");
      req.body.type = uploadedFile.mimetype;
      req.body.resource = uploadedFile.path;
      req.body.size = uploadedFile.size;
      const resource = new CourseResource({
        course: req.params.courseid,
        resource: req.body.resource,
        type: req.body.type,
        size: req.body.size,
      });
      await resource.save();
      res.send(resource);
    } catch (err) {
      res.status(500).send(err.message || "Something went wrong");
    }
  }
);
module.exports = Router;
