const express = require("express");
const { EnrollCourse,ValidateEnrollCourse } = require("../Model/EnrollCourse");
const { User } = require("../Model/User");
const { CourseOffering,validate } = require("../Model/CourseOffering");
const {Course,ValidateCourse}=require("../Model/Course")
const Router = express.Router();
const Authetication = require("../MiddleWare/AuthMiddleware");

Router.get("/currentEnrollment",Authetication, async(req, res) => {
    const user=await User.find({
        auth:req.user._id
    })
    if(!user) return res.status(400).send("Invalid user");
    const enroll=await EnrollCourse.find(
        {
            user:user[0]._id,
            currentYear:user[0].yearLevel,
            currentSemester:user[0].semister
        }
    ).populate({
        path:"course",
        model:"Course"
    })
    console.log(enroll)
    if (!enroll||enroll.length==0) return res.status(400).send("You Have Not Registerd for this semister");
    res.send(enroll)
    


    
})
Router.post("/enroll",Authetication, async(req, res) => {
    const {error}=ValidateEnrollCourse
    if(error) return res.status(400).send(error.details[0].message);
    const user=await User.find(
        {
            auth:req.user._id
        }
    )
    
    if(!user) return res.status(400).send("Invalid user");
    const isAlreadyEnroll=await EnrollCourse.findOne(
        {
            user:user[0]._id,
            currentYear:user[0].yearLevel,
            course:req.body.course
        }
    )
    console.log(isAlreadyEnroll,
        "isAlreadyEnroll"
    )
    if(isAlreadyEnroll) return res.status(400).send("Already Enrolled");
   
      const  Enrolled=EnrollCourse(
            {
                user:user[0]._id,
                currentYear:user[0].yearLevel,
                currentSemester:user[0].semister,
                course:req.body.course
            }
        )
       
    await Enrolled.save()


   
    
    return res.send(Enrolled)
    


    
})
Router.get("/GetMyoffering",Authetication, async(req, res) => {
    try{
    console.log("getting Offering")
    const user=await User.find(
        {
            auth:req.user._id
        }
    )
    if(!user) return res.status(400).send("Invalid user");
    console.log(user[0].department,"department")
    console.log(user[0].yearLevel)
    console.log(user[0].semister)
    //{
//   _id: new ObjectId('6672e43691240a89f73490ee'),
//   courses: [
//     {
//       course: new ObjectId('6672defbe23e35d8b98e6506'),
//       _id: new ObjectId('6672e43691240a89f73490ef')
//     }
//   ],
//   yearLevel: '5',
//   department: 'Computer Science',
//   semister: '2',
//   date: 2024-06-19T13:59:18.504Z,
//   __v: 0
// }

const offerdCourse = await CourseOffering.findOne({
    department: user[0].department,
    yearLevel: user[0].yearLevel,
    semister: user[0].semister,
}).populate({
    path: 'courses.course',
    model: 'Course'
})
    console.log(offerdCourse.courses)
    
    return res.send(offerdCourse)

}
catch(err){
    console.log(err)
    res.send(err.message)
}
})
Router.get("/GetSchedule", Authetication, async (req, res) => {
    try {
      console.log("getting Offering");
  
      // Fetch the user based on authentication
      const user = await User.find({
        auth: req.user._id,
      });
  
      if (!user || user.length === 0) return res.status(400).send("Invalid user");
  
      // Fetch the offered courses based on the user's department, year level, and semester
      const offeredCourse = await CourseOffering.findOne({
        department: user[0].department,
        yearLevel: user[0].yearLevel,
        semister: user[0].semister,
      }).populate({
        path: 'courses.course',
        model: 'Course', // Assuming 'Course' is your course model
      });
  
      if (!offeredCourse) return res.status(404).send("No course offering found");
  
      // Create an object to store schedule by day
      const scheduleByDay = {};
  
      // Loop through the courses and schedule them by day
      offeredCourse.courses.forEach((courseObj) => {
        const course = courseObj.course; // Populated course details
  console.log(course)
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
  
Router.post("/assignCourse", async(req, res) => {
    const {error}=validate(req.body)
    console.log(req.body)
    if(error) return res.status(400).send(error.details[0].message);
    const courses=await CourseOffering.find(
        {
            department:req.body.department,
            yearLevel:req.body.yearLevel,
            semister:req.body.semister
        }
    )
    if(courses.length>0)return res.status(400).send("Course Already Assigned")
    const assigncourse=CourseOffering(
        {
            courses:req.body.courses,
            department:req.body.department,
            yearLevel:req.body.yearLevel,
            semister:req.body.semister
        }
    )
    await assigncourse.save()
    return res.send(assigncourse)
    })
Router.post("/CreateCourse",async(req, res) => {
    const {error}=ValidateCourse(req.body)
    if(error) return res.status(400).send(error.details[0].message);
    console.log(req.body)
    const course=new Course({
        Coursename:req.body.Coursename,
        Coursecode:req.body.Coursecode,
        creaditHrs:req.body.creaditHrs,
        department:req.body.department,

    }) 
    await course.save()
    return res.send(course) 
})
module.exports = Router