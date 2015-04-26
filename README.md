# uhttp

A micro ajax library modeled after angularjs's $http module that doesn't require any dependencies (jquery or otherwise). As of version 1.1.0, uhttp runs in browsers as well as in nodejs.

uhttp is about 6kb minified and about 2.3kb minified and compressed.

uhttp supports setting headers globally for all requests and setting headers individually for each request. It also automatically parses json in responses with the appropriate content type. uhttp is based off of [atomic](https://github.com/toddmotto/atomic) and angularjs's [$http](https://github.com/angular/angular.js/blob/v1.3.x/src/ng/http.js). uhttp was written because atomic didn't support common features (setting headers & sending json POST requests) and [React](https://facebook.github.io/react/index.html) didn't come with a built in ajax library (recommending jQuery's ajax instead).

Note that uhttp does not use true [promises](https://github.com/jakearchibald/es6-promise).

#### Downloading & Setting up

###### Browser

Download the minified build [here](https://raw.githubusercontent.com/Flux159/uhttp/master/dist/uhttp.min.js), put into your public scripts directory, and add to your webpage by adding the following tag:

```html
<script type="application/javascript" src="/scripts/uhttp.min.js"></script>
```

Alternatively, you can install from bower as well:
```shell
bower install uhttp --save
```

###### Nodejs

To install with nodejs, run the following:
```shell
npm install uhttp --save
```

Use server side by requiring in your files:
```javascript
var uhttp = require('uhttp');
```

Note: You should not use the minified browser version of uhttp in nodejs (or vice versa). This is because while uhttp provides a common api for ajax/http requests, the implementations are different for nodejs and the browser (nodejs uses http.request while browsers use XMLHttpRequest - among other differences).

#### uhttp.get(url, [,options])
Use uhttp.get() to make a GET request. You can use "then... catch" callbacks to obtain the response.

```javascript
uhttp.get('/api/endpoint').then(function(res, status, xhr) {
    //Successful response
}).catch(function(err, status, xhr) {
    //Error
});

```

You can specify options by passing an options object to any request (see the Options section for more information):

```javascript
var options = {
    headers: {
        'custom': 'header'
    },
    withCredentials: true,
    timeout: 3000 //3 seconds; '0' for no timeout
};

uhttp.get('/api/endpoint', options).then(function(res, status, xhr) {
    //Success
}).catch(function(err, status, xhr) {
    //Error
});

```

#### uhttp.post(url, [,options] [,data])

Use uhttp.post() to make a POST request. By default, the content type for JSON and FormData (multipart/form-data NOT application/x-www-form-urlencoded) is automatically set for you. To change this, either set a global default for the "Content-Type" header, or pass it in as an option.

```javascript
uhttp.post('/api/endpoint/post', {some: 'data'}).then(function(res) {
    //Success
}).catch(function(err) {
    //Error
});
```

Example using FormData (Content-Type: multipart/form-data) in javascript:
```javascript
var formElement = document.getElementById("myform");
var formData = new FormData(formElement);
formData.append("username", "cat");
uhttp.post('/api/endpoint/post/form/multipart', formData).then(function(data) {
    //Success
}).catch(function(err) {
    //Error
});
```

##### Posting x-www-form-urlencoded data

Here is an example of posting x-www-form-urlencoded data. Note that if you want all requests sent with these options by default, use uhttp.setGlobalOptions (see documentation below).

```javascript
var data = {
    content: 'Sending json object as x-www-form-urlencoded'
};

var options = {
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    transformRequestData: function(data) {
        var str = [];
        for(var p in data) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(data[p]));
        }
        return str.join("&");
}};

uhttp.post('/api/endpoint/post/form/urlencoded', options, data).then(function(res) {
    //Success
}).catch(function(err) {
    //Error
});
```

Example setting a custom content type:
```javascript
var myCustomData = '<custom>xml</custom>';
uhttp.post('/api/endpoint/post', {headers: {'Content-Type': 'application/xml'}}, myCustomData).then(function(res, status, xhr) {
    //Success
}).catch(function(err, status, xhr) {
    //Error
});
```

#### uhttp.put()

Use uhttp.put() to make a PUT request. The options are similar to POST requests.

```javascript
uhttp.put('/api/endpoint/put', {some: 'data'}).then(function(res, status, xhr) {
    //Success
}).catch(function(err, status, xhr) {
    //Error
});
```

#### uhttp.patch()

Use uhttp.patch() to make a PATCH request.

```javascript
uhttp.patch('/api/endpoint/patch', {some: 'data'}).then(function(res, status, xhr) {
    //Success
}).catch(function(err, status, xhr) {
    //Error
});
```

#### uhttp.delete()

Use uhttp.delete() to send a DELETE request.

```javascript
uhttp.delete('/api/endpoint/delete').then(function(res, status, xhr) {
    //Success
}).catch(function(err, status, xhr) {
    //Error
});
```

#### uhttp.head()

Use uhttp.head() to send a HEAD request.

```javascript
uhttp.head('/api/endpoint/head').then(function(res, status, xhr) {
    //Success
    console.log(xhr.getHeader('Custom-Header'));
}).catch(function(err, status, xhr) {
    //Error
});
```

#### uhttp.jsonp()

Use uhttp.jsonp() to send a JSONP request. Note that you should define the callback as 'JSON_CALLBACK'. uhttp will generate a global function attached to the window object for the duration of the request and pass its data to the then/catch functions. Note that since [jsonp](http://en.wikipedia.org/wiki/JSONP) requests use a script element and not xhr, there is no status or xhr returned in the callback.

```javascript
uhttp.jsonp('/api/endpoint/jsonp?callback=JSON_CALLBACK').then(function(res) {
    //Success
}).catch(function(err) {
    //Error
});
```

#### Xsrf
uhttp handles setting an XSRF header for you based on the options xsrfCookieName and xsrfHeaderName options. The default options are cookieName = 'XSRF-TOKEN' and headerName = 'X-XSRF-TOKEN'. Note that uhttp takes the value of the cookie (not the name) and sets the header given by xsrfHeaderName to that value. To change these, specify the options before sending your requests:

```javascript
var globalOptions = {
    xsrfCookieName: 'CUSTOM-COOKIE-NAME',
    xsrfHeaderName: 'CUSTOM-HEADER-NAME'
};

uhttp.setGlobalOptions(globalOptions);

uhttp.get('/xsrf/endpoint').then(function(res) {
    //Success
}).catch(function(err) {
    //Error
});

```

#### Example: Sending a file
A common use case for POSTing data is to send a file to your server (like an image or video file). uhttp makes that easy by allowing you to specify a progress callback with your POST request. Note that this example uses Xhr2, which is not supported by IE8. Check [caniuse](http://caniuse.com/#feat=xhr2) for more information on browser compatibility. For a full example, see the example in /test/testupload.html. Note that this example will only work in browsers (nodejs does not support FormData objects, however, it may be possible to use [this](https://github.com/felixge/node-form-data) library - this has not been tested w/ uhttp however).

```javascript

var files = document.getElementById('upload-input-element').files;

var file = files[0];

var data = new FormData();
data.append('userfile', file);

var options = {
    progressHandler: function(event) {
        if(event.lengthComputable) {
            var percentageLoaded = event.loaded / event.total;
            document.findElementById('upload-progress-bar').setAttribute('style', 'width: ' + percentageLoaded + ';');
        }
    }
};

uhttp.post('/upload/endpoint', options, data).then(function(res) {
    //Success
}).catch(function(err) {
    //Error
});

```

#### Example: Authorization Tokens
If your requests require tokens, you can specify them as custom headers (also note that you can set these globally for all requests by calling uhttp.setGlobalOptions(globalOptions).

```javascript
var MY_TOKEN = 'CUSTOM_AUTH_TOKEN';
var options = {
    headers: {
        'Authorization': 'Bearer ' + MY_TOKEN
    }
};

uhttp.get('/protected/api/endpoint', options).then(function(res) {
    //Success
}).catch(function(err) {
    //Error
});
```

#### Example: CORS (Cross Origin Requests)

CORS is a way of sending requests to a different domain than the one you are currently browsing. CORS is enabled on a server by setting the appropriate headers on the server.

Server pseudo code:
```javascript
response.header('Access-Control-Allow-Origin', 'http://example.com');
response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
response.header('Access-Control-Allow-Headers', 'Content-Type');
response.header('Access-Control-Allow-Credentials', true);
```

Using uhttp, if the server has required credentials (by the 'Access-Control-Allow-Credentials' header), you would need to set the withCredentials option to correctly send your request. You would also need to set any authorization headers the server requires (tokens, etc.).

```javascript
var MY_TOKEN = 'CUSTOM_AUTH_TOKEN';
var options = {
    headers: {
        'Authorization': 'Bearer ' + MY_TOKEN
    },
    withCredentials: true
};

uhttp.get('http://subdomain.example.com/protected/api/endpoint', options).then(function(res) {
    //Success
}).catch(function(err) {
    //Error
});

```

#### Global Options

You can set global options by using the uhttp.setGlobalOptions(options) method. Note that "global" means on each page. If you are not using a single page web application architecture, you will need to set these options in a common script across all your pages. In a single page application architecture, this works as expected after setting once.

```javascript
uhttp.setGlobalOptions({
    headers: {
        'Custom': 'Global-Header'
    },
    timeout: 2000, //Set timeout to 2 seconds
    withCredentials: true, //Set withCredentials on xhr requests,
    transformRequest: function(config) {}, //Transform xhr config before sending (also before transformRequestData)
    transformResponse: function(xhr) {}, //Transform xhr after response (but before transformResponseData)
    transformRequestData: function(data) {return data;}, //Transform requests before sending
    transformResponseData: function(data) {return data;}, //Transform returned responses
    caching: true || [Cache object] || {cache: [Cache object], options: {timeout: 120000}}, //Set whether to globally cache all requests (not recommended - use individual request options instead)
    xsrfCookieName: String, //The name of the cookie where you store your xsrfToken
    xsrfHeaderName: String //The name of the header to set the xsrfToken
});
```

You can also retrieve the global default options by using the uhttp.getGlobalOptions() method

```javascript
var globalAjaxOptions = uhttp.getGlobalOptions();
console.log(globalAjaxOptions);
```

#### Options

The options object is the same as the globalOptions object above except it can be passed with each individual request.

###### Custom Headers

```javascript
var options = {
    headers: {
        'Custom': 'Header'
    }
};

uhttp.get('/api/endpoint', options).then(function(res) {
    //Success
}).catch(function(err) {
    //Error
});
```

###### Timeouts

```javascript
var options = {
    timeout: 2000 //Timeout of 2 seconds
};

uhttp.get('/api/endpoint', options).then(function(res) {
    //Success
}).catch(function(err) {
    //Error
});
```

#### Transforming Requests, Responses, and Data

uhttp lets you transform requests and responses before they're sent / after their returned (globally or per request). This is useful if you need to modify how uhttp processes its requests by default.

###### Transform Request (transformRequest) & Transform Response (transformResponse)

To modify the xhr object that uhttp uses before sending, set the transformRequest option.

```javascript
var options = {
    transformRequest: function(config) {
        //Changes the source of the request
        config.src = 'http://localhost:43760/api/get/again';

        return config;
    },
    transformResponse: function(xhr) {
        //Changes the response
        xhr.responseText = '{"data": "Man in the middle!"}';
    }
};

window.uhttp.get('http://localhost:43760/api/get', options).then(function(res) {
    console.log(res.data); //prints "Man in the middle!"
}).catch(function(err) {
    //Do nothing
}).finally(function() {
    done();
});
```

###### Transform Request Data (transformRequestData)

To modify the data that uhttp sends with the request, set the transformRequestData option. This is necessary if you're sending x-www-form-urlencoded data.

```javascript
var data = {
    content: 'Sending json object as x-www-form-urlencoded'
};

var options = {
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    transformRequestData: function(data) {
        var str = [];
        for(var p in data) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(data[p]));
        }
        return str.join("&");
}};

uhttp.post('/api/endpoint/post/form/urlencoded', options, data).then(function(res) {
    //Success
}).catch(function(err) {
    //Error
});
```

###### Transform Response Data (transformResponseData)

To modify the data that uhttp gets after getting a response, set the transformResponseData option.

```javascript
//This is the default transformResponseData that uhttp uses to parse JSON responses
var options = {
    transformResponseData: function(req) {
        var result;
        var d = req.responseText;
        try {
            result = JSON.parse(d);
        } catch(e) {
            result = d;
        }
        return result;
    }
}

window.uhttp.get('http://localhost:43760/api/get', options).then(function(res) {
    console.log(res.data);
}).catch(function(err) {
    //Do nothing
}).finally(function() {
    done();
});

```

###### Caching

uhttp provides a basic caching mechanism where you can cache your GET responses (no xhr request is sent). By default, setting the cache option to true enables this and uses uhttp's default cache. If you need a custom cache object, you can use uhttp's CacheFactory to create a custom cache object that you can manually clear and set timeouts for. Note: Caching only works for GET requests.

```javascript
uhttp.get('http://localhost:43760/api/get', {cache: true}).then(function(res, status, xhr) {
    //Sends xhr request
   uhttp.get('http://localhost:43760/api/get', {cache: true}).then(function(res, status, xhr) {
        //From javascript cache, no xhr request sent
   }).catch(function(err) {
        //Do nothing
   });
}).catch(function(err) {
    //Do nothing
});
```

Custom cache objects:

```javascript
var cacheFactory = uhttp.CacheFactory;
var blogCache = cacheFactory.get('blogCache');

blogCache.put('firstpost','My blog');
blogCache.put('secondpost', 'stuff');
blogCache.delete('firstpost');
blogCache.get('secondpost');
blogCache.clear();

//You can pass this cache to uhttp's cache option as well!
uhttp.get('http://localhost:43760/api/get', {cache: blogCache}).then(function(res, status, xhr) {
    //Data is cached in blogCache w/ url as key (you now have control of when to delete from the cache)
});

```

Note that passing uhttp a cache object will only cache get requests. This is because it isn't meaningful to cache POST, PUT, DELETE requests (read [this](http://stackoverflow.com/questions/626057/is-it-possible-to-cache-post-methods-in-http) for more information).

###### Cookies Helpers

uhttp exposes its cookie helper functions as uhttp.getCookie() and uhttp.setCookie(). These can be helpful if you need to check or change cookie values in your app.

```javascript
uhttp.setCookie('mycookie', 'yum'); //Sets mycookie to 'yum'
uhttp.setCookie('othercookie', 'yay!', 365); //Set cookie for 365 days
console.log(uhttp.getCookie('mycookie')); //'yum'
console.log(uhttp.getCookie('othercookie')); //'yay!'
```

#### Development, Testing, & Building

uhttp is developed using a nodejs environment and uses [grunt](http://gruntjs.com/getting-started) for running tests and building. Make sure that you have nodejs and npm installed, clone this source repository and run the following in the uhttp directory:

```
npm install && grunt build
```

That will install all dependencies for development, run uhttp's tests, and build a minified version of uhttp in the dist directory.

If you have bug fixes that you want merged into uhttp, submit a pull request on the github repository.

LICENSE
-----

The MIT License (MIT)

Copyright (c) 2015 Suyog Sonwalkar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
