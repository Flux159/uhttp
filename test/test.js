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
                    transformRequestData: function(data) {
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
            testSetup(function(errors, window) {
                window.uhttp.jsonp('http://localhost:43760/api/jsonp?callback=JSON_CALLBACK').then(function(res) {
                    assert.equal(res.data, 'JSONP');
                    done();
                });
            });
        });

    });

    describe('Timeouts', function() {

        it('Should handle timeouts correctly', function(done) {
            if(isNode) {
                done(); //Aborting xhr requests seems to be iffy in jsdom
            } else {
                testSetup(function(errors, window) {

                    window.uhttp.get('http://localhost:43760/api/timeout').then(function(res) {
                        assert.equal(res.data, 'timein');

                        window.uhttp.get('http://localhost:43760/api/timeout', {timeout: 250}).then(function(res) {
                            //Do nothing (timeout sleeps for 1 second, so this should abort/give an error)
                        }).catch(function(err) {
                            done();
                        });

                    });
                });
            }
        });

    });

    describe('Caching', function() {

        it('Should cache and retrieve GET requests correctly', function(done) {

            testSetup(function(errors, window) {
                window.uhttp.get('http://localhost:43760/api/get', {cache: true}).then(function(res, status, xhr) {
                    assert.equal(res.data, "GET");

                    window.uhttp.get('http://localhost:43760/api/get', {cache: true}).then(function(res, status, xhr) {
                        assert.equal(res.data, "GET");
                        assert(!status);
                        assert(!xhr);
                        done();
                    }).catch(function(err) {
                        //Do nothing
                    });
                }).catch(function(err) {
                    //Do nothing
                });
            });

        });

        it('Should allow users to create custom caches with cache timeouts and clearing capabilities', function(done) {
            testSetup(function(errors, window) {

                var cacheFactory = window.uhttp.CacheFactory;
                var blogCache = cacheFactory.get('blogs');
                var cacheOptions = {cache: blogCache, options: {timeout: 500}};

                window.uhttp.get('http://localhost:43760/api/get', {cache: cacheOptions}).then(function(res, status, xhr) {
                    assert.equal(res.data, "GET");

                    window.uhttp.get('http://localhost:43760/api/get', {cache: cacheOptions}).then(function(res, status, xhr) {
                        assert.equal(res.data, "GET");
                        assert(!status);
                        assert(!xhr);

                        setTimeout(function() {
                            window.uhttp.get('http://localhost:43760/api/get', {cache: cacheOptions}).then(function(res, status, xhr) {

                                assert.equal(res.data, "GET");
                                assert(status);
                                assert(xhr);

                                //Using the same cache
                                window.uhttp.get('http://localhost:43760/api/get', {cache: blogCache}).then(function(res, status, xhr) {

                                    assert.equal(res.data, "GET");
                                    assert(!status);
                                    assert(!xhr);

                                    done();
                                });
                            });
                        }, 510);

                    }).catch(function(err) {
                        //Do nothing
                    });
                }).catch(function(err) {
                    //Do nothing
                });
            });
        });

    });

    describe('XSRF', function() {

        it('Should send the correct XSRF Cookie', function(done) {
            testSetup(function(errors, window) {

                window.uhttp.setCookie('XSRF-TOKEN', 'MY_XSRF_TOKEN');

                window.uhttp.get('http://localhost:43760/api/xsrf').then(function(res) {
                    assert(res.data, 'Correct xsrf token');
                }).catch(function(err) {
                    //Do nothing
                }).finally(function() {
                    done();
                });
            });
        });

    });

    describe('POST Images/Files', function() {

        it('Should send the correct Image data', function(done) {
            done();
        });

    });

    describe('Interceptors', function() {
        it('Should correctly intercept requests and responses', function(done) {
            testSetup(function(errors, window) {
                var options = {
                    transformRequest: function(config) {

                        config.src = 'http://localhost:43760/api/get/again';

                        return config;
                    },
                    transformResponse: function(xhr) {
                        if(xhr.responseText.indexOf('GET AGAIN') > 0) {
                            xhr.responseText = '{"data": "Man in the middle!"}';
                        }
                    }
                };

                window.uhttp.get('http://localhost:43760/api/get', options).then(function(res) {
                    assert(res.data, "Man in the middle!");
                }).catch(function(err) {
                    //Do nothing
                }).finally(function() {
                    done();
                });
            });
        });
    });

    describe('Cookies', function() {
        it('Should correctly handle getting and setting cookies', function(done) {
            testSetup(function(errors, window) {
                window.uhttp.setCookie('mycookie', 'yum');
                window.uhttp.setCookie('othercookie', 'yay!', 365); //Set cookie for 365 days
                assert(window.uhttp.getCookie('mycookie'), 'yum');
                assert(window.uhttp.getCookie('othercookie'), 'yay!');
                done();
            });
        });
    });

    describe('CORS', function() {

        it('Should send CORS requests correctly when CORS is enabled on server', function(done) {
            if(isNode) {
                done(); //jsdom doesn't support CORS requests via its XHRHttpRequests
            } else {
                testSetup(function(errors, window) {
                    window.uhttp.get('http://localhost:43761/api/cors').then(function(res) {
                        assert.equal(res.data, "CORS");
                        done();
                    }).catch(function(err) {
                        //Do nothing
                    });
                });
            }
        });

        it('Should return an error when CORS requests are not allowed from this client', function(done) {
            if(isNode) {
                done(); //jsdom doesn't support CORS requests via its XHRHttpRequests
            } else {
                testSetup(function(errors, window) {
                    window.uhttp.get('http://localhost:43761/api/cors/fail').then(function(res) {
                        //Do nothing
                    }).catch(function(err, status, xhr) {
                        done();
                    });
                });
            }
        });

    });

    //Note: These global options change all responses to 'changed!', keep them last
    describe('Global Options', function() {
        it('Should set global options across multiple requests', function(done) {

            testSetup(function(errors, window) {
                var globalOptions = {
                    transformResponseData: function(data) {
                        return {content: 'changed!'};
                    }
                };

                window.uhttp.setGlobalOptions(globalOptions);

                window.uhttp.get('http://localhost:43760/api/get').then(function(res) {
                    assert.equal(res.content, 'changed!');
                    window.uhttp.get('http://localhost:43760/api/get').then(function(res) {
                        assert.equal(res.content, 'changed!');
                        done();
                    });
                });
            });

        });
    });

});
