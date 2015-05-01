/**
 * Server side uhttp (exposes same api as client side uhttp)
 */

'use strict';

//Used for parsing urls into correct format required by http.request
var http = require('http');
var url = require('url');

//Only used for jsonp
var vm = require('vm');

/**
 * A basic cache that stores requests and responses. Supports timeouts as well
 * */
function Cache(name, options) {
    this.name = name;
    this.data = {};
    if (!options) {
        options = {};
    }
    this.timeout = options.timeout || 0;
}
Cache.prototype.remove = function (key) {
    delete this.data[key];
};
Cache.prototype.clear = function () {
    this.data = {};
};
Cache.prototype.set = function (key, value, options) {
    this.data[key] = value;
    if (!options) {
        options = {};
    }
    if ((options.timeout || this.timeout) > 0) {
        var cache = this;
        setTimeout(function () {
            cache.remove(key);
        }, (options.timeout || this.timeout));
    }
};
Cache.prototype.get = function (key) {
    return this.data[key];
};

/**
 * The public factory that allows users to create their own caches (useful for manually manipulating cached data)
 */
var CacheFactory = (function () {
    var instance = null;

    function init() {
        var caches = {__default: new Cache('__default')};
        return {
            get: function (key, options) {
                if (caches[key]) {
                    return caches[key];
                } else {
                    var newCache = new Cache(key, options);
                    caches[key] = newCache;
                    return newCache;
                }
            }
        };
    }

    return {
        getFactory: function () {
            if (!instance) {
                instance = init();
            }
            return instance;
        }
    };
})();
var thisCacheFactory = CacheFactory.getFactory();

/**
 * Helper functions to determine request/response type
 */
//Parse json responses
function isObject(value) {
    return value !== null && typeof value === 'object';
}
function isString(value) {
    return value !== null && typeof value === 'string';
}

var toString = Object.prototype.toString;
function isFile(obj) {
    return toString.call(obj) === '[object File]';
}
function isBlob(obj) {
    return toString.call(obj) === '[object Blob]';
}
function isFormData(obj) {
    return toString.call(obj) === '[object FormData]';
}

/**
 * Default transforming of requests and responses (can be overrided by setting individual request options or uhttp globalOptions)
 */
function transformRequest(config) {
    return config;
}

function transformResponse(xhr) {
    return xhr;
}

function transformRequestData(d) {
    if (isObject(d) && !isFile(d) && !isBlob(d) && !isFormData(d)) {
        return JSON.stringify(d);
    } else {
        return d;
    }
}

function transformResponseData(req) {
    var result;
    var d = req.responseText;
    try {
        result = JSON.parse(d);
    } catch (e) {
        result = d;
    }
    return result;
}

//Fake document variable for cookie API
//TODO: This would have to be per domain to satisfy a browser's full api (use url hostname?)
//TODO: Would also need to deal with subdomains & how cookies for a domain can be used across all subdomains
//TODO: Implement legitimate deleteCookie function
var document = {cookie: ''};

/**
 * A function to get a cookie from the browser. Used when passing the XSRF-Cookie
 * Obtained from here: http://www.w3schools.com/js/js_cookies.asp
 * @param cname
 * @returns {string}
 */
function getCookie(cname) {
    if (cname) {
        var name = cname + '=';
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return '';
    } else {
        return document.cookie;
    }
}

/**
 * A function to set a cookie from the browser.
 * Obtained from here: http://www.w3schools.com/js/js_cookies.asp
 * @param cname
 * @param cvalue
 * @param exdays
 */
function setCookie(cname, cvalue, exdays) {
    if (exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = 'expires=' + d.toUTCString();
        document.cookie = document.cookie.concat(cname + '=' + cvalue + '; ' + expires + ';');
    } else {
        document.cookie = document.cookie.concat(cname + '=' + cvalue + '; ');
    }
}

function setCookieFromString(cookieString) {
    document.cookie = cookieString;
}

/**
 * A function to delete a cookie from uhttp's fake document.cookie string
 */
