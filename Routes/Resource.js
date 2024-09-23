const express = require("express");
const { CourseResource } = require("../Model/CourseResource");
const Router = express.Router();
const Authetication = require("../MiddleWare/AuthMiddleware");
const { roleAuth } = require("../MiddleWare/RoleAuth");
const upload = require("../utils/multerConfig");

Router.get("/", Authetication, async (req, res) => {
  try {
    const resources = await CourseResource.find().populate("course");
    res.send(resources);
  } catch (err) {
    res.status(500).send(err.message || "Something went wrong");
  }
});
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
