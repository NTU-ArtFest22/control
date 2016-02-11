var express           =     require('express')
  , passport          =     require('passport')
  , util              =     require('util')
  , FacebookStrategy  =     require('passport-facebook').Strategy
  , session           =     require('express-session')
  , cookieParser      =     require('cookie-parser')
  , bodyParser        =     require('body-parser')
  , config            =     require('./config/config')
  , logger            =     require('morgan')
  , path              =     require('path')
  , favicon           =     require('serve-favicon')
  , app               =     express()
  , DBconfig          =     require('./config/db')
  , mongoose          =     require('mongoose');

// connect to mongoDB database
mongoose.connect(DBconfig.url);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// TODO: why need this?
app.use(session({ secret: 'amy22627683', key: 'ntuaf'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));


 // Using the flash middleware provided by connect-flash to store messages in session
 // and displaying in templates
var flash = require('connect-flash');
app.use(flash());


// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);


var routes = require('./routes/index')(passport);
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

//=========  error handlers  ===========

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

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
