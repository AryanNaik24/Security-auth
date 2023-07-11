//jshint esversion:6
require('dotenv').config()
const bcrypt=require("bcrypt");
const saltRounds=15;
// const md5 = require("md5");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// import mongoose from "mongoose";

const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");



const app = express();



app.set("view engine", "ejs");



app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);


app.use(express.static("public"));
//mongodb://localhost:27017/wikiDB
//mongodb+srv://arondarksider:catfish2324@cluster0.ghiphee.mongodb.net/wikiDB?retryWrites=true&w=majority

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

//cresting a new schema
const userSchema= new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true},
    password:{type:String,
        required:true}
});





//encryption comes b4 mongoose.model
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']});
const User= mongoose.model("User",userSchema);


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





//sending post requests

app.post("/register",function (req,res){

    //salting&hashing
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        const newUser=new User({
            email:req.body.username,
            password:hash
        });
    
        newUser.save().then(()=>{
    
                res.render("secrets");}
        ).catch((err)=>{
            console.log(err);
        });
    });
    
});






app.post("/login",function (req,res) {
  const username= req.body.username;
  const password= req.body.password;

  User.findOne({email:username}).then(function (foundUser) {

    // const hashPass=md5();
        if(foundUser){
            bcrypt.compare(password, foundUser.password, function(err, result) {
                // result == true
                if (result == true) {
                    res.render("secrets"); 
                }
                
            });
               
            // bcrypt.compare(password,foundUser.password, function(err, result) {
            //     // result == false
            //     if (result == false) {
            //         console.log("incorrect password or username");
            //     }
              
            // });
              
           
        }
    
  }).catch((err)=>{
    console.log(err);
  });
});


