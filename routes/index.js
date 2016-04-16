//email send module for node.js
var fs = require('fs');
var util = require('util');
var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var multer = require('multer');
var nodemailer = require('nodemailer');
var upload = multer({ dest: 'uploads/' });
var images = multer({dest: 'news_images/'});
var attachment = multer({dest: 'attachment/'});

var MongoClient = require('mongodb').MongoClient;
var connString = 'mongodb://localhost:27017/conference';


var transporter = nodemailer.createTransport({
  host: "213.55.83.211",
  auth: {
    user: "conference@smuc.edu.et",
    pass: "12345aA"
    }
  });

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.session.authStatus){
  res.render('home', { title: 'Conference SMU', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
  } else {
  res.render('home', { title: 'Conference SMU' });
  }});
//get request for login page
router.get('/login', function(req, res, next){
    if(!req.session.authStatus){
      res.render('login', { title: 'Conference | Login' });
    }else{
      next();
    }
});

//post back for login page
router.post('/loginpost', function(req, res, next){
    MongoClient.connect(connString, function(err, db){
      if(err) next(err);
      users = db.collection('users');
      users.find({'_id':req.body.email}).toArray(function(err, user){
        if(err) throw err;
        db.close();
        if(user[0]){
          if(user[0].password && user[0]._id){
            var decipher = crypto.createDecipher('aes-128-cbc', '3iusVDK7Ypg7nbPQhtB4tNkXqZPjvNjY');
            decipher.update(user[0].password, 'base64', 'utf8');
            var decrypted = decipher.final('utf8');
            if(req.body.password === decrypted){
              req.session.email = user[0]._id;
              req.session.authStatus = 'loggedIn';
              req.session.firstname = user[0].firstname;
              req.session.role = user[0].role;
              res.status(200).end();
            }else{
              res.status(500).end();
            }
        }else{
          res.status(500).end();
        }
      }else{
          res.status(500).end();
      }
      });
    });
});

