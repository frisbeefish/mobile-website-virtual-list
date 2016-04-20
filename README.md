

# Overview

This is a node.js app that serves up the Google "infinite scrolling list" prototype.

Since the Google endpoint that serves up the JSON data for the prototype doesn't support CORS or JSONP, it was
necessary to create this simple server that communicated with that Google endpoint. Then the mobile/web app
communicates with this server (which in turn, communicates with the Google endpoint).

The "client" folder contains all the source for the code running in the browser.

The "server" folder contains the node.js code and the compiled client-side code. Actually, "public/server" contains
the compiled client-side code.



# Installation

"npm install" - this installs all the node.js dependencies.

gulp - this will "build" the client (LESS, ReactJS, etc.) and copy the appropriate files into the server/public directory. This will also watch for any changes to the client-side code.


# Running the prototype

## Using forever locally - listening on port 80

sudo PORT=80 forever --watch  --watchDirectory ./server ./index.js

## Other ways...

node ./index.js - This listens on port 3000

sudo PORT=80 node ./index.js - This listens on port 80.

## Heroku Locally

heroku local web - Using heroku local toolbelt

## Heroku on the web

heroku ps:scale web=1
heroku open






