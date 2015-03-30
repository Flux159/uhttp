var assert = require('assert');

//Run test server, test out http w/ options

var testserver = require('../server/testserver');
var ptor = protractor.getInstance();


//Pause for 1-2 seconds while server is starting

describe('uhttp', function() {

//Need to run all tests in a browser...

    //beforeEach(function() {
    //    return browser.driver.ignoreSynchronization = true;
    //});

    describe('GET', function() {

        beforeEach(function() {
            ptor.ignoreSynchronization = true;
            ptor.driver.get('localhost:43760/test/server/test.html');
        });

        //it('should get test.html', function() {
            //ptor.getLocationAbsUrl().then(function(url) {
            //    console.log(url);
            //});
        //});

        //afterEach(function() {
        //    browser.manage().logs().get('browser').then(function(browserLog) {
        //        expect(browserLog.length).toEqual(0);
        //        // Uncomment to actually see the log.
        //        console.log('log: ' + require('util').inspect(browserLog));
        //    });
        //});

        it('Should send a GET request correctly', function() {
            //In browser, should load uhttp.js, run the uhttp.get function, and get the response back to assert whether its correct

            //Apparently mocha can be run in the browser as well, so all I have to do here is load a browser window & run the test there (adding some html for my test, etc.)

            ptor.executeScript(function() {
                uhttp.get('/test/get').then(function(res) {
                    var p = document.createElement('p');
                    var t = document.createTextNode(res.data);
                    p.setAttribute('id', 'get');
                    p.setAttribute('data', res.data);
                    p.appendChild(t);
                    document.body.appendChild(p);
                }).catch(function(err) {
                    console.log("There was an error");
                });
            });

            ptor.sleep(1000);

            //Check that the element was created with the correct data
            expect(browser.driver.findElement(by.id('get')).getAttribute('data')).toEqual('GET');

        });

        it('Should fail to send a GET request when sent to an api that doesnt exist', function() {
            ptor.executeScript(function() {
                uhttp.get('/nulltest/get').then(function(res) {
                    console.log("There was an error");
                }).catch(function(err) {
                    var p = document.createElement('p');
                    var t = document.createTextNode('Error');
                    p.setAttribute('id', 'get');
                    p.setAttribute('data', 'error');
                    p.appendChild(t);
                    document.body.appendChild(p);
                });
            });

            ptor.sleep(1000);

            //Check that the element was created with the correct data
            expect(browser.driver.findElement(by.id('get')).getAttribute('data')).toEqual('error');
        });


    });


});

