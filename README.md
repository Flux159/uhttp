# uhttp

A micro client-side ajax library modelled after angularjs's $http module that doesn't require any dependencies (jquery or otherwise). 

uhttp is under 2kb minified and under 1kb minified and compressed.

uhttp supports setting headers globally for all requests and setting headers individually for each request. It also automatically parses json in responses with the appropriate content type. uhttp is based off of [atomic](https://github.com/toddmotto/atomic) and angularjs's [$http](https://github.com/angular/angular.js/blob/v1.3.x/src/ng/http.js). uhttp was written because atomic didn't support common features (setting headers & sending json POST requests) and [React](https://facebook.github.io/react/index.html) didn't come with a built in ajax library (requiring jQuery instead).

#### uhttp.get(url, [,options])
Use uhttp.get() to make a GET request. You can use either then, catch or success, error callbacks to obtain the response.

```javascript
uhttp.get('/api/endpoint').then(function(data, xhr) {
    //Successful response
}).catch(function(err, xhr) {
    //Error
});

```

Currently the only options supported are headers, the [with credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS#Requests_with_credentials) flag, and a timeout:

```javascript
var options = {
    headers: {
        'custom': 'header'
    },
    withCredentials: true,
    timeout: 3000 //3 seconds
};

uhttp.get('/api/endpoint', options).success(function(data, xhr) {
    //Success
}).error(function(err, xhr) {
    //Error
});

```

#### http.post(url, [,options] [,data])

Use uhttp.post() to make a POST request.


#### uhttp.put()


#### uhttp.delete()



#### uhttp.head()


#### uhttp.patch()


#### uhttp.jsonp()


#### Global defaults

You can set global default headers


#### Options

###### Custom Headers

###### Timeouts

###### With Credentials

###### Caching


# TODO
- [ ] XSRF Tokens
- [ ] Timeouts
- [ ] withCredentials
- [ ] HEAD & JSONP requests
- [ ] Check that CORS requests work
- [ ] Basic Caching (& timed caches)
- [ ] Testing

Installing with Bower:



