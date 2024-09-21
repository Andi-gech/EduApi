const mongoose = require("mongoose");
const joi = require("joi");

const CourseOfferingSchema = new mongoose.Schema({
    courses: [
       {
           course: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "Course",
               required: true
           },
           teacher: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "Teacher",
           },
           Schedule: {
                type: [
                    {
                        day: {
                            type: String,
                            enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                        },
                        time: {
                            type: String,
                            required: true
                        }
                    }
                ]
           }
       }
    ],
    yearLevel: {
        type: String,
        required: true,
        enum: ["1", "2", "3", "4", "5"]
    },
    department: {
        type: String,
        enum: ["Computer Science", "electronics", "civil", "Mechanical", "Electrical", "Aeronautical", "Production", "chemical", "Motor Vehicles"]
    },
    semister: {
        type: String,
        required: true,
        enum: ["1", "2"]
    },
    date: {
        type: Date,
        default: Date.now
    }
});

CourseOfferingSchema.pre('save', async function (next) {
    try {
        const courseIds = this.courses.map(c => c.course);
        const teacherIds = this.courses.map(c => c.teacher).filter(t => t);

        // Check if all course IDs exist
        const courses = await mongoose.model("Course").find({ _id: { $in: courseIds } });
        console.log(courses);
        if (courses.length !== courseIds.length) {
            throw new Error("One or more courses do not exist.");
        }

        // // Check if all teacher IDs exist
        // const teachers = await mongoose.model("Teacher").find({ _id: { $in: teacherIds } });
        // if (teachers.length !== teacherIds.length) {
        //     throw new Error("One or more teachers do not exist.");
        // }

        next();
    } catch (err) {
        next(err);
    }
});

const CourseOffering = mongoose.model("CourseOffering", CourseOfferingSchema);

const joischema = joi.object({
    courses: joi.array().items(
        joi.object({
            course: joi.string().required(),
            teacher: joi.string(),
            Schedule: joi.array().items(
                joi.object({
                    day: joi.string().valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday").required(),
                    time: joi.string().required()
                })
            )
        })
    ).required(),
    yearLevel: joi.string().valid("1", "2", "3", "4", "5").required(),
    semister: joi.string().valid("1", "2").required(),
    department: joi.string().valid("Computer Science", "electronics", "civil", "Mechanical", "Electrical", "Aeronautical", "Production", "chemical", "Motor Vehicles").required(),
});

const validate = (joiobject) => {
    return joischema.validate(joiobject);
}

module.exports = { CourseOffering, validate };
