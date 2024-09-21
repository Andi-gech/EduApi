const express = require("express");
const Router = express.Router();
const { Post, validatePost } = require("../Model/Posts");
const AuthMiddleware = require("../MiddleWare/AuthMiddleware");
const upload = require("../utils/multerConfig");

const { roleAuth } = require("../MiddleWare/RoleAuth");
Router.post(
  "/",
  AuthMiddleware,
  roleAuth("student"),
  upload.single("Image"),
  async (req, res) => {
    try {
      const { error } = validatePost(req.body);
      const uploadedFile = req.file;
      if (!uploadedFile) {
        console.log("No file uploaded");
        return res.status(400).send("No file uploaded");
      }

      req.body.image = uploadedFile.path;

      if (error) return res.status(400).send(error.details[0].message);
      const post = new Post({
        content: req.body.content,
        user: req.user.unique,
        image: req.body.image,
      });
      await post.save();
      return res.send(post);
    } catch (err) {
      console.log(err);
      res.status(500).send(err.message || "Something went wrong");
    }
  }
);
Router.get("/", AuthMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({
      Viwers: { $ne: req.user._id },
    })
      .populate("user", "profilePic firstName lastName")
      .sort("-date");
    return res.send(posts);
  } catch (err) {
    res.status(500).send(err.message || "Something went wrong");
  }
});
Router.put("/viewer/:id", AuthMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(400).send("Post not found");
    if (post.Viwers.includes(req.user._id))
      return res.status(400).send("Already viewed");
    post.Viwers.push(req.user._id);
    await post.save();
    return res.send(post);
  } catch (err) {
    res.status(500).send(err.message || "Something went wrong");
  }
});
Router.put("/like/:id", AuthMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(400).send("Post not found");
    if (post.likedBy.includes(req.user._id))
      return res.status(400).send("Already liked");
    post.likedBy.push(req.user._id);
    await post.save();
    return res.send(post);
  } catch (err) {
    res.status(500).send(err.message || "Something went wrong");
  }
});
Router.put("/unlike/:id", AuthMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(400).send("Post not found");
    if (!post.likedBy.includes(req.user._id))
      return res.status(400).send("Not liked yet");
    post.likedBy = post.likedBy.filter((id) => id != req.user._id);
    await post.save();
    return res.send(post);
  } catch (err) {
    res.status(500).send(err.message || "Something went wrong");
  }
});

module.exports = Router;
