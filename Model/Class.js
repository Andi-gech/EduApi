const mongoose = require("mongoose");
const joi = require("joi");

const classSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true,
  },
  year: {
    type: String,
    enum: ["1", "2", "3", "4", "5"],
    default: "1",
  },
  semester: {
    type: String,
    enum: ["1", "2"],
    default: "1",
  },
  department: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Class = mongoose.model("Class", classSchema);

const joischema = joi.object({
  startDate: joi.date().required(),
  year: joi.string().valid("1", "2", "3", "4", "5"),
  semester: joi.string().valid("1", "2"),
  department: joi.string().required(),
});
const validateClass = (classs) => {
  return joischema.validate(classs);
};

module.exports = { Class, validateClass };
