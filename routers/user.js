const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const {sendWelcomeMail, sendCancelationMail} = require("../email/sendmail");
const multer = require("multer");
const sharp = require("sharp");
const router = require("./task");
const { use } = require("bcrypt/promises");

//Sign up
router.post("/users", async (req,res)=>{
    const user = new User(req.body);
    try{
        await user.save();
        sendWelcomeMail(user.email, user.username);
        const token = await user.generateAuthToken();
        await user.save();
        res.send({user,token});
    } catch (error){
        res.status(400).send(error);
    }
});

//Log in
router.post("/users/login", async(req,res)=>{
    const {email,password} = req.body;
    try{
        const user = await User.findByCredentials(email, password);
        const token = await user.generateAuthToken();
        await user.save();
        res.send({user,token});
    } catch (error){
        res.status(400).send("Unable to Login");
    }
});

//Log out- single session
router.post("/users/logout", auth, async(req,res)=>{
    try{
        const {user} = req;
        user.tokens = user.tokens.filter((token) => token.token !== req.token);
        await user.save();
        res.send("Successfully log out");
    }catch (error){
        res.status(500).send();
    }
});

//Log out- multiple sessions
router.post("/users/logoutAll", auth, async(req,res)=>{
    try{
        const { user } = req;
        user.tokens = [];
        await user.save();
        res.status(200).send("Successfully log out from all browsers");
    }catch(error){
        res.status(500).send();
    }
});

//Profile
router.get("/users/me",auth, async(req,res)=>{
    const {user}=req;
    res.send(user);
});

//get User
router.get("/users/:id", async(req,res)=>{
    const _id = req.params.id;
    try{
        const user = await User.findById(_id);
        if (!user) return res.status(404).send("User not found");
        res.send(user);
    }catch(error){
        res.status(500).send(error);
    }
});

//Update User
router.patch("/users/me", auth, async(req,res)=>{
    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "email", "password", "age"];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).send("ERROR: Invalid Operation");
    }
    try {
        const { user } = req;
        updates.forEach((update) => (user[update] = req.body[update]));
        await user.save();
        res.send(user);
      } catch (error) {
        res.status(400).send(error);
      }
});

//Delete User
router.delete("/users/me",auth, async(req,res)=>{
    try{
        await req.user.remove();
        sendCancelationMail(req.user.email, req.user.name);
        res.send(req.user);
    }catch(error){
        res.status(404).send();
    }
});

//Upload image
const upload=multer({
    limits:{
        fileSize: 1000000
    },
    fileFilter(req,file,cb){
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Please upload an image"));
        }
        cb(undefined, true);
    }
});

router.post("/users/me/avatar", auth, upload.single("avatar"), async(req,res)=>{
    if (!req.file) return res.status(404).send("Image error");
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send("Image uploaded successfully");
},(error, req,res,next)=>{res.status(400).send({error: error.message})});

//Delete image
router.delete("/users/me/avatar", auth, async(req,res)=>{
    req.user.avatar = undefined;
    await req.user.save();
    res.status(200).send("Image deleted successfully");
});

//Get user image
router.get("/users/:id/avatar", async(req,res)=>{
    const _id = req.params.id;
    try{
        const user = await User.findById(_id);
        if (!user.avatar) throw new Error();
        res.set("Content-Type", "image/png");
        res.send(user.avatar);
    }catch(error){
        res.status(404).send("User or Image not found");
    }
});

module.exports = router;