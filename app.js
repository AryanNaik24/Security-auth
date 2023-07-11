//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// import mongoose from "mongoose";
const mongoose = require("mongoose");
const session = require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');


const app = express();



app.set("view engine", "ejs");



app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);


app.use(express.static("public"));


app.use(session({
    secret:"this is a secret.",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());


//local server hosting
mongoose.connect("mongodb://127.0.0.1:27017/userDB")
.then(()=>{
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
  console.log("successfully connected to userDB");
}).catch((err)=>{
  console.log(err);
});

// mongoose.set("useIndexCreate",true);

//cresting a new schema
const userSchema= new mongoose.Schema({
    email:String,
    password:String
});

// {
//     type:String,
//     required:true,
//     unique:true}

// {type:String,
//     required:true}



userSchema.plugin(passportLocalMongoose);





//encryption comes b4 mongoose.model
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']});
const User= mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//sending render requests

app.get("/",function (req,res) {
    res.render("home");
});
app.get("/login",function (req,res) {
    res.render("login");
});

app.get("/register",function (req,res) {
    res.render("register");
});
app.get("/secrets",function (req,res) {
    if(req.isAuthenticated()){
        res.render("secrets");
        // next();
    }else{
        res.redirect("/login");
    }
});
app.get("/logout",function (req,res) {
    req.logout(function (err) {
        if(err){console.log(err);}else{
            res.redirect("/");
        }
    });
   
})




//sending post requests

app.post("/register",function (req,res){

    User.register({username:req.body.username},req.body.password,function (err,user) {
        if(err){
            console.log(err);
            res.redirect('/register');
        }else{
            passport.authenticate("local")(req,res,function () {
                res.redirect("/secrets");
            });
        }
    });
    
});






app.post("/login",function (req,res) {
        const user= new User({
            username:req.body.username,
            password:req.body.password

        });

        req.login(user,function (err) {
            if (err) {
               console.log(err); 
            }
            else{
                passport.authenticate('local')(req,res,function () {
                    res.redirect("/secrets");
                });
            }
        });
});


