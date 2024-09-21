const express = require("express");
const { User } = require("../Model/User");
const { Cafe } = require("../Model/Cafe");

const Router = express.Router();

Router.get("/activePersonel", async (req, res) => {
    const userincomponund = await User.countDocuments({ incomponund: true });
    const count = await User.countDocuments();

    return res.send({
        userincomponund: userincomponund,
        count: count


    })
  
});
Router.get("/activeSubscriptions", async (req, res) => {
    const count = await Cafe.countDocuments({
        enddate: { $gt: Date.now() },
    });
    const user=await User.countDocuments()
    return res.send({
        count: count,
        user:user
    })
    
})
Router.get("/department", async (req, res) => {
    const department=["Computer Science","electronics","civil","Mechanical","Electrical","Aeronautical","Production","chemical","Motor Vehicles"]
 
    const counts = await Promise.all(
        department.map(async (d) => ({
            department: d,
            count: await User.countDocuments({ department: d }),
        }))
    );
    const total = counts.reduce((t, c) => t + c.count, 0);
    const result = counts.map((c) => ({
        department: c.department,
        count: c.count,
        percentage: (c.count / total) * 100,
    }));
    
    return res.send(
result)
    
})

module.exports = Router;