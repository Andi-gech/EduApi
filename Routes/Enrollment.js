const express = require("express");
const { EnrollCourse, ValidateEnrollCourse } = require("../Model/EnrollCourse");
const { User } = require("../Model/User");
const { CourseOffering, validate } = require("../Model/CourseOffering");
const { Course, ValidateCourse } = require("../Model/Course");
const Router = express.Router();
const Authetication = require("../MiddleWare/AuthMiddleware");
const { Class } = require("../Model/Class");

/**
 * @swagger
 * /enrollment/currentEnrollment:
 *   get:
 *     summary: Get current enrollment information for the user
 *     description: Retrieves the user's current course enrollments based on their class year level and semester.
 *     tags: [Enrollments]
 *     security:
 *       - tokenAuth: []
 *     responses:
 *       200:
 *         description: User's current course enrollments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Enrollment ID
 *                     example: "60a8e3622f8b9a3a4c8b9f13"
 *                   user:
 *                     type: string
 *                     description: User ID
 *                     example: "60a8e3b4f7c8e835d9b8c834"
 *                   currentYear:
 *                     type: integer
 *                     description: Year level of the user's class.
 *                     example: 3
 *                   currentSemester:
 *                     type: integer
 *                     description: Semester of the user's class.
 *                     example: 2
 *                   course:
 *                     type: object
 *                     description: Course details
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Course ID
 *                         example: "60a8e41df7c8e835d9b8c835"
 *                       name:
 *                         type: string
 *                         description: Name of the course
 *                         example: "Introduction to Programming"
 *                       credits:
 *                         type: integer
 *                         description: Number of credits for the course
 *                         example: 3
 *       400:
 *         description: Invalid user or no enrollments found for the semester.
 *       500:
 *         description: Internal server error.
 */

Router.get("/currentEnrollment", Authetication, async (req, res) => {
  const user = await User.find({
    auth: req.user._id,
  }).populate({
    path: "Class",
    model: "Class",
  });
  if (!user) return res.status(400).send("Invalid user");
  const enroll = await EnrollCourse.find({
    user: user[0]._id,
    currentYear: user[0].Class.yearLevel,
    currentSemester: user[0].Class.semister,
  }).populate({
    path: "course",
    model: "Course",
  });
  console.log(enroll, "my enrollments");
  if (!enroll || enroll.length == 0)
    return res.status(400).send("You Have Not Registerd for this semister");
  res.send(enroll);
});
/**
 * @swagger
 * /enrollment/enroll:
 *   post:
 *     summary: Enroll a user in a course
 *     description: Allows an authenticated user to enroll in a course for the current year and semester.
 *     tags: [Enrollments]
 *     security:
 *       - tokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course:
 *                 type: string
 *                 description: ID of the course to enroll in.
 *                 example: "60a8e41df7c8e835d9b8c835"
 *     responses:
 *       200:
 *         description: User successfully enrolled in the course.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Enrollment ID
 *                   example: "60a8e3622f8b9a3a4c8b9f13"
 *                 user:
 *                   type: string
 *                   description: User ID
 *                   example: "60a8e3b4f7c8e835d9b8c834"
 *                 currentYear:
 *                   type: integer
 *                   description: Year level of the user's class.
 *                   example: 3
 *                 currentSemester:
 *                   type: integer
 *                   description: Semester of the user's class.
 *                   example: 2
 *                 course:
 *                   type: string
 *                   description: ID of the enrolled course.
 *                   example: "60a8e41df7c8e835d9b8c835"
 *       400:
 *         description: Invalid user, course validation error, or already enrolled in the course.
 *       500:
 *         description: Internal server error.
 */
