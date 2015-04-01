# uhttp

A micro client-side ajax library modelled after angularjs's $http module that doesn't require any dependencies (jquery or otherwise). 

uhttp is about 4kb minified and about 2kb minified and compressed.

uhttp supports setting headers globally for all requests and setting headers individually for each request. It also automatically parses json in responses with the appropriate content type. uhttp is based off of [atomic](https://github.com/toddmotto/atomic) and angularjs's [$http](https://github.com/angular/angular.js/blob/v1.3.x/src/ng/http.js). uhttp was written because atomic didn't support common features (setting headers & sending json POST requests) and [React](https://facebook.github.io/react/index.html) didn't come with a built in ajax library (recommending jQuery instead).

Note that uhttp does not use true [promises](https://github.com/jakearchibald/es6-promise). However, uhttp-promises does use promises from es6-promise-shim. It is recommended that you use uhttp-promises for your production needs.

uhttp-promises is also a 4kb library, but uses an es6-promises shim (~2.5kb) to work correctly across browsers.

#### uhttp.get(url, [,options])
Use uhttp.get() to make a GET request. You can use either "then... catch" callbacks to obtain the response.

```javascript
uhttp.get('/api/endpoint').then(function(res, status, xhr) {
    //Successful response
}).catch(function(err, status, xhr) {
    //Error
});

```

The options supported are headers, the [with credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS#Requests_with_credentials) flag, and a timeout:

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

#### http.post(url, [,options] [,data])

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
    transformRequest: function(data) {
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
uhttp.post('/api/endpoint/post', {'Content-Type': 'application/xml'}, myCustomData).then(function(res, status, xhr) {
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
}).catch(function(err, status, xhr) {
    //Error
});
```

#### uhttp.jsonp()

Use uhttp.jsonp() to send a JSONP request. Note that you should define the callback as 'JSON_CALLBACK'. uhttp will generate a global function attached to the window object for the duration of the request and pass its data to the then/catch functions.

```javascript
uhttp.jsonp('/api/endpoint/jsonp?callback=JSON_CALLBACK').then(function(res, status, xhr) {
    //Success
}).catch(function(res, status, xhr) {
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
    transformRequest: function(data) {}, //Transform requests before sending
    transformResponse: function(data) {}, //Transform returned responses
    caching: true || [Cache object] || {cache: [Cache object], options: {timeout: 120000}} //Set whether to globally cache all requests (not recommended - use individual request options instead)
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

###### Timeouts

###### With Credentials

###### Transform Request

###### Transform Response

###### Caching

#### Development, Testing, & Building

uhttp is developed using a nodejs environment. Make sure that you have nodejs and npm installed, clone this source repository and run the following in the uhttp directory:

```
npm install && grunt build
```

That will install all dependencies for development, run uhttp's tests, generate code coverage metrics and documentation, and build a minified version of uhttp in the dist directory.

If you have bug fixes that you want merged into uhttp, submit a pull request on the github repository.

# TODO
- [x] Basic ajax requests (get, post, put, delete) - done
- [x] XSRF Cookie / Header - done
- [x] Timeouts - done
- [x] withCredentials - done
- [x] PATCH, HEAD, and JSONP requests - done
- [x] Transform Requests / Responses
- [x] Basic Caching (& timed caches)
- [ ] Finish Testing
- [x] Fix up JSONP
- [x] Building / Build Setup - done
- [ ] Finish Readme, setup github.io site
- [ ] Installing with bower

Installing with Bower:

uhttp is a client side library that can be installed with bower, a dependency management system for client side javascript. Simply run the following (if you have bower installed):

```
bower install uhttp --save
```

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



