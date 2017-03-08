#!/usr/bin/env phantomjs --disk-cache=true --ignore-ssl-errors=false --load-images=true --output-encoding=utf-8
'use strict';

var system = require('system'),
    webpage = require('webpage');

var args = system.args,
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36 mixed-content',
    catchUserAgentOnNextLoop = false,
    enableCrawler = false,
    verboseFlag = false,
    disableCookies = false,
    startUrl = false,
    uniqUrls = [],
    urlsToBrowse = [],
    browsedUrls = [];

var userAgents = {
    pc: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36 mixed-content',
    mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12A366 Safari/600.1.4 mixed-content',
    tablet: 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 10 Build/LMY49F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.83 Safari/537.36 mixed-content'
};

args.slice(1).forEach(function(option) {

    if (option.substr(0, 2) === '--') {
        var optionLabel = option.substr(2);
        if (optionLabel === 'useragent') {
            catchUserAgentOnNextLoop = true;
        } else if (optionLabel === 'mobile') {
            userAgent = userAgents.mobile;
        } else if (optionLabel === 'tablet') {
            userAgent = userAgents.tablet;
        } else if (optionLabel === 'pc') {
            userAgent = userAgents.pc;
        } else if (optionLabel === 'crawl') {
            enableCrawler = true;
        } else if (optionLabel === 'verbose') {
            verboseFlag = true;
        } else if (optionLabel === 'disable-cookies') {
            disableCookies = true;
        }
        return;
    }
    if (catchUserAgentOnNextLoop === true) {
        userAgent = option;
        verboseOutput('New UserAgent: ' + userAgent);
        catchUserAgentOnNextLoop = false;
        return;
    }

    if (option.substr(0, 4) !== 'http') {
        return;
    }

    if (option.substr(0, 8) !== 'https://') {
        verboseOutput('Rewriting HTTP URL to use HTTPs:' + option);
        option = option.replace('http://', 'https://');
    }

    startUrl = option;
    urlsToBrowse.push(option);
});

// In case we want to disable the cookies
phantom.cookiesEnabled = !disableCookies;

if (urlsToBrowse.length < 1) {
    console.log('Usage: ', args[0], ' [options] URL (https?://...)');
    console.log('Options: --mobile, --tablet, --useragent="<user_agent>", --crawl, --verbose')
    phantom.exit(1);
}

function initPage() {
    var page = new WebPage();

    page.onResourceRequested = function(requestData, networkRequest) {
        var originalURL = currentURL = requestData.url;

        var currentPageURL = page.url || page.originalURL;
        if (currentURL.substr(0, 7) === 'http://' && currentURL.replace(/https?/, '').replace(/\/$/, '') === currentPageURL.replace(/https?/, '').replace(/\/$/, '')) {
            console.log(currentURL + ' got redirected to insecure protocol');
        }
    };

    page.onResourceReceived = function (response) {
        if (response.stage == "start" && response.url.substr(0, 4) === "http" && uniqUrls.indexOf(response.url) === -1) {
          uniqUrls.push(response.url);
        }
    };

    page.onError = function (msg, trace) {
        logError('🌋 Page error:', msg);
        trace.forEach(function(item) {
            logError('  ', item.file, ':', item.line);
        });
    };

    page.onConsoleMessage = function(msg) {
        if (msg.indexOf('insecure content from') >= 0) {
            // We can format WebKit's native error messages nicely:
            console.log('❕ ', msg.trim().replace('The page at ', ''));
        } else {
            verboseOutput('\t💻' + msg);
        }
    };

    return page;
}

function verboseOutput(msg) {
    if (verboseFlag == true) {
        console.log(msg);
    }
}

function crawl() {
  if (urlsToBrowse.length == 0) {
    console.log('✅ ', startUrl);
    phantom.exit(0);
  } else {
    var url = urlsToBrowse.shift();
    crawlNextPage(url, crawl);
  }
}

function crawlNextPage(url, callback) {

    var page = initPage();
    verboseOutput('Opening ' + url + ' (' + urlsToBrowse.length + ' remaining)');

    page.settings.userAgent = userAgent;
    page.onInitialized = function() {
        page.evaluate(function(startTime) {
            /* global window */
            document.addEventListener('DOMContentLoaded', function() {
                console.log('DOMContentLoaded ' + ((Date.now() - startTime) / 1000).toFixed(3) + 's');
            });

            window.addEventListener('load', function() {
                console.log('load ' + ((Date.now() - startTime) / 1000).toFixed(3) + 's');

            });

            window.setTimeout(function () {
                console.log('👎 Aborting page load after one minute');
            }, 60 * 1000);

        }, Date.now());
    };

    page.originalURL = url;
    page.open(url, function (status) {
        browsedUrls.push(url);

        if (status !== 'success') {
            console.log('❌ ', url);

            if (url === startUrl) {
                console.log("Couldn't open " + url);
                phantom.exit(1);
            }

        } else {
            verboseOutput('✅  ' + page.url);

            var uniqHrefs = page.evaluate(function() {
                var uniqHrefs = [];

                var l = document.links;
                for(var i=0; i<l.length; i++) {
                  var href = l[i].getAttribute("href");
                  if (href && href.length > 1 && href.charAt(0) == '/' && href.charAt(1) != '/') {
                    href = href.replace(/\/$/, '');
                    if (uniqHrefs.indexOf(href) === -1) {
                        uniqHrefs.push(href);
                    }
                  }
                }

                return uniqHrefs;
            });

            if (uniqHrefs && enableCrawler === true) {
                uniqHrefs.forEach(function(href) {
                    var url_without_path = url.split("/").slice(0,3).join("/");
                    var urlFromHref = url_without_path + href;

                    if (browsedUrls.indexOf(urlFromHref) === -1 && urlsToBrowse.indexOf(urlFromHref) === -1) {
                        urlsToBrowse.push(urlFromHref);
                    }
                });
            }
        }

        page.close();
        callback.apply();
    });
}

crawl();