Router.post("/enroll", Authetication, async (req, res) => {
  const { error } = ValidateEnrollCourse;
  if (error) return res.status(400).send(error.details[0].message);
  const user = await User.find({
    auth: req.user._id,
  }).populate({
    path: "Class",
    model: "Class",
  });

  if (!user) return res.status(400).send("Invalid user");
  console.log(user[0].Class, "yearLevel");
  const isAlreadyEnroll = await EnrollCourse.findOne({
    user: user[0]._id,
    currentYear: user[0].Class.yearLevel,
    currentSemester: user[0].Class.semister,
    course: req.body.course,
  });
  console.log(isAlreadyEnroll, "isAlreadyEnroll");
  if (isAlreadyEnroll) return res.status(400).send("Already Enrolled");

  const Enrolled = EnrollCourse({
    user: user[0]._id,
    currentYear: user[0].Class.yearLevel,
    currentSemester: user[0].Class.semister,
    course: req.body.course,
  });

  await Enrolled.save();

  return res.send(Enrolled);
});
/**
 * @swagger
 * /enrollment/GetAllClass:
 *   get:
 *     summary: Retrieve all class information
 *     description: Returns all class information
 *     tags:
 *       - Class
 *     responses:
 *       200:
 *         description: Successfully retrieved class information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Class ID
 *                   example: "60a8e3622f8b9a3a4c8b9f13"
 *                 yearLevel:
 *                   type: integer
 *                   description: Year level of the class
 *                   example: 3
 *                 department:
 *                   type: string
 *                   description: Department of the class
 *                   example: "Computer Science"
 *                 semester:
 *                   type: integer
 *                   description: Semester of the class
 *                   example: 2
 *                 date:
 *                   type: string
 *                   description: Date of the class
 *                   example: "2021-05-21T00:00:00.000Z"
 *       400:
 *         description: No class information found.
 *       500:
 *         description: Internal server error.
 */

Router.get("/GetAllClass", async (req, res) => {
  const classs = await Class.find();
  res.send(classs);
});
/**
 * @swagger
 * /enrollment/GetMyoffering:
 *   get:
 *     summary: Retrieve course offerings for the current user
 *     description: Returns the available course offerings based on the user's class information.
 *     tags: [Course Offerings]
 *     security:
 *       - tokenAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved course offerings.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Course offering ID
 *                   example: "60a8e3622f8b9a3a4c8b9f13"
 *                 department:
 *                   type: string
 *                   description: Department of the course offering
 *                   example: "Computer Science"
 *                 yearLevel:
 *                   type: integer
 *                   description: Year level for the course offering
 *                   example: 3
 *                 semister:
 *                   type: integer
 *                   description: Semester for the course offering
 *                   example: 2
 *                 courses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       course:
 *                         type: string
 *                         description: ID of the course
 *                         example: "60a8e41df7c8e835d9b8c835"
 *                       courseName:
 *                         type: string
 *                         description: Name of the course
 *                         example: "Introduction to Programming"
 *       400:
 *         description: Invalid user or no offerings found for the user.
 *       500:
 *         description: Internal server error.
 */

