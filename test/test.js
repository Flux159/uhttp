var assert, testserver;

//Some differences in setup between running in nodejs vs running in a browser. You run the same tests by running grunt testbrowser.
var isNode = (typeof window !== 'object');
var testSetup;
if(isNode) {
    assert = require('assert');

    testserver = require('./server/testserver');
    var path = require('path');

    var jsdom = require('jsdom');

    testSetup = function(callback) {
        jsdom.env({
            html: '<html><body></body></html>',
            scripts: [
                path.join(__dirname, '../src/uhttp.js')
            ],
            features: {
                FetchExternalResources: ["script"],
                ProcessExternalResources: ["script"]
            },
            done: callback
        });
    };
} else {
    testSetup = function(callback) {
        callback(null, window);
    };
}

describe('uhttp', function() {

    describe('GET', function() {

        it('Should send a GET request correctly', function(done) {
            testSetup(function(errors, window) {
                window.uhttp.get('http://localhost:43760/api/get').then(function(res) {
                    assert.equal(res.data, "GET");
                    done();
                }).catch(function(err) {
                    //Do nothing
                });
            });
        });

        it('Should catch a 404 error correctly with a GET request', function(done) {
            testSetup(function(errors, window) {
                window.uhttp.get('http://localhost:43760/api/get404').then(function(res) {
                    //Do nothing
                }).catch(function(err) {
                    assert(err);
                    done();
                });
            });
        });

    });

    describe('POST', function() {

        it('Should send a POST request with JSON data correctly', function(done) {
            testSetup(function(errors, window) {
                window.uhttp.post('http://localhost:43760/api/post', {content: 'Testing POST'}).then(function(res) {
                    assert(res.data, "POST");
                    done();
                }).catch(function(err) {
                    console.log(err);
                    done();
                });
            });
        });

        it('Should send a POST request with manually setting headers correctly', function(done) {
            testSetup(function(errors, window) {
                window.uhttp.post('http://localhost:43760/api/post', {headers: {'Content-Type': "application/json"}}, {content: 'Testing POST'}).then(function(res) {
                    assert(res.data, "POST");
                    done();
                }).catch(function(err) {
                    console.log(err);
                    done();
                });
            });
        });

        it('Should send a POST request with FormData data correctly (multipart)', function(done) {
            if(isNode) {
                done(); //jsdom doesn't support FormData, test in browser
            } else {
                testSetup(function(errors, window) {

                    var formData = new FormData();
                    formData.append('content', 'Testing POST form');

                    window.uhttp.post('http://localhost:43760/api/post/form', formData).then(function(res) {
                        assert(res.data, "POST FORM");
                        done();
                    });
                });
            }
        });

        it('Should send a POST request with form data correctly (urlencoded)', function(done) {
            testSetup(function(errors, window) {
                var data = {
                    content: 'Testing POST form urlencoded'
                };
                var options = {
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    transformRequest: function(data) {
                        var str = [];
                        for(var p in data) {
                            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(data[p]));
                        }
                        return str.join("&");
                    }
                };
                window.uhttp.post('http://localhost:43760/api/post/urlform', options, data).then(function(res) {
                    assert(res.data, "POST FORM URLENCODED");
                    done();
                });
            });
        });

        it('Should catch a 500 error with a POST request (ex: invalid data)', function(done) {
            testSetup(function(errors, window) {
                window.uhttp.post('http://localhost:43760/api/post', {content: 'Bad Content'}).then(function(res) {
                    console.log("Should not get here");
                    assert(!res);
                }).catch(function(err) {
                    assert(err);
                    done();
                });
            });
        });

    });

    describe('PUT', function() {

        it('Should send a PUT request with JSON data correctly', function(done) {
            testSetup(function(errors, window) {
                window.uhttp.put('http://localhost:43760/api/put', {content: 'Testing PUT'}).then(function(res) {
                    assert(res.data, "PUT");
                    done();
                }).catch(function(err) {
                    //Do nothing
                });
            });
        });

    });

    describe('DELETE', function() {

        it('Should send a DELETE request correctly', function(done) {
            testSetup(function(errors, window) {
                window.uhttp.delete('http://localhost:43760/api/delete').then(function(res) {
                    assert(res.data, "DELETE");
                    done();
                }).catch(function(err) {
                    //Do nothing
                });
            });
        });

    });

    describe('PATCH', function() {

        it('Should send a PATCH request with JSON data correctly', function(done) {
            testSetup(function(errors, window) {
                window.uhttp.patch('http://localhost:43760/api/patch', {content: 'Testing PATCH'}).then(function(res) {
                    assert(res.data, "PATCH");
                    done();
                }).catch(function(err) {
                    //Do nothing
                });
            });
        });

    });

    describe('HEAD', function() {

        it('Should send a HEAD request correctly', function(done) {
            testSetup(function(errors, window) {
                window.uhttp.head('http://localhost:43760/api/head').then(function(res, status, xhr) {
                    assert.equal(xhr.getResponseHeader('Custom-Header'), "HEAD");
                    done();
                }).catch(function(err) {
                    //Do nothing
                });
            });
        });

    });

    describe('JSONP', function() {

        it('Should send a JSONP request correctly', function(done) {
            done();
        });

    });

    describe('Global Options', function() {
        it('Should set global options across multiple requests', function(done) {
            done();
        });
    });

    describe('Timeouts', function() {

        it('Should handle timeouts correctly', function(done) {
            done();
        });

    });

    describe('Caching', function() {

        it('Should cache GET requests correctly', function(done) {
            done();
        });

    });

    describe('XSRF', function() {

        it('Should send the correct XSRF Cookie', function(done) {
            done();
        });

    });

    describe('CORS', function() {

        it('Should send CORS requests correctly when CORS is enabled on server', function(done) {
            done();
        });

        it('Should return an error when CORS requests are not allowed from this client', function(done) {
            done();
        });

    });


});
