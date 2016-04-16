var express = require('express');
var favicon = require('serve-favicon');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var compression = require('compression');
var MongoStore = require('connect-mongo')(session);

var routes = require('./routes/index');
var writer = require('./routes/writer')
var reviewer = require('./routes/reviewer');
var coordinator = require('./routes/coordinator');
var admin = require('./routes/admin');

var app = express();
app.use(compression());
app.use(favicon(__dirname + '/public/images/favicon.ico'));
// view engine setup
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(cookieParser());
app.use(session({
  resave: false,
  secret:'iVm5WIXT38zufI6QXWW4ZiBRevs9aXr9',
  store: new MongoStore({
    url:'mongodb://localhost/conference'
  }),
  cookie:{
    // path: '/', // cookie will only be sent to requests under '/api'
    maxAge: 60000, // duration of the cookie in milliseconds, defaults to duration above
    expires:Date.now() + 3600000
    // ephemeral: false, // when true, cookie expires when the browser closes
    // httpOnly: true,
    // secure: false
  }
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public', { maxAge: 86400000 }));//maxAge is one day

app.use('/', routes);
app.use('/', writer);
app.use('/', reviewer);
app.use('/', coordinator);
app.use('/', admin);

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });
app.use(function(req, res) {
     //res.send('404: Page not Found', 404);
     if(req.session.role){
        res.render('404error', { title: 'Conference | 404', 'username': req.session.firstname, 'role': req.session.role, 'authStatus':'loggedIn'});
      }else{
        res.render('404error',{ title: 'Conference | 404'});
      }
  });
// error handlers

// development error handler
// will print stacktrace

// if (app.get('env') === 'development') {
//     app.use(function(err, req, res, next) {
//         res.status(err.status || 500);
//         res.render('error', {
//             message: err.message,
//             error: err
//         });
//     });
// }

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
