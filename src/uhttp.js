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

    var Cache = function(name, options) {
        this.name = name;
        this.data = {};
        if(!options) {options = {};}
        this.timeout = options.timeout || 0;
    };
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

    var CacheFactory = function() {
        this.caches = {__default: new Cache('__default')};
    };
    CacheFactory.prototype.get = function(key, options) {
        if(this.caches[key]) {
            return this.caches[key];
        } else {
            var newCache = new Cache(key, options);
            this.caches[key] = newCache;
            return newCache;
        }
    };

    var JSON_CONTENT_TYPE_HEADER = 'application/json;charset=utf-8';
    var FORM_DATA_CONTENT_TYPE_HEADER = 'application/x-www-form-urlencoded';

    //Parse json responses
    var isObject = function(value) {return value !== null && typeof value === 'object';};
    var isString = function(value) {return value !== null && typeof value === 'string';};

    var toString = Object.prototype.toString;
    var isFile = function(obj) {return toString.call(obj) === '[object File]';};
    var isBlob = function(obj) {return toString.call(obj) === '[object Blob]';};
    var isFormData = function(obj) {return toString.call(obj) === '[object FormData]';};

    //Default transforming of requests and responses (can be overrided by setting defaultOptions)
    var transformRequest = function(d) {
        if(isObject(d) && !isFile(d) && !isBlob(d) && !isFormData(d)) {
            return JSON.stringify(d);
        } else {
            return d;
        }
    };

    var parse = function(req) {
        var result;
        var d = req.responseText;
        try {
            result = JSON.parse(d);
        } catch(e) {
            result = d;
        }
        return result;
    };

    //Check if url is same origin (see: https://github.com/angular/angular.js/blob/master/src/ng/urlUtils.js)
    //Used for XSRF Token handling
    var urlParsingNode = document.createElement('a');

    var urlResolve = function(url) {
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
    };

    var originUrl = urlResolve(window.location.href);

    var urlIsSameOrigin = function(requestUrl) {
        var parsed = (isString(requestUrl)) ? urlResolve(requestUrl) : requestUrl;
        return (parsed.protocol === originUrl.protocol &&
        parsed.host === originUrl.host);
    };

    //Default headers state, is overwritten by globalOptions.headers and by [, options] in each request
    //The default Content Type is 'application/json' not 'application/x-www-form-urlencoded'
    var defaultHeaders = {
        common: {
            'Accept': 'application/json, text/plain, */*'
        },
        POST: {'Content-type': JSON_CONTENT_TYPE_HEADER},
        PUT: {'Content-type': JSON_CONTENT_TYPE_HEADER},
        PATCH: {'Content-Type': JSON_CONTENT_TYPE_HEADER}
    };

    var defaultOptions = {
        transformRequest: transformRequest,
        transformResponse: parse,
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN'
    };

    var globalOptions = {
        headers: {},
        timeout: 0,
        withCredentials: false
    };

    var setGlobalOptions = function(optionsObject) {
        globalOptions = optionsObject;
        if(!globalOptions.headers || !isObject(globalOptions.headers)) {
            globalOptions.headers = {};
        }
    };

    var getGlobalOptions = function() {
        return globalOptions;
    };

    var mergeHeaders = function(mergedHeaders, addHeaders) {
        for(var h in addHeaders) {
            if(addHeaders.hasOwnProperty(h)) {
                mergedHeaders[h] = addHeaders[h];
            }
        }
    };

    //Taken from here: http://www.w3schools.com/js/js_cookies.asp
    var getCookie = function(cname) {
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
    };

    var setXHRHeaders = function(request, headerObject) {
        for(var h in headerObject) {
            if(headerObject.hasOwnProperty(h)) {
                request.setRequestHeader(h, headerObject[h]);
            }
        }
    };

    //XHR Request Handling
    var xhr = function(type, url, options, data) {

        if(!options) {
            options = {};
        }

        var cache = options.cache || globalOptions.cache;
        if(type === 'GET' && cache) {
            if(typeof cache === 'boolean') {
                CacheFactory.get('__default').get(url);
            } else {
                if(Object.prototype.toString.call(cache) === '[object Cache]') {
                    cache.get(url);
                } else {
                    cache.cache.get(url);
                }
            }
        }

        var methods = {
            'then': function() {},
            'catch': function() {},
            'success': function() {},
            'error': function() {}
        };
        var XHR = root.XMLHttpRequest || ActiveXObject;
        var request = new XHR('MSXML2.XMLHTTP.3.0');
        request.open(type, url, true);

        //Iterate headers and add to xhr
        //Order of presidence: Options, Global, Default
        var mergedHeaders = {};

        //Default headers set to reasonable defaults (cannot be modified by user - see globalOptions & options for mutable options)
        mergeHeaders(mergedHeaders, defaultHeaders.common);
        if(defaultHeaders[type]) {
            if(isObject(data) && !isFile(data) && !isBlob(data)) {
                if(!isFormData(data)) {
                    mergeHeaders(mergedHeaders, defaultHeaders[type]);
                } else {
                    mergeHeaders(mergedHeaders, {'Content-Type': FORM_DATA_CONTENT_TYPE_HEADER});
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
            var xsrfValue = getCookie((options.xsrfCookieName || globalOptions.xsrfHeaderName || defaultOptions.xsrfCookieName));
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

        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                var parsedResponse = (options.transformResponse || globalOptions.transformResponse || defaultOptions.transformResponse)(request);
                if (request.status >= 200 && request.status < 300) {
                    if(type === 'GET' && cache) {
                        if(typeof cache === 'boolean') {
                            CacheFactory.get('__default').set(url, parsedResponse);
                        } else {
                            if(Object.prototype.toString.call(cache) === '[object Cache]') {
                                cache.set(url, parsedResponse);
                            } else {
                                cache.cache.set(url, parsedResponse, cache.options);
                            }
                        }
                    }
                    methods.then.call(methods, parsedResponse);
                    methods.success.call(methods, parsedResponse);
                } else {
                    methods['catch'].call(methods, parsedResponse);
                    methods.error.call(methods, parsedResponse);
                }
            }
        };

        request.send((options.transformRequest || globalOptions.transformRequest || defaultOptions.transformRequest)(data));

        //Timeout handling
        var timeout = globalOptions.timeout;
        if(options.timeout !== null && options.timeout !== undefined) {
            timeout = options.timeout;
        }
        if(timeout > 0) {
            setTimeout(function() {
                if(request) {request.abort();}
            }, timeout);
        }

        var callbacks = {
            success: function(callback) {
                methods.success = callback;
                return callbacks;
            },
            error: function(callback) {
                methods.error = callback;
                return callbacks;
            },
            then: function(callback) {
                methods.then = callback;
                return callbacks;
            },
            'catch': function(callback) {
                methods['catch'] = callback;
                return callbacks;
            }
        };

        return callbacks;
    };

    var exports = {};

    exports.setGlobalOptions = setGlobalOptions;
    exports.getGlobalOptions = getGlobalOptions;
    exports.CacheFactory = CacheFactory;

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

    exports.delete = function(src, options) {
        return xhr('DELETE', src, options);
    };

    exports.jsonp = function(src, options) {
        return xhr('JSONP', src, options);
    };

    return exports;
});