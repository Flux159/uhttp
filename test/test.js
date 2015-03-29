var assert = require('assert');

//Run test server, test out http w/ options

require('./testserver');

//Pause for 1-2 seconds while server is starting

describe('uhttp', function() {

//Need to run all tests in a browser...

    describe('GET', function() {
        it('Should send a GET request correctly', function(done) {
            //In browser, should load uhttp.js, run the uhttp.get function, and get the response back to assert whether its correct

            console.log("Hello Testing");

        });
    });


});

