const express = require("express");
const { Cafe, validateCafe } = require("../Model/Cafe");
const Router = express.Router();
const Authetication = require("../MiddleWare/AuthMiddleware");
const { roleAuth } = require("../MiddleWare/RoleAuth");


Router.post("/subscribe",Authetication,roleAuth("student"),async (req, res) => {

    const { error } = validateCafe(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const subs= await Cafe.findOne({user:req.user._id,
        enddate:{$gt:Date.now()}
    })
    if(subs) return res.status(400).send("Already Subscribed")
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    if(currentDay>7) return res.status(400).send("Month Subscription not available")
    const cafe = new Cafe({
location:req.body.location,
        user: req.user._id,
        
        
       
    });
    await cafe.save();
    return res.send(cafe);
    
})
Router.get("/subscription/status",Authetication,async (req, res) => {
    try{
    const cafe = await Cafe.findOne({user:req.user._id,
        enddate:{$gt:Date.now()}
    })
    if(!cafe) return res.send({
        "status":false
    })
    
    return res.send({
"status":true


    });
}
catch(err){
    res.status(500).send(err.message||"Something went wrong")
}
    
})
Router.get("/subscriptions",Authetication,async (req, res) => {
    try{
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).send('Month and year parameters are required.');
        }

        const parsedMonth = parseInt(month);
        const parsedYear = parseInt(year);

        if (isNaN(parsedMonth) || isNaN(parsedYear)) {
            return res.status(400).send('Invalid month or year format.');
        }

        if (parsedMonth < 1 || parsedMonth > 12) {
            return res.status(400).send('Month must be between 1 and 12.');
        }
        

        const startDate = new Date(parsedYear, parsedMonth - 1, 1); 
        const endDate = new Date(parsedYear, parsedMonth, 0); 
        const cafes = await Cafe.find({
            
            startdate: { $gte: startDate, $lte: endDate },
            
        });
    return res.send(cafes)
}
catch(err){
    res.status(500).send(err.message||"Something went wrong")
}
    
})
Router.post("/subscribe/manual", Authetication, async (req, res) => {
    const { error } = validateCafe(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let usersToSubscribe = [];

    
    if (Array.isArray(req.body.users)) {
        usersToSubscribe = req.body.users;
    } else {
        usersToSubscribe.push(req.body.users); 
    }

    const subscriptions = [];
    for (let userId of usersToSubscribe) {
        const cafe = new Cafe({
            location: req.body.location,
            user: userId,
            startdate: req.body.startdate,
        });
        await cafe.save();
        subscriptions.push(cafe);
    }

    return res.send(subscriptions);
});




module.exports = Router