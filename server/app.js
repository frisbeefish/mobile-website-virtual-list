/**
 * @fileoverview This is the "main" application that serves up our mobile prototype. It has 2 primary jobs:
 *
 * <ol>
 * <li>Serve up the "index" page - the one page of the app. This is the page with the scrollable list.</li>
 * <li>Provide a "messages" API for the page to call. This API, in turn, calls Google's hosted API to retrieve pages of messages that are shown in the mobile app.</li>
 * </ol>
 */

'use strict'; 


var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var basicAuth = require('basic-auth-connect');


///////////////////////////////////////////////////////////////
//
// Initialize the Express/node.js application and set up its middleware.
//
///////////////////////////////////////////////////////////////


//
// Create the main app.
//
var app = express();

//
// View engine setup
//
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//
// Set up all the middleware we'll be using.
//
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));



///////////////////////////////////////////////////////////////
//
// Set up HTTP Basic Authentication
//
///////////////////////////////////////////////////////////////

app.use(basicAuth('$c0tt', 'g00g1e'));




///////////////////////////////////////////////////////////////
//
// Application Routing Section - Set up the URLs
//
///////////////////////////////////////////////////////////////

//
// Set up the routes (the index page and the "messages" API).
//
var router = express.Router();

//
// Return the mobile web page full of messages. (Well it will be full once it makes HTTP GET calls to the
// "messages" API.)
//
router.get('/', function(req, res, next) {
  res.render('index');
});


//
// Return a page of messages. (This calls the API hosted by Google at: http://message-list.appspot.com/messages).
//
router.get('/api/messages', function(req, res, next) {


   //
   // These are 2 optional query parameters:
   //
   //    limit: Specifies the number of results to fetch, up to 100.
   //    pageToken: A token provided by the previous response to fetch the next page.
   //    
   var limit = req.query.limit || 10;
   var pageToken = req.query.pageToken;

   var options = {
      host: 'message-list.appspot.com',
      port: "80",
      headers: {
         'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
         'Accept-Language': 'en-US,en;q=0.5',
         'Cache-Control': 'max-age=0',
         'Connection': 'keep-alive',
         'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:40.0) Gecko/20100101 Firefox/40.0',
      }
   };


   //
   // Add query parameters to the URL we'll use to call the Google-hosted messages service.
   //
   options.path = "/messages?limit=" + limit + (pageToken ? "&pageToken=" + pageToken : "");

   var responseFromGoogle = '';

   /**
    * This callback is called when the server has made a HTTP GET call to the Google "messages" service.
    * It will set up handlers for the "data" and "end" events so that it can aggregate the response from 
    * the "messages" service into a single JSON string.
    * @param {response} response The object representing the response from the Google "messages" service.
    * @return undefined
    */
   function callback(response) {

      /**
       * Teeny event handler called as each chunk of the response from the Google "messages" service is
       * received.
       * @param {Buffer} chunk A chunk of bytes that are part of the complete message returned by the Google
       * "messages" service.
       * @return undefined
       */
      response.on('data', function(chunk) {
         responseFromGoogle += chunk;
      });

      /**
       * Teeny event handler called once all the bytes of the response from the Google "messages" service have
       * been received - and have been aggregated into the local "str" variable. This function writes the
       * data received from the Google "messages" service out over HTTP as a response to the mobile app. 
       * Once the mobile app receives the response, it will either show the messages (if this is the first
       * page of messages the app has requested) or will cache the page of messages for later display to the
       * user.
       * @return undefined
       */
      response.on('end', function() {
         res.writeHead(200, {
            'Content-Type': 'application/json'
         });
         res.write(responseFromGoogle); //str);
         res.end();
      });
   }

   var request = http.request(options, callback);

   request.on('error', function(err) {
      console.log("ERROR " + err);
   });

   request.end();
});


app.use('/', router);





///////////////////////////////////////////////////////////////
//
// Configure the error handling for the web server.
//
///////////////////////////////////////////////////////////////

//
// Catch 404 and forward to error handler
//
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


//
// Development error handler will print stacktrace.
//
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

//
// Production error handler no stacktraces leaked to user.
//
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
