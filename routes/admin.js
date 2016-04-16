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

var MongoClient = require('mongodb').MongoClient;
var connString = 'mongodb://localhost:27017/conference';
var router = express.Router();

//assign track for track coordinator
router.get('/assigntrack', function(req, res, next){
  MongoClient.connect(connString, function(err, db){
    var track = db.collection('track');
    track.find({}).toArray(function(err, tracks){
      if(err) throw err;
      var users = db.collection('users');
      users.find({'role':'coordinator'}).toArray(function(err, users){
        if(err) throw err;
        db.close();
        if(req.session.authStatus && req.session.role === 'admin'){
          console.log(util.inspect(users));
          res.render('admin/assigntrack',{title: 'Conference | Assign Track', 'username':req.session.firstname,'coordinators':users, 'role':req.session.role, tracks:tracks, 'authStatus':'loggedIn'});
        }else{
          res.redirect('404');
        }
      })
    });
  });
});
//post back to change track to the coordinator
router.post('/trackchange', function(req, res, next){
  MongoClient.connect(connString, function(err, db){
    if(err) throw err;
    var track = db.collection('track');
    track.updateOne(
      {name:req.body.track},
      {
        $set: {coordinator: req.body.coordinator}
      },
      {$upsert: true}, function(err, result){
          if(err) throw err;
          db.close();
          res.redirect('assigntrack');
      });
  });
});

router.get('/userroles', function(req, res, next){
  MongoClient.connect(connString, function(err, db){
    var users = db.collection('users');
    users.find({},{'_id':1, 'username':1, 'role':1}).toArray(function(err, users){
      if(err) throw err;

      db.close();
      if(req.session.authStatus && req.session.role === 'admin'){
        res.render('admin/userroles', {title:'Conference | User Roles', 'username': req.session.firstname, 'users':users, 'role':req.session.role, 'authStatus': 'loggedIn'});
      }else{
        res.redirect('404');
      }
    });
  });
});

router.post('/rolechange', function(req, res, next){
  MongoClient.connect(connString, function(err, db){
    if(err) throw err;
    var users = db.collection('users');

    users.updateOne(
      {_id:req.body.id},
      {
        $set: {role: req.body.role}
      },
      {$upsert: true}, function(err, result){
      if(err) throw err;
      db.close();
      res.redirect('userroles');
    });
  });
});
//news about the conference
router.get('/newses', function(req, res, next){
  if(req.session.authStatus){
    res.render('newses', {title: 'Conference | news', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
  } else{
    res.render('newses', {title: 'Conference | news'});
  }
});

router.get('/news', function(req, res, next){
  if(req.session.authStatus){
    res.render('news', {title:'Conference | news', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
  } else{
    res.render('news', {title: 'Conference | news'});
  }
})
//news upload for an admin side of the website
router.get('/new_news', function(req, res, next){
  if(req.session.authStatus && req.session.role === 'admin'){
    res.render('admin/new_news', { title: 'Conference | new news', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
  } else {
    res.redirect('404');
  }
});

router.post('/news_upload',images.fields([{name:'title', maxCount:1}, {name:'content', maxCount:1}, {name:'file', maxCount:1}]),
  function(req, res, next){
    MongoClient.connect(connString, function(err, db){
      if(err) throw err;
      var news = db.collection('news');
      var file = {
        originalname: req.files.file[0].originalname,
        encoding: req.files.file[0].encoding,
        mimitype: req.files.file[0].mimetype,
        destination: req.files.file[0].destination,
        filename: req.files.file[0].filename,
        size: req.files.file[0].size
    };
    news.insert({'title':req.body.title, 'content':req.body.content, 'image':file}, function(err, result){
      if(err) throw err;

      db.close();
      console.log(util.inspect(req.file));
      res.redirect('newses');
      });
    });
});
//new track addeing get request
router.get('/new_track', function(req, res, next){
    if(req.session.authStatus && req.session.role === 'admin'){
      res.render('admin/new_track', {title:'Conference | new track', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
    } else{
      res.redirect('404');
    }
});
//new track addeing post request
router.post('/addtrack', function(req, res, next){
  MongoClient.connect(connString, function(err, db){
    if(err) throw err;
    var track = db.collection('track');
    track.insert({'name':req.body.name, 'description':req.body.description}, function(err, result){
      if(err) throw err;
      db.close();
      res.redirect('new_track');
    });
  });
});

module.exports = router;
