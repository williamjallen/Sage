"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var redis = require('redis');
var pg = require('pg');
var login_1 = __importDefault(require("./controllers/login"));
var register_1 = __importDefault(require("./controllers/register"));
var getSession_1 = __importDefault(require("./controllers/getSession"));
var destroySession_1 = __importDefault(require("./controllers/destroySession"));
var createDashboard_1 = __importDefault(require("./controllers/createDashboard"));
var deleteDashboard_1 = __importDefault(require("./controllers/deleteDashboard"));
var getDashboard_1 = __importDefault(require("./controllers/getDashboard"));
var getDashboards_1 = __importDefault(require("./controllers/getDashboards"));
var getData_1 = __importDefault(require("./controllers/getData"));
var getUser_1 = __importDefault(require("./controllers/getUser"));
var auth = require('../auth.json');
var conString = "postgres://" + auth.username + ":" + auth.password + "@localhost:5432/sage";
var client = new pg.Client(conString);
client.connect();
var RedisStore = require('connect-redis')(session);
var redisClient = redis.createClient();
var redisIO = redis.createClient();
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server, {
    cors: {
        origin: '*'
    }
});
var port = 3500;
var socket_1 = require("./socket");
io.on('connection', socket_1.handleConnection);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Note: cookie must have attribute { secure: true }
// in production
app.use(session({
    secret: 'rpi1824',
    resave: true,
    name: 'sage_session',
    saveUninitialized: true,
    cookie: {},
    store: new RedisStore({ client: redisClient })
}));
app.post('/api/login', function (req, res) {
    login_1.default(req, res, client);
});
app.post('/api/register', function (req, res) {
    register_1.default(req, res, client);
});
app.post('/api/createDashboard', function (req, res) {
    createDashboard_1.default(req, res, client, redisClient);
});
app.post('/api/deleteDashboard', function (req, res) {
    deleteDashboard_1.default(req, res, client, redisClient);
});
app.get('/api/getUser', function (req, res) {
    getUser_1.default(req, res, client);
});
app.get('/api/getSession', getSession_1.default);
app.get('/api/destroySession', destroySession_1.default);
app.get('/api/getDashboards', function (req, res) {
    getDashboards_1.default(req, res, client);
});
app.get('/api/getDashboard', function (req, res) {
    getDashboard_1.default(req, res, client, redisClient);
});
app.get('/api/getData', function (req, res) {
    getData_1.default(req, res, redisClient);
});
redisIO.on("message", function (channel, message) {
    switch (channel) {
        case "pushData":
            socket_1.pushData(message, io);
            break;
        default:
    }
});
redisIO.subscribe("pushData");
server.listen(port, function () {
    console.log("Listening at port " + port);
});
