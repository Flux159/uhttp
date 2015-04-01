
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

app.route('/api/post').post(function(req, res) {
    if(req.is('application/json') && req.body.content === "Testing POST") {
        return res.status(200).json({data: "POST"});
    } else {
        return res.status(500).json("Internal Server Error");
    }
});

app.route('/api/post/form').post(function(req, res) {

    console.log(req.headers);
    console.log(req.body);

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

app.use(express.static(path.join(__dirname, '../..')));

var port = process.env.PORT || 43760;

app.listen(port, 'localhost');
console.log("Server started on port " + port);

module.exports = {url: 'http://localhost:' + port + "/"};
