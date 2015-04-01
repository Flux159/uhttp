(function(root,factory) {
    if(typeof define === 'function' && define.amd) {
        define(factory);
    } else if(typeof 'exports' === 'object') {
        module.exports = factory;
    } else {
        root.uhttp = factory(root);
    }
})(this, function(root) {

    'use strict';

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
        if(options.timeout || this.timeout > 0) {
            setTimeout(this.remove(key), options.timeout || this.timeout);
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
     * Default transforming of requests and responses (can be overrided by setting globalOptions)
     */
    function transformRequest(xhr) {
        return xhr;
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

    var originUrl = urlResolve(window.location.href);

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
    }

    /**
     * A function to set a cookie from the browser.
     * Obtained from here: http://www.w3schools.com/js/js_cookies.asp
     * @param cname
     * @param cvalue
     * @param exdays
     */
    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = 'expires='+d.toUTCString();
        document.cookie = cname + '=' + cvalue + '; ' + expires;
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

        var callbackId = 'uhttp_callback_' + new Date().getTime() + '_' + Math.round(Math.random() * 1e16).toString(36);
        var script = document.createElement('script');

        window[callbackId] = function(res) {
            script.parentNode.removeChild(script);
            window[callbackId] = undefined;
            methods.then.call(methods, res);
            methods.finally.call(methods, res);
        };

        script.onerror = function(e) {
            script.parentNode.removeChild(script);
            window[callbackId] = undefined;
            methods.catch.call(methods, e);
            methods.finally.call(methods, e);
        };

        //Find JSON_CALLBACK in url & replace w/ callbackId function
        script.src = url.replace('JSON_CALLBACK', callbackId);

        //Create script, run async, & call callback when complete
        document.body.appendChild(script);

        return callbacks;
    }

    /**
     * Constants for JSON content and FormData content
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

        var cache = options.cache || globalOptions.cache;
        if(type === 'GET' && cache) {
            var parsedResponse;
            if(typeof cache === 'boolean') {
                parsedResponse = thisCacheFactory.get('__default').get(url);
            } else {
                if(toString.call(cache) === '[object Cache]') {
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

        var timeout = globalOptions.timeout;
        if(options.timeout !== null && options.timeout !== undefined) {
            timeout = options.timeout;
        }

        var XHR = root.XMLHttpRequest || ActiveXObject;
        var request = new XHR('MSXML2.XMLHTTP.3.0');
        request.open(type, url, true);

        //Iterate headers and add to xhr
        //Order of presidence: Options, Global, Default
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

        setXHRHeaders(request, mergedHeaders);

        //Set withCredentials option
        if(options.withCredentials || globalOptions.withCredentials) {
            request.withCredentials = true;
        }

        //Set progress handler
        var progressHandler = (options.progressHandler || globalOptions.progressHandler);
        if(progressHandler && request.upload) {
            request.upload.addEventListener('progress', progressHandler, false);
        }

        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                (options.transformResponse || globalOptions.transformResponse || defaultOptions.transformResponse)(request);
                var parsedResponse = (options.transformResponseData || globalOptions.transformResponseData || defaultOptions.transformResponseData)(request);
                if ((request.status >= 200 && request.status < 300) || request.status === 304) {
                    if(type === 'GET' && cache) {
                        if(typeof cache === 'boolean') {
                            thisCacheFactory.get('__default').set(url, parsedResponse);
                        } else {
                            if(Object.prototype.toString.call(cache) === '[object Cache]') {
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
            }
        };

        (options.transformRequest || globalOptions.transformRequest || defaultOptions.transformRequest)(request);
        request.send((options.transformRequestData || globalOptions.transformRequestData || defaultOptions.transformRequestData)(data));

        //Timeout handling

        if(timeout > 0) {
            setTimeout(function() {
                if(request) {
                    request.abort();
                }
            }, timeout);
        }

        return callbacks;
    }

    /**
     * Exporting public functions to user
     */
    var exports = {};

    exports.setGlobalOptions = setGlobalOptions;
    exports.getGlobalOptions = getGlobalOptions;

    exports.CacheFactory = thisCacheFactory;

    exports.getCookie = getCookie;
    exports.setCookie = setCookie;

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

    exports.jsonp = function(src, options) {
        return jsonp(src, options);
    };

    return exports;
});