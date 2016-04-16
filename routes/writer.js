//email send module for node.js
var fs = require('fs');
var util = require('util');
var path = require('path');
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

//when the writer downloads his document
router.get('/download/:file', function(req, res, next){
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

/* GET users listing. */
router.get('/submit', function(req, res, next){
 if(req.session.authStatus && req.session.role === 'writer'){
  MongoClient.connect(connString, function(err, db){
  if(err) throw err;
  var users = db.collection('users');
  users.find({'_id': req.session.email}).toArray(function(err, result){
    if(err) throw err;
    var track = db.collection('track');
    track.find({}).toArray(function(err, tracks){
      db.close();
      res.render('writer/submit', {title : 'Conference | Submit','tracks':tracks, 'files':result[0].file, 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
    });
  });
 });
 } else{
  res.status(400).redirect('/submit');
 }
});
//upload submitted files
router.post('/upload', upload.fields([{name:'track', maxCount:1},{name:'submissiontype', maxCount:1}, {name:'title', maxCount:1},
{name:'abstract', maxCount:1}, {name:'keyword', maxCount:1}, {name:'file', maxCount:1}]), function(req, res, next){
  MongoClient.connect(connString, function(err, db){
    if(err) throw err;
    var users = db.collection('users');
    var file = {
      track: req.body.track,
      submissiontype:req.body.submissiontype,
      title: req.body.title,
      abstract: req.body.abstract,
      keyword: req.body.keyword,
      originalname: req.files.file[0].originalname,
      encoding: req.files.file[0].encoding,
      mimitype: req.files.file[0].mimetype,
      destination: req.files.file[0].destination,
      filename: req.files.file[0].filename,
      size: req.files.file[0].size,
      date: new Date()
    };
    users.updateOne({'_id': req.session.email, 'file.originalname': file.filename}, {'$push':{'file':file}},
    {'upsert':true}, function(err, result){
      db.close();
      console.log(util.inspect(req.file));
      res.redirect('submit');
    });
  });
});

module.exports = router;