function deleteCookie(name) {
    document.cookie = '';
    //document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

/**
 * Default options
 */
var defaultOptions = {
    transformRequest: transformRequest,
    transformResponse: transformResponse,
    transformRequestData: transformRequestData,
    transformResponseData: transformResponseData,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN'
};

/**
 * Getters and Setters for global uhttp options (overwrites default options, can be overwritten by passing [,options] to individual requests
 */
var globalOptions = {
    headers: {},
    timeout: 0,
    withCredentials: false
};

function setGlobalOptions(optionsObject) {
    globalOptions = optionsObject;
    if (!globalOptions.headers || !isObject(globalOptions.headers)) {
        globalOptions.headers = {};
    }
}

function getGlobalOptions() {
    return globalOptions;
}

/**
 * A function to merge header objects together (into a single dictionary that will be passed to setXHRHeaders)
 */
function mergeHeaders(mergedHeaders, addHeaders) {
    for (var h in addHeaders) {
        if (addHeaders.hasOwnProperty(h)) {
            mergedHeaders[h] = addHeaders[h];
        }
    }
}

/**
 * A function to set headers on a xhr request object
 * @param request
 * @param headerObject
 */
function setXHRHeaders(request, headerObject) {
    for (var h in headerObject) {
        if (headerObject.hasOwnProperty(h)) {
            request.setRequestHeader(h, headerObject[h]);
        }
    }
}

function createHttpRequestOptions(config) {
    var parsedUrl = url.parse(config.url);
    return {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.path,
        method: config.type,
        headers: config.headers
    };
}

function convertHeadersObjectToString(headers) {
    var str = '';
    Object.keys(headers).forEach(function (key) {
        str = str + key + ': ' + headers[key] + '\n';
    });
    return str;
}

function transformIntoFakeXHR(request, config, res, data) {
    return {
        type: config.type,
        url: config.url,
        status: res.statusCode,
        responseText: data,
        headers: res.headers,
        getAllResponseHeaders: function () {
            return convertHeadersObjectToString(res.headers);
        },
        getResponseHeader: function (str) {
            //Apparently headers are case insensitive: https://github.com/joyent/node/issues/1954
            //http://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html
            if (this.headers[str]) {
                return this.headers[str];
            } else {
                return this.headers[str.toLowerCase()];
            }
        }
    };
}

function jsonp(requesturl) {
    //On node, we just want to use a get request and call the callback correctly

    var methods = {
        then: function () {
        },
        'catch': function () {
        },
        'finally': function () {
        }
    };

    var callbacks = {
        then: function (callback) {
            methods.then = callback;
            return callbacks;
        },
        'catch': function (callback) {
            methods['catch'] = callback;
            return callbacks;
        },
        'finally': function (callback) {
            methods['finally'] = callback;
            return callback;
        }
    };

    var defaultHeaders = {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'uhttp'
        //'Connection': 'keep-alive'
    };

    var parsedUrl = url.parse(requesturl);
    var httpRequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.path,
        method: 'get',
        headers: defaultHeaders
    };

    var request = http.request(httpRequestOptions, function (res) {

        res.setEncoding('utf8');
        res.on('data', function (data) {

            //jsonp still assumes that your callback function is called JSON_CALLBACK
            //This creates a sandboxed environment for the callback to be run in

            var sandbox = vm.createContext({
                JSON_CALLBACK: function (res) {
                    return res;
                }
            });

            var parsedResponse = vm.runInContext(data, sandbox);

            methods.then.call(methods, parsedResponse);
            methods['finally'].call(methods, parsedResponse);

            methods = null;
            res = null;
        });
    });

    request.on('error', function (e) {
        //console.log('problem with request: ' + e.message);

        methods['catch'].call(methods, e);
        methods['finally'].call(methods, e);
        methods = null;
    });

    request.end();

    return callbacks;
}

/**
 * Constant for JSON content
 * @type {string}
 */
var JSON_CONTENT_TYPE_HEADER = 'application/json;charset=utf-8';

function xhr(type, url, options, data) {
    if (!options) {
        options = {};
    }

    var methods = {
        then: function () {
        },
        'catch': function () {
        },
        'finally': function () {
        }
    };

    var callbacks = {
        then: function (callback) {
            methods.then = callback;
            return callbacks;
        },
        'catch': function (callback) {
            methods['catch'] = callback;
            return callbacks;
        },
        'finally': function (callback) {
            methods['finally'] = callback;
            return callback;
        }
    };

    var mergedHeaders = {};

    //Default headers set to reasonable defaults (cannot be modified by user - see globalOptions & options for mutable options)

    var defaultHeaders = {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'uhttp',
        //'Cookie': document.cookie,
        'Connection': 'keep-alive'
    };

    mergeHeaders(mergedHeaders, defaultHeaders);
    if (type === 'POST' || type === 'PUT' || type === 'PATCH') {
        if (isObject(data) && !isFile(data) && !isBlob(data)) {
            if (!isFormData(data)) {
                mergeHeaders(mergedHeaders, {'Content-Type': JSON_CONTENT_TYPE_HEADER});
            }
        }
    }

    mergeHeaders(mergedHeaders, globalOptions.headers);
    if (isObject(options.headers)) {
        mergeHeaders(mergedHeaders, options.headers);
    }

    //Merge options together: Order of precedence is same as headers: Options, Global, Default
    var mergedOptions = {
        timeout: (options.timeout || globalOptions.timeout),
        cache: (options.cache || globalOptions.cache),
        withCredentials: (options.withCredentials || globalOptions.withCredentials),
        progressHandler: (options.progressHandler || globalOptions.progressHandler),
        transformRequest: (options.transformRequest || globalOptions.transformRequest || defaultOptions.transformRequest),
        transformResponse: (options.transformResponse || globalOptions.transformResponse || defaultOptions.transformResponse),
        transformRequestData: (options.transformRequestData || globalOptions.transformRequestData || defaultOptions.transformRequestData),
        transformResponseData: (options.transformResponseData || globalOptions.transformResponseData || defaultOptions.transformResponseData)
    };

    //A config object that can be modified by the user via a transformRequest function (globally or per request)
    //Note that no xhr request has been created yet
    var config = {
        headers: mergedHeaders,
        options: mergedOptions,
        type: type,
        url: url
    };

    mergedOptions.transformRequest(config);

    var cache = config.options.cache;
    if (config.type === 'GET' && cache) {
        var parsedResponse;
        if (typeof cache === 'boolean') {
            parsedResponse = thisCacheFactory.get('__default').get(url);
        } else {
            if (cache.constructor.name === 'Cache') {
                parsedResponse = cache.get(url);
            } else {
                parsedResponse = cache.cache.get(url);
            }
        }
        if (parsedResponse) {
            //Need to have a timeout in order to return then go to callback. I think that setIntermediate is supposed to solve this problem
            //Note that apparently real promises have a similar issue
            setTimeout(function () {
                methods.then.call(methods, parsedResponse);
            }, 0);
            return callbacks;
        }
    }

    //Create http.request options from config
    var httpRequestOptions = createHttpRequestOptions(config);

    //Create http.request
    var request = http.request(httpRequestOptions, function (res) {
        //HEAD requests will never return 'data'
        if (config.type === 'HEAD') {
            var transformedResponse = transformIntoFakeXHR(request, config, res, null);

            transformedResponse = config.options.transformResponse(transformedResponse);
            var parsedResponse = config.options.transformResponseData(transformedResponse);

            if ((transformedResponse.status >= 200 && transformedResponse.status < 300) || transformedResponse.status === 304) {
                methods.then.call(methods, parsedResponse, transformedResponse.status, transformedResponse);
            } else {
                methods['catch'].call(methods, parsedResponse, transformedResponse.status, transformedResponse);
            }
            methods['finally'].call(methods, parsedResponse, transformedResponse.status, transformedResponse);
            request = null;
            transformedResponse = null;
            parsedResponse = null;
            methods = null;
            return;
        }

        //TODO: Fix up how cookies are set & sent
        //TODO: What about XSRF-TOKENS? How are those supposed to be handled?
        //TODO: uhttp is also not dealing with how to handle multiple domain cookies

        //TODO: For Set-Cookie header, you need to set your cookies for this domain or for all subdomains of this domain (like *.domain.com) - (use httpRequestOptions.hostname)

        res.setEncoding('utf8');

        var str = '';
        res.on('data', function(chunk) {
            str += chunk;
        });

        res.on('end', function () {
            var transformedResponse = transformIntoFakeXHR(request, config, res, str);

            config.options.transformResponse(transformedResponse);

            var parsedResponse = config.options.transformResponseData(transformedResponse);
            if ((transformedResponse.status >= 200 && transformedResponse.status < 300) || transformedResponse.status === 304) {
                if (type === 'GET' && cache) {
                    if (typeof cache === 'boolean') {
                        thisCacheFactory.get('__default').set(url, parsedResponse);
                    } else {
                        if (cache.constructor.name === 'Cache') {
                            cache.set(url, parsedResponse);
                        } else {
                            cache.cache.set(url, parsedResponse, cache.options);
                        }
                    }
                }
                methods.then.call(methods, parsedResponse, transformedResponse.status, transformedResponse);
            } else {
                methods['catch'].call(methods, parsedResponse, transformedResponse.status, transformedResponse);
            }
            methods['finally'].call(methods, parsedResponse, transformedResponse.status, transformedResponse);
            request = null;
            transformedResponse = null;
            parsedResponse = null;
            methods = null;
        });
    });

    request.on('error', function (e) {
        methods['catch'].call(methods, e);
        methods['finally'].call(methods, e);
        methods = null;
    });

    if (data) {
        request.write(config.options.transformRequestData(data));
    }
    request.end();

    //Timeout handling (abort request after timeout time in milliseconds)
    if (config.options.timeout > 0) {
        setTimeout(function () {
            if (request) {
                request.abort();
            }
        }, config.options.timeout);
    }

    return callbacks;
}

