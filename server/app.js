// dependencies
var http = require('http')
  , path = require('path') 
  , express = require('express')
  , connect = require('express/node_modules/connect') 
  , app = express()
  , server = http.createServer(app)
  , routes = require('./routes')
  , sio = require('socket.io')
  , ssio = require('session.socket.io')
  , cookieParser = express.cookieParser('123qweasd')
  , sessionStore = new connect.middleware.session.MemoryStore();

var db = {
    users : {}
};

// server configuration
app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(cookieParser);
    app.use(express.session({
        store : sessionStore
    }));
    app.use(function(req, res, next) {
        req.db = db;
        next();
    });
    app.use(app.router);
    app.use(require('stylus').middleware(__dirname + '/public'));
    app.use(express.static(path.join(__dirname, 'public')));
});
app.configure('development', function() {
    app.use(express.errorHandler());
});

// routing
app.get('/', routes.index);
app.post('/', routes.devnull);
app.post('/login/:name', routes.login);
app.post('/logout/', routes.logout);
app.get('/info/', routes.info);

// start express
server.listen(app.get('port'), function() {
    console.log("Express server listening on port " + app.get('port'));
});

// start socket.io
var sessionSockets = new ssio(sio.listen(server), sessionStore, cookieParser);

// socket.io handler
var connected = {};

sessionSockets.on('connection', function(err, socket, session) {
    if(session == undefined || session.name == undefined) {
        socket.disconnect();
        return;
    }
    
    console.log('connect');
    
    db.users[session.name].socket = socket;

    socket.on('disconnect', function(data, callback) {
        console.log('disconnect');
    });
});
