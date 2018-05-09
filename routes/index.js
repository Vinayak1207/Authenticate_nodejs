var express = require('express');
var router = express.Router();
let User = require('../models/user')
var passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var nodemailer = require("nodemailer")

// Home Page
router.get('/',ensureAuthenticated, (req, res, next) => {
  res.render('index');
});


// Register Form
router.get('/register', (req, res, next) => {
  res.render('register');
});


router.get('/login', (req, res, next) => {
  res.render('login');
});

router.get("/logout",(req,res,next) => {
  req.logout();
  req.flash('success_msg','You are logged out');
  res.redirect('/login');
})

function ensureAuthenticated(req,res,next){
  if(req.isAuthenticated()){
    return next();

  }

  else{

    res.redirect("/login");


  }
}



router.post("/register", (req,res,next)=> {
  const Name = req.body.name;
  const Username = req.body.username;
  const Email= req.body.email;
  const Password = req.body.password;
  const Password2 = req.body.password2;

  req.checkBody('name',"Name is required").notEmpty();
  req.checkBody('username',"Username is required").notEmpty();
  req.checkBody('email',"Email is require").notEmpty();
  req.checkBody('email',"Email format is not good").isEmail();
  req.checkBody('password',"Password is require").notEmpty();
  req.checkBody('password2',"Password confirmation is required").notEmpty();
  req.checkBody('password2',"Password is require").equals(req.body.password);

  let errors = req.validationErrors();

  if(errors){
    res.render('register', {
      errors: errors
    });
  }

  else{
    const newUser = new User({
      name:Name,
      username:Username,
      email:Email,
      password:Password
    })

    User.registerUser(newUser,(err,user)=> {
      if(err){
        throw err
      }
      req.flash('success_msg', "You are registered now!")
      res.redirect("/login")
    })
  }

})


//local strategy
passport.use(new LocalStrategy((username, password, done) => {
  User.getUserByUsername(username, (err, user) => {
    if(err) throw err;
    if(!user){
      return done(null, false, {message: 'No user found'});
    }

    User.comparePassword(password, user.password, (err, isMatch) => {
      if(err) throw err;
      if(isMatch){
        return done(null, user);
      } else {

        return done(null, false, {message: 'Wrong Password'});
      }

    });
  });
}));

//connecting user id with session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.getUserById(id, (err, user) => {
    done(err, user);
  });
});

// Login Processing
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect:'/',
    failureRedirect:'/login',
    failureFlash: true
  })(req,res,next);
});



//node mailer
router.post('/contact/send', function(req, res, next){
    var transporter = nodemailer.createTransport({
      service: 'Gmail',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'kunalgoswani@gmail.com',
        pass: 'veeislife'
      }
    });

    var mailOptions = {
      from: '"My Support" <kunalgoswani@gmail.com>',
      to: 'vinayak.bansal10@gmail.com',
      subject: 'Hello from PCRepair',
      text: 'You have a submission from...  Email: '+req.body.email+' Message: '+req.body.message,
      html: '<p>You have a submission from...</p> <ul><li>Name: '+req.body.name+'</li><li> Email: '+req.body.email+'</li><li> Message: '+req.body.message+'</li></ul>'
    }
//mail back
    var mailOptions2 = {
      from: '"Visit <visit@gmail.com',
      to: req.body.email,
      subject: 'Hello from PCRepair',
      text: "We got your message! Thanks for reaching us",

    }

    transporter.sendMail(mailOptions, function(error, info){
      if(error){
        return console.log(error);
      }
      console.log('Message Sent: '+ info.response);
      req.flash("success_msg","Thanks for contacting us")
      res.redirect('/');


    });

    //mail 2
    transporter.sendMail(mailOptions2, function(error, info){
      if(error){
        return console.log(error);
      }
      console.log('Message Sent: '+ info.response);

    });
});




module.exports = router;