Router.get("/GetMyoffering", Authetication, async (req, res) => {
  try {
    console.log("getting Offering");
    const user = await User.find({
      auth: req.user._id,
    }).populate({
      path: "Class",
      model: "Class",
    });
    if (!user) return res.status(400).send("Invalid user");
    console.log("getting offering for ", user);
    console.log(user[0].Class.department, "department");
    console.log(user[0].Class.yearLevel);
    console.log(user[0].Class.semister);

    const offerdCourse = await CourseOffering.findOne({
      department: user[0].Class.department,
      yearLevel: user[0].Class.yearLevel,
      semister: user[0].Class.semister,
    }).populate({
      path: "courses.course",
      model: "Course",
    });
    console.log(offerdCourse.courses);

    return res.send(offerdCourse);
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
});
/**
 * @swagger
 * /enrollment/GetSchedule:
 *   get:
 *     summary: Retrieve the class schedule for the current user
 *     description: Returns the schedule for courses offered to the user based on their class information, grouped by day.
 *     tags: [Schedule]
 *     security:
 *       - tokenAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved the schedule.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     courseName:
 *                       type: string
 *                       description: Name of the course.
 *                       example: "Introduction to Programming"
 *                     time:
 *                       type: string
 *                       description: Scheduled time for the course.
 *                       example: "10:00 AM - 11:30 AM"
 *       400:
 *         description: Invalid user or no course offerings found.
 *       404:
 *         description: No course offering found.
 *       500:
 *         description: Internal server error.
 */

Router.get("/GetSchedule", Authetication, async (req, res) => {
  try {
    console.log("getting Offering");

    // Fetch the user based on authentication
    const user = await User.find({
      auth: req.user._id,
    }).populate({
      path: "Class",
      model: "Class",
    });

    if (!user || user.length === 0) return res.status(400).send("Invalid user");
    console.log(user[0].Class, "department");
    // Fetch the offered courses based on the user's department, year level, and semester
    const offeredCourse = await CourseOffering.findOne({
      department: user[0].Class.department,
      yearLevel: user[0].Class.yearLevel,
      semister: user[0].Class.semister,
    }).populate({
      path: "courses.course",
      model: "Course", // Assuming 'Course' is your course model
    });

    if (!offeredCourse) return res.status(404).send("No course offering found");

    // Create an object to store schedule by day
    const scheduleByDay = {};

    // Loop through the courses and schedule them by day
    offeredCourse.courses.forEach((courseObj) => {
      const course = courseObj.course; // Populated course details
      console.log(course);
      courseObj.Schedule.forEach((schedule) => {
        const day = schedule.day;
        const time = schedule.time;

        // Initialize the day in the result if it doesn't exist
        if (!scheduleByDay[day]) {
          scheduleByDay[day] = [];
        }

        // Add course and its schedule to the corresponding day
        scheduleByDay[day].push({
          courseName: course.Coursename, // Assuming 'name' is the course name
          time: time,
        });
      });
    });

    console.log(scheduleByDay);

    // Send the schedule grouped by day
    return res.status(200).send(scheduleByDay);
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message);
  }
});
/**
 * @swagger
 * /enrollment/assignCourse:
 *   post:
 *     summary: Assign courses to a department for a specific year level and semester
 *     description: Assigns a set of courses to a given department, year level, and semester, preventing duplicate assignments.
 *     tags: [Course Offering]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courses:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of course IDs to be assigned.
 *                 example: ["courseId1", "courseId2"]
 *               department:
 *                 type: string
 *                 description: The department to which the courses will be assigned.
 *                 example: "Computer Science"
 *               yearLevel:
 *                 type: integer
 *                 description: The year level for the course offering.
 *                 example: 2
 *               semister:
 *                 type: string
 *                 description: The semester for the course offering (e.g., "Fall", "Spring").
 *                 example: "Fall"
 *     responses:
 *       200:
 *         description: Successfully assigned courses to the specified department, year level, and semester.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The unique identifier for the assigned course offering.
 *                 courses:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of course IDs assigned.
 *                 department:
 *                   type: string
 *                   description: Assigned department.
 *                 yearLevel:
 *                   type: integer
 *                   description: Assigned year level.
 *                 semister:
 *                   type: string
 *                   description: Assigned semester.
 *       400:
 *         description: Course already assigned or validation error.
 *       500:
 *         description: Internal server error.
 */
Router.post("/assignCourse", async (req, res) => {
  const { error } = validate(req.body);
  console.log(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const courses = await CourseOffering.find({
    department: req.body.department,
    yearLevel: req.body.yearLevel,
    semister: req.body.semister,
  });
  if (courses.length > 0)
    return res.status(400).send("Course Already Assigned");
  const assigncourse = CourseOffering({
    courses: req.body.courses,
    department: req.body.department,
    yearLevel: req.body.yearLevel,
    semister: req.body.semister,
  });
  await assigncourse.save();
  return res.send(assigncourse);
});
/**
 * @swagger
 * /enrollment/CreateCourse:
 *   post:
 *     summary: Create a new course
 *     description: This endpoint allows users to create a new course by providing the course details.
 *     tags: [Course]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Coursename:
 *                 type: string
 *                 description: The name of the course.
 *                 example: "Introduction to Programming"
 *               Coursecode:
 *                 type: string
 *                 description: The unique code for the course.
 *                 example: "CS101"
 *               creaditHrs:
 *                 type: integer
 *                 description: The number of credit hours for the course.
 *                 example: 3
 *               department:
 *                 type: string
 *                 description: The department that offers the course.
 *                 example: "Computer Science"
 *     responses:
 *       200:
 *         description: Successfully created a new course.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The unique identifier for the course.
 *                 Coursename:
 *                   type: string
 *                   description: The name of the course.
 *                 Coursecode:
 *                   type: string
 *                   description: The unique code for the course.
 *                 creaditHrs:
 *                   type: integer
 *                   description: The number of credit hours for the course.
 *                 department:
 *                   type: string
 *                   description: The department that offers the course.
 *       400:
 *         description: Validation error, invalid course details.
 *       500:
 *         description: Internal server error.
 */
Router.post("/CreateCourse", async (req, res) => {
  const { error } = ValidateCourse(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  console.log(req.body);
  const course = new Course({
    Coursename: req.body.Coursename,
    Coursecode: req.body.Coursecode,
    creaditHrs: req.body.creaditHrs,
    department: req.body.department,
  });
  await course.save();
  return res.send(course);
});

module.exports = Router;
