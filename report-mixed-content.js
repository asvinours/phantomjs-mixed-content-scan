#!/usr/bin/env phantomjs --disk-cache=true --ignore-ssl-errors=false --load-images=true --output-encoding=utf-8
'use strict';

var system = require('system'),
    webpage = require('webpage');

var args = system.args,
    URLs = [],
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
    catchUserAgentOnNextLoop = false;

args.slice(1).forEach(function(url) {

    if (url.substr(0, 2) === '--' && url.substr(2) === 'useragent') {
        catchUserAgentOnNextLoop = true;
        return;
    }

    if (catchUserAgentOnNextLoop === true) {
        userAgent = url;
        console.log('New UserAgent: ' + userAgent);
        catchUserAgentOnNextLoop = false;
        return;
    }

    if (url.substr(0, 4) !== 'http') {
        return;
    }

    if (url.substr(0, 8) !== 'https://') {
        console.debug('Rewriting HTTP URL to use HTTPS:', url);
        url = url.replace('http:', 'https:');
    }

    URLs.push(url);
});

if (URLs.length < 1) {
    console.log('Usage:', args[0], 'URL (https?://...) [URL2]');
    phantom.exit(1);
}

function initPage() {
    var page = new WebPage();

    page.onResourceRequested = function(requestData, networkRequest) {
        var originalURL = currentURL = requestData.url;

        var currentPageURL = page.url || page.originalURL;
        if (currentURL.substr(0, 7) === 'http://' && currentURL.replace(/https?/, '').replace(/\/$/, '') === currentPageURL.replace(/https?/, '').replace(/\/$/, '')) {
            console.log('Main URL got redirected to insecure protocol');
        }

        if (currentURL.substr(0, 8) !== 'https://' && page.url.substr(0, 8) === 'https://' && currentURL.substr(0, 5) !== 'data:') {
            console.log('❗️ ', currentPageURL, 'laded an insecure resource:', originalURL);
        }
    };

    page.onError = function (msg, trace) {
        logError('🌋 Page error:', msg);
        trace.forEach(function(item) {
            logError('  ', item.file, ':', item.line);
        });
    };

    page.onConsoleMessage = function(msg) {
        if (msg == 'GOTO_NEXT_PAGE') {
            page.close();
            crawlNextPage();
        } else if (msg.indexOf('insecure content from') >= 0) {
            // We can format WebKit's native error messages nicely:
            console.log('❕ ', msg.trim().replace('The page at ', ''));
        } else {
            console.log('\t💻', msg);
        }
    };

    return page;
}

function crawlNextPage() {
    if (URLs.length < 1) {
        console.log('… done!');
        phantom.exit();
    }

    var url = URLs.shift();
    var page = initPage();

    console.log('Opening', url, '(' + URLs.length + ' remaining)');

    page.settings.userAgent = userAgent;
    page.onInitialized = function() {
        page.evaluate(function(startTime) {
            /* global window */

            // This can happen with things like error pages which have no linked resources to load by the
            // time that our JavaScript starts executing:
            if (document.readyState == 'complete') {
                console.log('GOTO_NEXT_PAGE');
            }

            document.addEventListener('DOMContentLoaded', function() {
                console.log('DOMContentLoaded', ((Date.now() - startTime) / 1000).toFixed(3) + 's');
            });

            window.addEventListener('load', function() {
                console.log('load', ((Date.now() - startTime) / 1000).toFixed(3) + 's');

                window.setTimeout(function () {
                    console.log('GOTO_NEXT_PAGE');
                }, 500);
            });

            window.setTimeout(function () {
                console.log('👎 Aborting page load after one minute');
                console.log('GOTO_NEXT_PAGE');
            }, 60 * 1000);

        }, Date.now());
    };

    page.originalURL = url;

    page.open(url, function (status) {
        if (status === 'success') {
            console.log('✅ ', page.url);
            // Do nothing at this point until the load event fires
        } else {
            console.log('❌ ', url);

            page.close();
            crawlNext();
        }
    });
}

crawlNextPage();
