const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = express.Router();

//Create new task
router.post("/tasks",auth, async(req,res)=>{
    const {user} = req;
    const task = new Task({
        ...req.body,
        owner: user._id
    });
    try{
        await task.save();
        res.status(201).send(task)
    } catch(error){
        res.status(400).send(error);
    }
});

//Get tasks
// /tasks?completed=true
// /tasks?limit=10&skip=0 
// /tasks?sortBy=createdAt_asc
// ?sortBy=createdAt:asc&completed=true&limit=1&skip=1

router.get("/tasks",auth, async(req,res)=>{
    const {user} = req;
    const match = {};
    const sort = {};
    if (req.query.completed) match.completed= req.query.completed =="true";
    if (req.query.sortBy){
        const parts = req.query.sortBy.split(":");
        sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
    }
    try{
        await user.populate({
            path: "tasks",
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        });
        res.send(user.tasks);
    } catch (error){
        res.status(500).send();
    }
});

//get specific task
router.get("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id;
    try {
      const task = await Task.findOne({ _id, owner: req.user._id });
      if (!task) {
        return res.status(404).send("Task not found");
      }
      res.send(task);
    } catch (error) {
      res.status(500).send(err);
    }
  });

//update task
router.patch("/tasks/:id", auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["description", "completed"];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).send("ERROR");
    }
  
    const _id = req.params.id;
    try {
      //* this logic for future use of middleware on updating tasks
      const task = await Task.findOne({ _id, owner: req.user._id });
      if (!task) {
        return res.status(404).send("Task not found");
      }
      updates.forEach((update) => (task[update] = req.body[update]));
      await task.save();
      res.send(task);
    } catch (error) {
      res.status(500).send(error);
    }
});

//! delete task
router.delete("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id;
    try {
      const task = await Task.findOneAndDelete({ _id, owner: req.user._id });
      if (!task) {
        res.status(404).send("Task not found");
      }
      res.send(task);
    } catch (error) {
      res.status(500).send(error);
    }
});
  
module.exports = router;