//Submission Information display
router.get('/submission_information', function(req, res, next){
  if(req.session.authStatus){
  res.render('submission_information', {title: 'Conference | Submission Information', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
  } else{
  res.render('submission_information', {title: 'Conference | Submission Information'});
  }
});
//general infromation display
router.get('/general_information', function(req, res, next){
  if(req.session.authStatus){
  res.render('general_information', {title: 'Conference | General Information', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
  } else{
  res.render('general_information', {title: 'Conference | General Information'});
  }
});
//participate
router.get('/participate', function(req, res, next){
  res.render('participate', {title:'Conference | Participate'});
});
//Travel Information display
router.get('/travel_information', function(req, res, next){
  if(req.session.authStatus){
  res.render('travel_information', {title: 'Conference | Travel Information', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
  } else{
  res.render('travel_information', {title: 'Conference | Travel Information'});
  }
});
//get request for register page
router.get('/register', function(req, res, next){
  res.render('register', {title : 'Conference | Register' });
});
//email verification

router.get('/emailverify', function(req, res, next){
 //res.render('register', {title : 'Conference/'});
 MongoClient.connect(connString, function(err, db){
  if(err) next(err);
  var users = db.collection('users');

  users.findOne({_id:req.query.email}, function(err, user){
      if(err) throw err;
      if(!user){
        res.status(200).end();
      }else{
        res.writeHead(409, 'The email already exists.')
        res.end();
      }
    });
  });
});
//post back for register page
router.post('/register', function(req, res, next){
 //res.render('register', {title : 'Conference/'});
 MongoClient.connect(connString, function(err, db){
  if(err) next(err);
  var users = db.collection('users');

  users.findOne({_id:req.body.email}, function(err, user){
      if(err) throw err;

      var rand=Math.floor((Math.random() * 100) + 54);
      var host = req.hostname;
      var link = "http://" + host + "/verify?id=" + rand;
      mailOptions={
        from: 'conference@smuc.edu.et', //sender address
        to : req.body.email,
        subject : "Please confirm your Email account",
        html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
        //text: req.body.text, // plaintext body
      };

      if(!user){
        transporter.sendMail(mailOptions, function(error, response){
        if(error){
           console.log(error);
           res.status(554).end();
         }else{
             var cipher = crypto.createCipher('aes-128-cbc', '3iusVDK7Ypg7nbPQhtB4tNkXqZPjvNjY');
             cipher.update(req.body.password, 'utf8', 'base64');
             var encrypted = cipher.final('base64');
           //insert the user to the mongo database
           users.insert({
             _id:req.body.email,
             firstname:req.body.firstname,
             middlename:req.body.middlename,
             lastname:req.body.lastname,
             title:req.body.title,
             phone:req.body.phone,
             organization:req.body.organization,
             position:req.body.position,
             country:req.body.country,
             address:req.body.address,
             role:req.body.option,
             password:encrypted,
             verified: false,
             rand: rand.toString()
           },function(err, result){
             if(err) next(err);
             db.close();
             req.session.email = result.ops[0]._id;
             req.session.authStatus = 'loggedIn';
             req.session.firstname = result.ops[0].firstname;
             req.session.role = result.ops[0].role;

             console.log("Message sent: " + response.message);
             res.render('home',{title: 'SMU | Register', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
           });//insert user
        }
          });//sendMail callback
      }else{
        res.status(409).end("{'error':'this email addrss exists'}");
      }
  });
  });//MongoClient
});//register function
router.get('/verify', function(req, res, next){
  console.log(req.protocol+":/"+req.get('host'));
  if((req.protocol+"://" + req.host)===("http://" + req.host))
  {
    MongoClient.connect(connString, function(err, db){
      var users = db.collection('users');

      users.find({'rand':req.query.id}).toArray(function(err, user){

        if(user.length === 0){
            res.end('<h1>Request is from unknown source</h1>');
        }else{
          users.update({'rand':req.query.id}, {$set:{'verified':true}}, {'upsert':true}, function(err, result){
            if(err) throw err;
            db.close();
            mailOptions={
                    from: 'conference@smuc.edu.et', //sender address
                    to : user[0]._id,
                    subject : "Your email is confirmed",
                    html : "Thank you for registering to our website."
            }
            transporter.sendMail(mailOptions, function(err, response){
              if(err){
                throw err;
              }else{

                req.session.email = user[0]._id;
                req.session.authStatus = 'loggedIn';
                req.session.firstname = user[0].firstname;
                req.session.role = user[0].role;
                console.log("Message sent: " + response.message);
                res.redirect('/');
              }
            });
          });
        }
      });
    });
  }
  else{
    req.end('<h1>Request is from unknown source</h1>');
  }
});

router.get('/email', function(req, res, next){
    if(req.session.authStatus && req.session.role === 'coordinator'){
    res.render('coordinator/email', { title: 'Conference | email', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
  } else if(req.session.authStatus && req.session.role === 'reviewer'){
  res.render('reviewer/email', { title: 'Conference | email', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
  } else {
    res.redirect('404');
  }
});

router.get('/inbox', function(req, res, next){
  MongoClient.connect(connString, function(err, db){
    if(err) next(err);
    var users = db.collection('users');
    users.aggregate([{'$match':{'_id':req.session.email}},
    {'$unwind':'$inbox'},
    {'$sort':{'inbox.date':1}},
    {'$group':{'_id':'$_id', 'inbox':{'$push': '$inbox'}}}]).toArray(function(err, user){
      if(err) throw err;
      db.close();
      if(user[0]){
        if(req.session.authStatus && req.session.role === 'coordinator') {
          res.render('coordinator/inbox', { title: 'Conference | email', 'emails':user[0].inbox, 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
        }else if(req.session.authStatus && req.session.role === 'writer') {
          res.render('writer/inbox', { title: 'Conference | email', 'emails':user[0].inbox, 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
        } else if(req.session.authStatus && req.session.role === 'reviewer') {
          res.render('reviewer/inbox', { title: 'Conference | email', 'emails':user[0].inbox, 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
        } else {
          res.redirect('404');
        }
      }else{
        res.render('reviewer/inbox', { title: 'Conference | email', 'emails':'', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
      }
  });
  });
});
router.post('/emailread', function(req, res, next){
  MongoClient.connect(connString, function(err, db){
    if(err) throw err;
    var users = db.collection('users');
    if(req.body.date){
      date = new Date(req.body.date).toGMTString();
      users.update({'_id':req.session.email, 'inbox.date': date},
        {'$set':{'inbox.$.read': true}},
        {upsert: true}, function(err, result){
          db.close();
          console.log(result);
          res.redirect('/inbox');
      });
    }
  });
});
//send email
router.post('/email', attachment.fields([{name:'address', maxCount:1},{name:'subject', maxCount:1},
            {name:'text', maxCount:1}, {name:'file', maxCount:1}]), function(req, res, next){
  //defind a file to attach
    if(req.files.file){
        var file = {
        originalname: req.files.file[0].originalname,
        encoding: req.files.file[0].encoding,
        mimitype: req.files.file[0].mimetype,
        destination: req.files.file[0].destination,
        filename: req.files.file[0].filename,
        size: req.files.file[0].size,
        date: new Date().toGMTString()
        };
      }
      if(req.session.role === 'coordinator'){
        var from = 'conference@smuc.edu.et';
      } else {
        var from = req.session.email;
      }
      if(req.files.file){
        var mailOptions = {
        from: from, //sender address
        to: req.body.address, // list of receivers
        subject: req.body.subject, // Subject line
        text: req.body.text, // plaintext body
        attachments: [
          {   // file on disk as an attachment
              filename: file.originalname,
              path: 'attachment/'+ file.filename // stream this file
          }]
        };
    }else{
      var mailOptions = {
      from: from, //sender address
      to: req.body.address, // list of receivers
      subject: req.body.subject, // Subject line
      text: req.body.text, // plaintext body
      };
    }// send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
          return console.log(error);
      }
      MongoClient.connect(connString, function(err, db){
        if(err) throw err;

        var users = db.collection('users');
        users.findAndModify(
          {_id:req.session.email},
          {_id: 1},
          {$push:{sent:{to: req.body.address,
                  subject:req.body.subject,
                  text: req.body.text,
                  date: new Date().toGMTString()
          }}},
          {upsert: true}, function(err, result){
          if(err) throw err;
          users.findAndModify(
            {_id:req.body.address},
            {_id: 1},
            {$push:{inbox:{to: req.body.address,
                    subject:req.body.subject,
                    text: req.body.text,
                    read: false,
                    attachment: file,
                    date: new Date().toGMTString()
            }}},
            {upsert: true}, function(err, result){
              db.close();
              console.log(result);
              res.redirect('/email');
        });
      });
      });
  });
});

router.get('/sent', function(req, res, next){
  MongoClient.connect(connString, function(err, db){
    if(err) next(err);
    users = db.collection('users');
    users.find({_id: req.session.email}).sort({"email.date":1}).toArray(function(err, user){
    if(err) throw err;
    db.close();
    if(user[0]){
      if(req.session.authStatus && req.session.role === 'coordinator'){
        res.render('coordinator/sent', { title: 'Conference | sent','emails': user[0].sent, 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
      } else if(req.session.authStatus && req.session.role === 'reviewer'){
        res.render('reviewer/sent', { title: 'Conference | sent','emails': user[0].sent,  'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
      } else {
        res.redirect('404');
      }
    }else{
      res.render('reviewer/sent', { title: 'Conference | sent','emails': '',  'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
    }
  })
  })
});

router.get('/logout', function(req, res, next){
  delete req.session.authStatus;
  delete req.session.user;
  delete req.session.role;
  //res.render('home', { title: 'Conference SMU' });
  res.redirect('/');
});
//faq
router.get('/faq', function(req, res, next){
      if(req.session.authStatus && req.session.role === 'writer'){
      res.render('faq', { title: 'Conference | FAQ', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
    } else if(req.session.authStatus && req.session.role === 'reviewer'){
    res.render('faq', { title: 'Conference | FAQ', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
    } else {
      res.render('faq', { title: 'Conference | FAQ'});
    }
});
//contact US
router.get('/contactus', function(req, res, next){
      if(req.session.authStatus && req.session.role === 'writer'){
      res.render('contactus', { title: 'Conference | Contact Us', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
    } else if(req.session.authStatus && req.session.role === 'reviewer'){
    res.render('contactus', { title: 'Conference | Contact Us', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
    } else {
      res.render('contactus', { title: 'Conference | Contact Us'});
    }
});
router.get('/theme', function(req, res, next){
  if(req.session.authStatus){
    MongoClient.connect(connString, function(err, db){
      if(err) throw err;
      var users = db.collection('users');
      users.find({'_id': req.session.email}).toArray(function(err, result){
        if(err) throw err;
        db.close();
        res.render('theme', {title: 'Conference | Theme', 'username': req.session.firstname, 'role':req.session.role, 'authStatus':'loggedIn'});
      })
    });
  }else{
    res.render('theme', {title:'Conference | Theme'});
  }
});

router.get('/schedule', function(req, res, next){
  if(req.session.authStatus){
    MongoClient.connect(connString, function(err, db){
      if(err) next(err);
      var users = db.collection('users');
      users.find({'_id': req.session.email}).toArray(function(err, result){
        if(err) next(err);
        db.close();
        res.render('schedule', {title:'Conference | Schedule', 'username': req.session.firstname, 'role': req.session.role, 'authStatus': 'loggedIn'});
      });
    });
  }else{
    res.render('Schedule', {title: 'Conference | Schedule'});
  }
});

router.get('/sponsors', function(req, res, next){
  if(req.session.authStatus){
    MongoClient.connect(connString, function(err, db){
      if(err) next(err);
      var users = db.collection('users');
      users.find({'_id': req.session.email}).toArray(function(err, result){
        if(err) next(err);
        db.close();
        res.render('sponsors', {title: 'Conference | Sponsors', 'username': req.session.firstname, 'role': req.session.role, 'authStatus': 'loggedIn'});
      });
    });
  }else{
    res.render('sponsors', {title: 'Conference | Sponsors'});
  }
});
//swift verification for writers and participant
router.get('/swift', function(req, res, next){
  if(req.session.role === 'writer' || req.session.role === 'Participant'){
    MongoClient.connect(connString, function(err, db){
      if(err) throw err;
      var users = db.collection('users');
      users.findOne({'_id':req.session.email}, function(err, result){
        if(err) throw err;
        db.close();
        if(result.swift){
          res.render('writer/swift', {title:'Conference | Verify Swift', 'username': req.session.firstname, 'swiftcode': result.swift.swiftcode, 'verified': result.swift.verified, 'role': req.session.role, 'authStatus': 'loggedIn'});
        }else{
          res.render('writer/swift', {title:'Conference | Verify Swift', 'username': req.session.firstname,  'role':req.session.role, 'authStatus': 'loggedIn'});
        }
    });
    });
  }else{
    next();
  }
});
router.post('/verifycode', function(req, res, next){
  if(req.body.swiftcode){
    MongoClient.connect(connString, function(err, db){
      if(err) throw err;
      var users = db.collection('users');
      users.findOne({'swift.code':req.body.swiftcode}, function(err, result){
        if(err) throw err;
        if(!result){
          users.updateOne({'_id': req.session.email},{"$set":{'swift':{'swiftcode':req.body.swiftcode, 'verified':false}}},
          {'upsert':true}, function(err, result){
            res.render('writer/swift', {title:'Conference | Verify Swift', 'username': req.session.firstname, 'role':req.session.role, 'authStatus': 'loggedIn', 'swiftcode':req.body.swiftcode, 'verified':false});
          });
        }else{
            res.render('writer/swift', {title:'Conference | Verify Swift', 'username': req.session.firstname, 'role':req.session.role, 'authStatus': 'loggedIn', 'swiftcode':result.swift.swiftcode, 'verified':result.swift.verified});
        }
      });
    })
  }else{
    next();
  }
});
module.exports = router;
