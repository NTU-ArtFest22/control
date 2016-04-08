var express           =     require('express')
  , passport          =     require('passport')
  , mongoose          =     require('mongoose')
  , util              =     require('util')
  , FacebookStrategy  =     require('passport-facebook').Strategy
  , session           =     require('express-session')
  , cookieParser      =     require('cookie-parser')
  , bodyParser        =     require('body-parser')
  , config            =     require('./config/config')
  , DBconfig          =     require('./config/db')
  ,	streams           =     require('./socket/streams.js')() // get streams info
  , logger            =     require('morgan')
  , path              =     require('path')
  , favicon           =     require('serve-favicon')
  , app               =     express()
  , mongojs           =     require('mongojs')
  , crypto            =     require('crypto')
  ,	methodOverride    =     require('method-override')
  ,	errorHandler      =     require('errorhandler')
  , db                =     mongojs(DBconfig.url, [ 'users' , 'activities'])
  , port              =     normalizePort(process.env.PORT || '443')
  , debug             =     require('debug')('passport-mongo')
  , https              =     require('https')
  , fs                =     require('fs')
  , http              =     require('http');
  //, connectMongo      =     require('connect-mongo')
  //, sessionMiddle     =     session({
                                //name: 'control',
                                ////store: new (require("connect-mongo")(session))({ url: DBconfig.url }),
                                //secret: 'oh my goddddd'
                            //});

  // For redirect to https
  // set up a route to redirect http to https
  http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
  }).listen(80);

  mongoose.connect(DBconfig.url);
  //https 
  var options = {
    key: fs.readFileSync('./file.key'),
    cert: fs.readFileSync('./1_ntuaf.ddns.net_bundle.crt'),
    passphrase: ''
  };

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  app.set('port', port);
  app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(cookieParser());
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(methodOverride());
  // TODO: why need this?
  //app.use(sessionMiddle);
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

  var routes = require('./routes/index')(passport, streams);
  app.use('/', routes);


  require('./routes/data.js')( app , db );


  app.get('/stream/trial', function(req, res){
    res.render('stream-talk', { user: req.user , username: 'UserName', share: 'Share! -> '});
  })

  app.get('/stream/:id', function(req, res){
    console.log('                         stream: id', req.params.id);
    res.render('stream-talk', { user: req.user, id: req.params.id , username: 'Username'});
  })


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
    app.use(errorHandler());
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

  var server = https.createServer(options, app);
  var io = require('socket.io').listen(server);

  //io.use(function(socket, next){
    //// Wrap the express middleware
    //sessionMiddle(socket.request, {}, next);
  //})

  server.listen( port, function(){
    console.log("server listening on port", port);
  });

  server.on('error', onError);
  server.on('listening', onListening);

  /**
   * Socket.io event handling
   */
  require('./socket/socketHandler.js')(io, streams);



  /*********
   * some functions from bin/www
   */


  function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) { // named pipe
      return val;
    }
    if (port >= 0) { // port number
      return port;
    }
    return false;
  }

/**
 * Event listener for HTTP server "error" event.
 */

  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

      // handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
        case 'EADDRINUSE':
          console.error(bind + ' is already in use');
        process.exit(1);
        break;
        default:
          throw error;
      }
  }

/**
 * Event listener for HTTP server "listening" event.
 */

  function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
      debug('Listening on ' + bind);
  }

