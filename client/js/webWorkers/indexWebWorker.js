/**
 * @fileoverview This is the web worker code that runs in the non-UI thread. It retrieves pages of messages.
 *
 * NOTE: Most of the app is running within the main UI thread of the browser. However there is a "web worker" 
 * thread (that doesn't interfere with the UI thread) that is used for retrieving each "next page" of messages in
 * the background.
 *
 * The basic logic is this:
 *
 * <ol>
 * <li>First, within the main UI thread load the initial page of messages.</li>
 * <li>Each time the entire UI goes through a repaint, load the next page of messages in the web worker thread</li>
 * <li>That next page of messages is stored by the code in the UI thread.</li>
 * <li>Then, some time later, when the user gets near the bottom of the list, add the previously retrieved
 * messages to the end of the list in the "model" of the application and have the main UI re-render itself.</li>
 * </ol>
 */

'use strict';

//
// This is where the action is. Create the "hidden global" variables within a closure so that they
// don't pollute the global namespace.
//
(function() {

   /**
    * This does an HTTP GET of the next page of messages. Once the messages arrive, it will send those messages
    * over to the UI thread.
    * @return undefined
    */
   function getMessages(nextPageToken,numberOfMessagesToRetrieve) {
      console.log('web worker getting next page of messages');
      var xhr;
      var url = `/api/messages?pageToken=${nextPageToken}&limit=${numberOfMessagesToRetrieve}`;
      xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function() {
         if (xhr.readyState == 4 && xhr.status == 200) {

            console.log('web worker received next page of messages');

            //
            // JSONify the result. If this was done in the UI thread, it might briefly freeze things. But
            // since we are in a non-UI thread, no problem!
            //
            var result = JSON.parse(xhr.responseText);

            //
            // Now send the JSON list of "next messages" on over to the UI thread for safekeeping.
            //
            postMessage(result);
         }
      };
      xhr.send();
   }

   /**
    * This is a message handler that is called every time the UI thread calls "worker.postMessage()." When
    * the UI thread sends a message to the worker thread (via "postMessage"), the worker thread then makes
    * an HTTP GET call to the server in order to retrieve the next page of messages.
    * @return undefined
    */
   onmessage = function(e) {
      var nextPageToken = e.data.nextPageToken;
      var numberOfMessagesToRetrieve = e.data.numberOfMessagesToRetrieve;
      getMessages(nextPageToken,numberOfMessagesToRetrieve);
   };

})();