/**
 * Exporting public functions to user
 */
var exports = {};

//Getter/Setter for Global options (across all uhttp requests on a single page)
exports.setGlobalOptions = setGlobalOptions;
exports.getGlobalOptions = getGlobalOptions;

//Export CacheFactory to allow user more control over caches
exports.CacheFactory = thisCacheFactory;

//Export get/setCookie because they are helper functions used by uhttp and could be useful for a user - these obviously make no sense server side, but this is to keep API compatibility (a fake document.cookie variable has been initialized to an empty string at the top of this file)
//TODO: Cookies are not handled properly by uhttp-server. Will be fixed in v2.0.0
//For now, manually set your cookies header
exports.getCookie = getCookie;
exports.setCookie = setCookie;
exports.setCookieFromString = setCookieFromString;
exports.deleteCookie = deleteCookie;

//Export actual ajax request methods
exports.get = function (src, options) {
    return xhr('GET', src, options);
};

exports.head = function (src, options) {
    return xhr('HEAD', src, options);
};

exports.put = function (src, options, data) {
    if (!data) {
        data = options;
        options = null;
    }
    return xhr('PUT', src, options, data);
};

exports.patch = function (src, options, data) {
    if (!data) {
        data = options;
        options = null;
    }
    return xhr('PATCH', src, options, data);
};

exports.post = function (src, options, data) {
    if (!data) {
        data = options;
        options = null;
    }
    return xhr('POST', src, options, data);
};

exports['delete'] = function (src, options) {
    return xhr('DELETE', src, options);
};

//Jsonp method is unique from the rest (doesn't use xhr, creates a script element)
exports.jsonp = function (src, options) {
    return jsonp(src, options); //This is just a GET request in nodejs
};

module.exports = exports;
