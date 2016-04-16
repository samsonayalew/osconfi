//email send module for node.js
var fs = require('fs');
var util = require('util');
var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var multer = require('multer');
var path = require('path');
var nodemailer = require('nodemailer');
var upload = multer({ dest: 'uploads/' });
var images = multer({dest: 'news_images/'});

var MongoClient = require('mongodb').MongoClient;
var connString = 'mongodb://localhost:27017/conference';
var router = express.Router();

var transporter = nodemailer.createTransport({
  host: "213.55.83.211",
  auth: {
    user: "conference@smuc.edu.et",
    pass: "12345aA"
    }
});
/* GET users listing. */

router.get('/downloadpaper', function(req, res, next){
  MongoClient.connect(connString, function(err, db){
    var users = db.collection('users');
    users.find({}).toArray(function(err, users){
      if(err) throw err;

      var arrWriter = users.filter(function(user){
        return (user.role === 'writer');
      });

      var arrReviewer = users.filter(function(user){
        return (user.role === 'reviewer');
      });
      var track = db.collection('track');
      track.find({coordinator: req.session.email}).toArray(function(err, track){
        if(err) throw err;
        if(req.session.authStatus && req.session.role === 'coordinator'){
          db.close();
          res.render('coordinator/downloadpaper', { title: 'Conference | download paper','track':track[0], 'reviewers':arrReviewer, 'writers': arrWriter,'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
        } else {
          res.redirect('404');
        }
    });
  });
  });
});

router.get('/papers/:file', function(req, res, next){
  MongoClient.connect(connString, function(err, db){
    if(err) throw err;
    var users = db.collection('users');
    if(req.params.file){
      var doc = req.params.file;
      users.find({'file.originalname': doc}, {'file.$':1}).toArray(function(err, doc){
        //  var path = path.resolve(__dirname + '../uploads/' + doc[0].file[0].filename);
         //
        //  res.attachment(path);
        if(doc[0].file[0].filename){
          //res.attachment(path.resolve('./uploads/' + doc[0].file[0].filename));
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader("Content-Disposition", "attachment");
          res.download(path.resolve('./uploads/' + doc[0].file[0].filename), doc[0].file[0].originalname);
       }else{
         res.status(400).redirect('/submit');
       }
      });
    }else{
      res.status(400).redirect('/submit');
    }
  });
});

router.get('/swiftverify', function(req, res, next){
  MongoClient.connect(connString, function(err, db){
    if(err) throw err;
    var users = db.collection('users');
    users.find({}).toArray(function(err, users){
      if(users.length > 0){
        if(req.session.role === 'coordinator'){
          var users = users.map(function(item, index){
            if(item.swift)
            return {'email':item._id, 'firstname':item.firstname, 'middlename':item.middlename, 'swiftcode':item.swift.swiftcode, 'verified':item.swift.verified};
          });
          res.render('coordinator/swiftverify', {title: 'Conference | verify swift code','users': users, 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
          }
        }else{
        next();
        }
    });
  });
});

router.post('/verifyswiftcode', function(req, res, next){
  MongoClient.connect(connString, function(err, db){
    if(err) throw err;
    var users = db.collection('users');
    users.find({'swift.swiftcode':new RegExp(req.body.search, 'i')}).toArray(function(err, users){
      if(users.length > 0){
        var users = users.map(function(item, index){
          if(item.swift)
          return {'email':item._id, 'firstname':item.firstname, 'middlename':item.middlename, 'swiftcode':item.swift.swiftcode, 'verified':item.swift.verified};
        });
        res.json(users);
      }else{
        next();
      }
    });
  });
});

router.post('/emailNotification', function(req, res, next){
  mailOptions={
    from: 'conference@smuc.edu.et', //sender address
    to : req.body.email,
    subject : "Swift Verification",
    html : "Your swift code is <span style='color'>Verified</span>, Thanks for registering."
    //text: req.body.text, // plaintext body
  };
  transporter.sendMail(mailOptions, function(err, response){
    if(err){
      next(err);
    }else{
      console.log("Message sent: " + response.message);
      res.redirect('/swiftverify');
    }
  });
});
module.exports = router;
