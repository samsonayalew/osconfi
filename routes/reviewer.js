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
/* GET users listing. */
router.get('/send', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
