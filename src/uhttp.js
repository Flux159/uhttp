/**
 * Client side uhttp
 */
(function(root,factory) {
    if(typeof define === 'function' && define.amd) {
        define(factory);
    } else if(typeof 'exports' === 'object') {
        module.exports = factory;
    } else {
        root.uhttp = factory(root);
    }
})(this, function() {

    'use strict';

    var thisWindow = window;

    /**
     * A basic cache that stores requests and responses. Supports timeouts as well
     * */
    function Cache(name, options) {
        this.name = name;
        this.data = {};
        if(!options) {options = {};}
        this.timeout = options.timeout || 0;
    }
    Cache.prototype.remove = function(key) {
        delete this.data[key];
    };
    Cache.prototype.clear = function() {
        this.data = {};
    };
    Cache.prototype.set = function(key, value, options) {
        this.data[key] = value;
        if(!options) {options = {};}
        if((options.timeout || this.timeout) > 0) {
            var cache = this;
            setTimeout(function() {
                cache.remove(key);
            }, (options.timeout || this.timeout));
        }
    };
    Cache.prototype.get = function(key) {
        return this.data[key];
    };

    /**
     * The public factory that allows users to create their own caches (useful for manually manipulating cached data)
     */
    var CacheFactory = (function() {
        var instance = null;
        function init() {
            var caches = {__default: new Cache('__default')};
            return {
                get: function(key, options) {
                    if(caches[key]) {
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
            getFactory: function() {
                if(!instance) {
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
    function isObject(value) {return value !== null && typeof value === 'object';}
    function isString(value) {return value !== null && typeof value === 'string';}

    var toString = Object.prototype.toString;
    function isFile(obj) {return toString.call(obj) === '[object File]';}
    function isBlob(obj) {return toString.call(obj) === '[object Blob]';}
    function isFormData(obj) {return toString.call(obj) === '[object FormData]';}

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
        if(isObject(d) && !isFile(d) && !isBlob(d) && !isFormData(d)) {
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
        } catch(e) {
            result = d;
        }
        return result;
    }

    /**
     * Check if url is same origin (see: https://github.com/angular/angular.js/blob/master/src/ng/urlUtils.js)
     * Used for XSRF Token handling
     */
    var urlParsingNode = document.createElement('a');

    function urlResolve(url) {
        var href = url;

        //documentMode is IE only property - (see: https://github.com/angular/angular.js/blob/master/src/Angular.js)
        var msie = document.documentMode;
        if (msie) {
            // Normalize before parse.  Refer Implementation Notes on why this is
            // done in two steps on IE.
            urlParsingNode.setAttribute('href', href);
            href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
            href: urlParsingNode.href,
            protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
            host: urlParsingNode.host,
            search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
            hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
            hostname: urlParsingNode.hostname,
            port: urlParsingNode.port,
            pathname: (urlParsingNode.pathname.charAt(0) === '/') ? urlParsingNode.pathname : '/' + urlParsingNode.pathname
        };
    }

    var originUrl = urlResolve(thisWindow.location.href);

    function urlIsSameOrigin(requestUrl) {
        var parsed = (isString(requestUrl)) ? urlResolve(requestUrl) : requestUrl;
        return (parsed.protocol === originUrl.protocol &&
        parsed.host === originUrl.host);
    }

    /**
     * A function to get a cookie from the browser. Used when passing the XSRF-Cookie
     * Obtained from here: http://www.w3schools.com/js/js_cookies.asp
     * @param cname
     * @returns {string}
     */
    function getCookie(cname) {
        if(cname) {
            var name = cname + '=';
            var ca = document.cookie.split(';');
            for(var i=0; i<ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) ===' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) === 0) {return c.substring(name.length,c.length);}
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
        if(exdays) {
            var d = new Date();
            d.setTime(d.getTime() + (exdays*24*60*60*1000));
            var expires = 'expires='+d.toUTCString();
            document.cookie = cname + '=' + cvalue + '; ' + expires;
        } else {
            document.cookie = cname + '=' + cvalue + '; ';
        }
    }

    /**
     * A function to delete a cookie from the browser
     */
    function deleteCookie( name ) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
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
        if(!globalOptions.headers || !isObject(globalOptions.headers)) {
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
        for(var h in addHeaders) {
            if(addHeaders.hasOwnProperty(h)) {
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
        for(var h in headerObject) {
            if(headerObject.hasOwnProperty(h)) {
                request.setRequestHeader(h, headerObject[h]);
            }
        }
    }

    /**
     * Handle jsonp requests. See https://github.com/angular/angular.js/blob/master/src/ng/httpBackend.js
     * Also see: https://github.com/lhorie/mithril.js/blob/next/mithril.js
     * Returns Promise
     * @param url - the jsonp url
     * @param [options] - options supported: {timeout: int}
     */
    function jsonp(url) {

        var methods = {
            then: function() {},
            'catch': function() {},
            'finally': function() {}
        };

        var callbacks = {
            then: function(callback) {
                methods.then = callback;
                return callbacks;
            },
            'catch': function(callback) {
                methods['catch'] = callback;
                return callbacks;
            },
            'finally': function(callback) {
                methods['finally'] = callback;
                return callback;
            }
        };

        //Creating a callback function and a script element
        var callbackId = 'uhttp_callback_' + new Date().getTime() + '_' + Math.round(Math.random() * 1e16).toString(36);
        var script = document.createElement('script');

        //Success callback
        thisWindow[callbackId] = function(res) {
            script.parentNode.removeChild(script);
            thisWindow[callbackId] = undefined;
            script = null; callbackId = null;
            methods.then.call(methods, res);
            methods['finally'].call(methods, res);
            methods = null;
        };

        //Error callback
        script.onerror = function(e) {
            script.parentNode.removeChild(script);
            thisWindow[callbackId] = undefined;
            script = null; callbackId = null;
            methods['catch'].call(methods, e);
            methods['finally'].call(methods, e);
            methods = null;
        };

        //Find JSON_CALLBACK in url & replace w/ callbackId function
        script.src = url.replace('JSON_CALLBACK', callbackId);

        //Appending the script element to the document
        document.body.appendChild(script);

        return callbacks;
    }

    /**
     * Constant for JSON content
     * @type {string}
     */
    var JSON_CONTENT_TYPE_HEADER = 'application/json;charset=utf-8';

    /**
     * XHR Request Handling - returns Promise
     * @param type
     * @param url
     * @param [options]
     * @param data
     */
    function xhr(type, url, options, data) {
        if(!options) {
            options = {};
        }

        var methods = {
            then: function() {},
            'catch': function() {},
            'finally': function() {}
        };

        var callbacks = {
            then: function(callback) {
                methods.then = callback;
                return callbacks;
            },
            'catch': function(callback) {
                methods['catch'] = callback;
                return callbacks;
            },
            'finally': function(callback) {
                methods['finally'] = callback;
                return callback;
            }
        };

        //Iterate headers and add to xhr
        //Order of precedence: Options, Global, Default
        var mergedHeaders = {};

        //Default headers set to reasonable defaults (cannot be modified by user - see globalOptions & options for mutable options)
        mergeHeaders(mergedHeaders, {'Accept': 'application/json, text/plain, */*'});
        if(type === 'POST' || type === 'PUT' || type === 'PATCH') {
            if(isObject(data) && !isFile(data) && !isBlob(data)) {
                if(!isFormData(data)) {
                    mergeHeaders(mergedHeaders, {'Content-Type': JSON_CONTENT_TYPE_HEADER});
                }
            }
        }

        mergeHeaders(mergedHeaders, globalOptions.headers);
        if(isObject(options.headers)) {
            mergeHeaders(mergedHeaders, options.headers);
        }

        //If same domain, set XSRF-Header to XSRF-Cookie
        if(urlIsSameOrigin(url)) {
            var xsrfHeader = {};
            var xsrfValue = getCookie((options.xsrfCookieName || globalOptions.xsrfCookieName || defaultOptions.xsrfCookieName));
            if(xsrfValue) {
                xsrfHeader[(options.xsrfHeaderName || globalOptions.xsrfHeaderName || defaultOptions.xsrfHeaderName)] = xsrfValue;
                mergeHeaders(mergedHeaders, xsrfHeader);
            }
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
        if(config.type === 'GET' && cache) {
            var parsedResponse;
            if(typeof cache === 'boolean') {
                parsedResponse = thisCacheFactory.get('__default').get(url);
            } else {
                if(cache.constructor.name === 'Cache') {
                    parsedResponse = cache.get(url);
                } else {
                    parsedResponse = cache.cache.get(url);
                }
            }
            if(parsedResponse) {
                //Need to have a timeout in order to return then go to callback. I think that setIntermediate is supposed to solve this problem
                //Note that apparently real promises have a similar issue
                setTimeout(function() {
                    methods.then.call(methods, parsedResponse);
                }, 1);
                return callbacks;
            }
        }

        //Create XHR request
        var XHR = thisWindow.XMLHttpRequest || ActiveXObject;
        var request = new XHR('MSXML2.XMLHTTP.3.0');

        //Set progress handler (must be done before calling request.open)
        if(config.options.progressHandler && request.upload) {
            request.upload.onprogress = config.options.progressHandler;
        }

        request.open(config.type, config.url, true);

        //Set headers (must be done after request.open)
        setXHRHeaders(request, config.headers);

        //Set withCredentials option
        if(config.options.withCredentials) {
            request.withCredentials = true;
        }

        //The event listener for when the xhr request changes state (readyState = 4 means completed - either successfully or w/ an error)
        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                config.options.transformResponse(request);
                var parsedResponse = config.options.transformResponseData(request);
                if ((request.status >= 200 && request.status < 300) || request.status === 304) {
                    if(type === 'GET' && cache) {
                        if(typeof cache === 'boolean') {
                            thisCacheFactory.get('__default').set(url, parsedResponse);
                        } else {
                            if(cache.constructor.name === 'Cache') {
                                cache.set(url, parsedResponse);
                            } else {
                                cache.cache.set(url, parsedResponse, cache.options);
                            }
                        }
                    }
                    methods.then.call(methods, parsedResponse, request.status, request);
                } else {
                    methods['catch'].call(methods, parsedResponse, request.status, request);
                }
                methods['finally'].call(methods, parsedResponse, request.status, request);
                config = null; methods = null; request = null; parsedResponse = null;
            }
        };

        //Send any data (only valid for POST, PUT, PATCH)
        request.send(config.options.transformRequestData(data));

        //Timeout handling (abort request after timeout time in milliseconds)
        if(config.options.timeout > 0) {
            setTimeout(function() {
                if(request) {
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

    //Export get/setCookie because they are helper functions used by uhttp and could be useful for a user
    exports.getCookie = getCookie;
    exports.setCookie = setCookie;
    exports.deleteCookie = deleteCookie;

    //Export actual ajax request methods
    exports.get = function(src, options) {
        return xhr('GET', src, options);
    };

    exports.head = function(src, options) {
        return xhr('HEAD', src, options);
    };

    exports.put = function(src, options, data) {
        if(!data) {
            data = options;
            options = null;
        }
        return xhr('PUT', src, options, data);
    };

    exports.patch = function(src, options, data) {
        if(!data) {
            data = options;
            options = null;
        }
        return xhr('PATCH', src, options, data);
    };

    exports.post = function(src, options, data) {
        if(!data) {
            data = options;
            options = null;
        }
        return xhr('POST', src, options, data);
    };

    exports['delete'] = function(src, options) {
        return xhr('DELETE', src, options);
    };

    //Jsonp method is unique from the rest (doesn't use xhr, creates a script element)
    exports.jsonp = function(src) {
        return jsonp(src);
    };

    return exports;
});