
var express = require('express'),
    bodyParser = require('body-parser'),
    morgan = require('morgan');
    path = require('path');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(morgan('dev'));

app.route('/test/get').get(function(req, res) {
    return res.status(200).json({data: 'GET'});
});

app.route('/test/post').post(function(req, res) {
    if(req.is('application/json') && req.body.content === "Testing POST") {
        return res.status(200).json({data: "POST"});
    } else {
        return res.status(500).json("Internal Server Error");
    }
});

app.route('/test/post/form').post(function(req, res) {
    if(req.is('application/x-www-form-urlencoded') && req.body.content === "Testing POST form") {
        return res.status(200).json({data: "POST FORM"});
    } else {
        return res.status(500).json("Internal Server Error");
    }
});

app.route('/test/put').put(function(req, res) {
    if(req.is('application/json') && req.body.content === "Testing PUT") {
        return res.status(200).json({data: "PUT"});
    } else {
        return res.status(500).json("Internal Server Error");
    }
});

app.route('/test/patch').patch(function(req, res) {
    if(req.is('application/json') && req.body.content === "Testing PATCH") {
        return res.status(200).json({data: "PATCH"});
    } else {
        return res.status(500).json("Internal Server Error");
    }
});

app.route('/test/delete').delete(function(req, res) {
    return res.status(200).json({data: 'DELETE'});
});

app.route('/test/head').head(function(req, res) {
    //Set custom header to check that HEAD responses work correctly
    res.set('Custom-Header', 'HEAD');
    res.status(200).end();
});

app.use(express.static(path.join(__dirname, '../..')));

var port = process.env.PORT || 43760;

app.listen(port, 'localhost');
console.log("Server started on port " + port);

module.exports = {url: 'http://localhost:' + port + "/"};
