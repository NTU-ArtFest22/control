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
  , mongoose          =     require('mongoose')
  , crypto            =     require('crypto')
  , safety            =     require('./safety')
  , User              =     require('./models/user');

// connect to mongoDB database
mongoose.connect(DBconfig.url);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// TODO: why need this?
app.use(session({ secret: 'amy22627683', key: 'ntuaf'}));
app.use(passport.initialize());
app.use(passport.session());


 // Using the flash middleware provided by connect-flash to store messages in session
 // and displaying in templates
var flash = require('connect-flash');
app.use(flash());


// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);

// add first admin
User.findAndModify({'fb.id': '1247677651915123'},{"isAdmin": true}, function(err, doc ){
  if(err)
    console.log(err);
});

var routes = require('./routes/index')(passport);
app.use('/', routes);


require('./routes/data.js')( app );



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


