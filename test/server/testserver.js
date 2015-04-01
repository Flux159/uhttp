
var express = require('express'),
    bodyParser = require('body-parser'),
    multipart = require('connect-multiparty'),
    morgan = require('morgan'),
    path = require('path');

var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(multipart());
app.use(morgan('dev'));

app.route('/api/get').get(function(req, res) {
    return res.status(200).json({data: 'GET'});
});

app.route('/api/get/again').get(function(req, res) {
    return res.status(200).json({data: 'GET AGAIN'});
});

app.route('/api/post').post(function(req, res) {
    if(req.is('application/json') && req.body.content === "Testing POST") {
        return res.status(200).json({data: "POST"});
    } else {
        return res.status(500).json("Internal Server Error");
    }
});

app.route('/api/post/form').post(function(req, res) {
    if(req.is('multipart/form-data') && req.body.content === "Testing POST form") {
        return res.status(200).json({data: "POST FORM"});
    } else {
        return res.status(500).json("Internal Server Error");
    }
});

app.route('/api/post/urlform').post(function(req, res) {
    if(req.is('application/x-www-form-urlencoded') && req.body.content === "Testing POST form urlencoded") {
        return res.status(200).json({data: "POST FORM URLENCODED"});
    } else {
        return res.status(500).json("Internal Server Error");
    }
});

app.route('/api/put').put(function(req, res) {
    if(req.is('application/json') && req.body.content === "Testing PUT") {
        return res.status(200).json({data: "PUT"});
    } else {
        return res.status(500).json("Internal Server Error");
    }
});

app.route('/api/patch').patch(function(req, res) {
    if(req.is('application/json') && req.body.content === "Testing PATCH") {
        return res.status(200).json({data: "PATCH"});
    } else {
        return res.status(500).json("Internal Server Error");
    }
});

app.route('/api/delete').delete(function(req, res) {
    return res.status(200).json({data: 'DELETE'});
});

app.route('/api/head').head(function(req, res) {
    //Set custom header to check that HEAD responses work correctly
    res.set('Custom-Header', 'HEAD');
    res.status(200).end();
});

app.route('/api/jsonp').get(function(req, res) {
    res.status(200).jsonp({data: 'JSONP'});
});

app.route('/api/timeout').get(function(req, res) {
    setTimeout(function() {
        res.status(200).json({data: 'timein'});
    }, 500);
});

app.route('/api/xsrf').get(function(req, res) {
    if(req.headers['x-xsrf-token'] === 'MY_XSRF_TOKEN') {
        return res.status(200).json({data: "Correct xsrf token"});
    } else {
        return res.status(500).json("Internal Server Error");
    }
});

app.route('/api/post/image').post(function(req, res) {
    //Uses multipart/form-data & gets an image, saves it locally somewhere, then deletes it

    //console.log(req.files);

    return res.status(200).end();
});

app.use(express.static(path.join(__dirname, '../..')));

var port = process.env.PORT || 43760;

app.listen(port, 'localhost');
console.log("Server started on port " + port);

app2 = express();
app2.route('/api/cors').get(function(req, res) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:43760');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).json({data: "CORS"});
});

app2.route('/api/cors/fail').get(function(req, res) {
    res.status(200).json({data: "CORS_FAIL"});
});

var port2 = process.env.PORT2 || 43761;

app2.listen(port2, 'localhost');
console.log("CORS Test server started on port " + port2);

module.exports = {url: 'http://localhost:' + port + "/"};
