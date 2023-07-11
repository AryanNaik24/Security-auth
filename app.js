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
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate = require('mongoose-findorcreate')


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

//creating a new schema
const userSchema= new mongoose.Schema({
    email:String,
    password:String,
    googleId: String,
    secret:String
});

// {
//     type:String,
//     required:true,
//     unique:true}

// {type:String,
//     required:true}


userSchema.plugin(findOrCreate);
userSchema.plugin(passportLocalMongoose);







//encryption comes b4 mongoose.model
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']});
const User= mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log(profile);
    User.findOrCreate({ username: profile.email, googleId: profile.id}, function (err, user) {
      return done(err, user);
    });
  } 
));




//sending render requests
// 'email',
app.get("/",function (req,res) {
    res.render("home");
});
app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/'
}));

app.get("/login",function (req,res) {
    res.render("login");
});

app.get("/register",function (req,res) {
    res.render("register");
});
app.get("/secrets",function (req,res) {
    // if(req.isAuthenticated()){
    //     res.render("secrets");
    //     // next();
    // }else{
    //     res.redirect("/login");
    // }
    User.find({"secret":{$ne:null}}).then(function (foundUsers) {
            if(foundUsers){
                res.render('secrets',{usersWithSecrets:foundUsers});
            }
        
    }).catch(function (err) {
        if (err) {
            console.log(err);
        }
    });


});
app.get("/submit",function (req,res) {
    if(req.isAuthenticated()){
        res.render("submit");
        // next();
    }else{
        res.redirect("/login");
    }
})

app.get("/logout",function (req,res) {
    req.logout(function (err) {
        if(err){console.log(err);}else{
            res.redirect("/");
        }
    });
   
});




//sending post requests
app.post("/submit",function (req,res) {
    const submittedSecret=req.body.secret;
    User.findById(req.user.id).then(function (foundUser){
            if(foundUser){
                foundUser.secret=submittedSecret;
                foundUser.save().then(function () {
                    res.redirect("/secrets");
                }).catch(function (err) {
                    if (err) {
                        console.log(err);
                    }
                })
            }
        
    }).catch(function (err) {
        if (err) {
            console.log(err);
        }
    });
});


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


