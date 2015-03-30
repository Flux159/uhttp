exports.config = {
    allScriptsTimeout: 11000,

    specs: [
        'test/client/test.js'
    ],

    capabilities: {
        'browserName': 'chrome'
    },

    chromeOnly: true,

    baseUrl: 'http://localhost:43760/test/server/test.html',

    framework: 'jasmine',

    jasmineNodeOpts: {
        defaultTimeoutInterval: 30000
    }
};
