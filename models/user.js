const mongoose=require('mongoose');
const Task=require('./task');
const validator=require('validator');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

const UserSchema= new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if (!validator.isEmail(value)){
                throw new Error("Invalid email");
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        trim:true,
        validate(value){
            if (value.toLowerCase().includes("password")){
                throw new Error("Password is not accepted");
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    picture: {
        type: Buffer
    }
},{timestamps:true});

//Declare relationship bw user and task
UserSchema.virtual("tasks",{
    ref: "Task",
    localField: "_id",
    foreignField: "owner"
});

//Send user data with the response (this method is called automatically)
UserSchema.methods.toJSON= function(){
    const user=this;
    const userObject=user.toObject();
    //Do not send user's secret info
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.picture;
    return userObject
}

//Generate token
UserSchema.methods.generateAuthToken= async function(){
    const user=this;
    const token=jwt.sign({_id: user._id.toString()},process.env.JWT_SECRET);
    user.tokens= user.tokens.concat({token});
    return token;
};

//Find user
UserSchema.statics.findByCredentials= async (email,password)=>{
    const user= await UserSchema.findOne({email});
    if (!user) throw new Error('Error');
    const passwordMatch= await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new Error('Error');
    return user;
};

//Hash password b4 saving
UserSchema.pre("save",async function(next){
    const user=this;
    if (user.isModified("password")) user.password=bcrypt.hash(user.password,8);
    next();
});

//delete all tasks when user is deleted
UserSchema.pre("remove", async function(next){
    const user=this;
    await Task.deleteMany({owner: user._id});
    next();
});

const User= mongoose.model("User",UserSchema);

module.exports= User;