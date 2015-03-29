'use strict';
(function(root,factory) {
    if(typeof define === 'function' && define.amd) {
        define(factory);
    } else if(typeof 'exports' === 'object') {
        module.exports = factory;
    } else {
        root.uhttp = factory(root);
    }
})(this, function(root) {
    //Parse json responses
    var isObject = function(value) {return value !== null && typeof value === 'object';};

    var toString = Object.prototype.toString;
    var isFile = function(obj) {return toString.call(obj) === '[object File]';};
    var isBlob = function(obj) {return toString.call(obj) === '[object Blob]';};
    var isFormData = function(obj) {return toString.call(obj) === '[object FormData]'};

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

    //Global headers state, is overwritten by [, options]
    //The default Content Type is 'application/json'
    var headers = {
        global: {},
        common: {
            'Accept': 'application/json, text/plain, */*'
        },
        POST: {'Content-type': 'application/json;charset=utf-8'},
        PUT: {'Content-type': 'application/json;charset=utf-8'},
        PATCH: {'Content-Type': 'application/json;charset=utf-8'}
    };

    var setGlobalHeaders = function(headersObject) {
        headers.global = headersObject;
    };

    var addGlobalHeaders = function(key, value) {
        headers.global[key] = value;
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
        var methods = {
            'then': function() {},
            'catch': function() {},
            'success': function() {},
            'error': function() {}
        };
        var XHR = root.XMLHttpRequest || ActiveXObject;
        var request = new XHR('MSXML2.XMLHTTP.3.0');
        request.open(type, url, true);

        //Iterate across global and common headers, then if headers[type], add those headers too
        setXHRHeaders(request, headers.common);
        if(headers[type]) {
            setXHRHeaders(request, headers[type]);
        }
        setXHRHeaders(request, headers.global);
        if(isObject(options.headers)) {
            setXHRHeaders(options.headers);
        }

        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                var parsedRequest = parse(request);
                if (request.status >= 200 && request.status < 300) {
                    methods.then.call(methods, parsedRequest);
                    methods.success.call(methods, parsedRequest);
                } else {
                    methods['catch'].call(methods, parsedRequest);
                    methods.error.call(methods, parsedRequest);
                }
            }
        };
        request.send(transformRequest(data));
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

    exports.setGlobalHeaders = setGlobalHeaders;
    exports.addGlobalHeaders = addGlobalHeaders;

    exports['get'] = function(src, options) {
        return xhr('GET', src, options);
    };

    exports['put'] = function(src, options, data) {
        if(!data) {
            data = options;
            options = null;
        }
        return xhr('PUT', src, options, data);
    };

    exports['patch'] = function(src, options, data) {
        if(!data) {
            data = options;
            options = null;
        }
        return xhr('PATCH', src, options, data);
    };

    exports['post'] = function(src, options, data) {
        if(!data) {
            data = options;
            options = null;
        }
        return xhr('POST', src, options, data);
    };

    exports['delete'] = function(src, options) {
        return xhr('DELETE', src, options);
    };

    return exports;
});