# uhttp

A micro client-side ajax library modelled after angularjs's $http module that doesn't require any dependencies (jquery or otherwise). 

uhttp is under 4kb minified and under 2kb minified and compressed.

uhttp supports setting headers globally for all requests and setting headers individually for each request. It also automatically parses json in responses with the appropriate content type. uhttp is based off of [atomic](https://github.com/toddmotto/atomic) and angularjs's [$http](https://github.com/angular/angular.js/blob/v1.3.x/src/ng/http.js). uhttp was written because atomic didn't support common features (setting headers & sending json POST requests) and [React](https://facebook.github.io/react/index.html) didn't come with a built in ajax library (recommending jQuery instead).

#### uhttp.get(url, [,options])
Use uhttp.get() to make a GET request. You can use either "then... catch" or "success... error" callbacks to obtain the response.

```javascript
uhttp.get('/api/endpoint').then(function(data, xhr) {
    //Successful response
}).catch(function(err, xhr) {
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

uhttp.get('/api/endpoint', options).success(function(data, xhr) {
    //Success
}).error(function(err, xhr) {
    //Error
});

```

#### http.post(url, [,options] [,data])

Use uhttp.post() to make a POST request. By default, the content type for JSON and FormData is automatically set for you. To change this, either set a global default for the "Content-Type" header, or pass it in as an option.

```javascript
uhttp.post('/api/endpoint/post', {some: 'data'}).then(function(data, xhr) {
    //Success
}).catch(function(err, xhr) {
    //Error
});
```

Example using FormData:
```javascript
var formElement = document.getElementById("myform");
var formData = new FormData(formElement);
formData.append("username", "cat");
uhttp.post('api/endpoint/post', formData).then(function(data, xhr) {
    //Success
}).catch(function(err, xhr) {
    //Error
});
```

Example setting a custom content type:
```javascript
var myCustomData = '<custom>xml</custom>';
uhttp.post('/api/endpoint/post', {'Content-Type': 'application/xml'}, myCustomData).then(function(data, xhr) {
    //Success
}).catch(function(err, xhr) {
    //Error
});
```

#### uhttp.put()

Use uhttp.put() to make a PUT request. The options are similar to POST requests.

```javascript
uhttp.put('/api/endpoint/put', {some: 'data'}).then(function(data, xhr) {
    //Success
}).catch(function(err, xhr) {
    //Error
});
```

#### uhttp.patch()

Use uhttp.patch() to make a PATCH request.

```javascript
uhttp.patch('/api/endpoint/patch', {some: 'data'}).then(function(data, xhr) {
    //Success
}).catch(function(err, xhr) {
    //Error
});
```

#### uhttp.delete()

Use uhttp.delete() to send a DELETE request.

```javascript
uhttp.delete('/api/endpoint/delete').then(function(data, xhr) {
    //Success
}).catch(function(err, xhr) {
    //Error
});
```

#### uhttp.head()

Use uhttp.head() to send a HEAD request.

```javascript
uhttp.head('/api/endpoint/head').then(function(data, xhr) {
    //Success
}).catch(function(err, xhr) {
    //Error
});
```

#### uhttp.jsonp()

Use uhttp.jsonp() to send a JSONP request.

```javascript
uhttp.jsonp('/api/endpoint/jsonp').then(function(data, xhr) {
    //Success
}).catch(function(err, xhr) {
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


# TODO
- [x] Basic ajax requests (get, post, put, delete) - done
- [x] XSRF Cookie / Header - done
- [x] Timeouts - done
- [x] withCredentials - done
- [x] PATCH, HEAD, and JSONP requests - done
- [x] Transform Requests / Responses
- [x] Basic Caching (& timed caches)
- [ ] Testing
- [x] Building / Build Setup - done
- [ ] Finish Readme, setup github.io site
- [ ] Installing with bower

Installing with Bower:



