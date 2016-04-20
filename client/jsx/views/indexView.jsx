/**
 * @fileoverview This is the main model, controller, and view for the Google "Infinite Scrolling Message List"
 * prototype. The prototype is a very simple single-page application.
 *
 * NOTE: Most of the app is running within the main UI thread of the browser. However there is a "web worker" 
 * thread (that doesn't interfere with the UI thread) that is used for retrieving each "next page" of messages in
 * the background.
 */

'use strict';

import React from 'react';
import $ from 'jquery';
import VirtualList from '../components/virtualList'



/**
 * This class contains only the "data/state" for the app.
 * @constructor
 */
class Model extends Object {

   constructor() {
      super();
      this.messages = [];
   }

   /**
    * This method appends a "next page" of messages to the model's list of messages.
    *
    * @param {Array} messages The "next page" of messages to append to the model's list of messages.
    * @return undefined
    */
   addMessages(messages) {
      this.messages = this.messages.concat(messages);
   }

   /**
    * This adds "top" and "height" metrics to the JSON object representing a message. These are used
    * by the virtual list in order to know how to position elements, how much "virtual spacing" to put
    * at the top and the bottom of the list, etc.
    *
    * @param {Number} messageIndex The index of the message within the model's "messages" array.
    * @param {Number} top The vertical "top" edge of the card representing the message within the list.
    * @param {Number} cardHeight The height of the card representing the message within the list.
    * @return undefined
    */
   updateMessageCardMetrics (messageIndex, top, cardHeight) {
      if ( !this.messages[messageIndex].top ) {
         this.messages[messageIndex].top = top;
         this.messages[messageIndex].height = cardHeight;
      }
   }


   /**
    * This "deletes" a message. It also adjust the "top" (location) value for all the message cards below the
    * one that is being deleted. This is important because the virtual list counts on the "top" value of each
    * card to know how to adjust virtual spacers within the virtual list.
    *
    * @param {Number} deleteMessageIndex The index of the message to mark as deleted.
    * @return undefined
    */
   deleteMessage(deleteMessageIndex) {
      var deletedMessage = this.messages.splice(deleteMessageIndex, 1)[0];

      var totalMessageHeight = deletedMessage.top + deletedMessage.height;
      var totalMessageHeight = deletedMessage.height + 30; // Add bottom margin of 30px.
      var priorMessage = deleteMessageIndex === 0 ? null : this.messages[deleteMessageIndex];

      //
      // Adjust the "top" value for remaining message cards at the vertical position of or below (lower in the list)
      // than the one just deleted.
      //
      this.messages.forEach( (message,messageIndex) => {
         if ( messageIndex >= deleteMessageIndex ) {
             if (priorMessage) {
                message.top -= totalMessageHeight;
             } else {
                message.top = 0;
             }
             priorMessage = message;
         }
      });
   }
}



/**
 * This class manages the behaviour of the overall app. It also connects the model to the view. Every time
 * the model is updated, the controller asks the view to "render" itself. So the view is always a 
 * visual representatation of the model/state.
 *
 * 
 * @param {Model} model The model containing the "state" for this application.
 * @constructor
 */
class Controller extends Object {

   constructor(model) {
      super();
      this.model = model;

      this.numberOfMessagesForFirstScreenLoad = 20;
      this.numberOfMessagesForEachNextPageOfMessages = 40;

      //
      // Configure the non-UI thread "web worker" that will get all pages of next messages (after the initial 
      // page of messages - which is retrieved via the UI thread).
      //
      this.createAndConfigureBackgroundWorker();

      //
      // This is necessary so that React will deliver "touch" events to the cards containing the messages.
      //
      React.initializeTouchEvents(true);

   }

   /**
    * Create the web worker that we'll use to retrieve pages of "next messages." Set up the
    * handler that is called each time the web workder has retrieved the messages and turned them into
    * a JSON list.
    * @return undefined
    */
   createAndConfigureBackgroundWorker() {

      this.worker = new Worker('js/webWorkers/indexWebWorker.js');

      //
      // The worker has retrieved some more messages, add them to the virtual list.
      //
      this.worker.onmessage = (event) => {
         this.retrievingMessages = false;
         this.nextPageToken = event.data.pageToken;
         this.model.addMessages(event.data.messages);
         this.render();
      };
   }

   /**
    * Retrieve the first set of messages displayed to the user. It is OK to do this in the UI thread
    * since there isn't anything on the screen at first. Once the messages are retrieved, they are
    * given to the virtual list - which shows them on the screen.
    * @return undefined
    */
   getFirstPageOfMessages() {
      var url = `/api/messages?limit=${this.numberOfMessagesForFirstScreenLoad}`;

      $.getJSON(url, {
            format: 'json'
         })
         .done((data) => {
            this.nextPageToken = data.pageToken;
            this.model.addMessages(data.messages);
            this.render();
         })
         .fail(function(errorObject) {
            alert('ERROR: ' + JSON.stringify(errorObject));
            alert('Error. Status: ' + errorObject.status + " : " + errorObject.statusText);
         });
   }


   /**
    * Retrieve the next page of messages. NOTE: We retrieve the data in a
    * web worker thread, so as to prevent any unnecessary "tax" to be paid by the UI. The idea is that
    * the HTTP GET call and the string-to-JSON-Object process that happens once the data is received all
    * happens in a non-UI thread. The once that set of retrieved messages has been turned into a JSON
    * object, the web worker will "post" that data to the main UI thread, and we'll store those new messages
    * for a time in the future when we'll want to append them to the bottom of the list.
    * @return undefined
    */
   retrieveDataInBackground() {

      //
      // 40 seems to work out fine without jerkyness - at least on android/chrome. And it allows for really
      // fast scrolling without bumping against the end of the list.
      //
      var numberOfMessagesToRetrieve = this.numberOfMessagesForEachNextPageOfMessages;

      this.retrievingMessages = true;
      this.worker.postMessage({nextPageToken:this.nextPageToken,numberOfMessagesToRetrieve});
   }


   /////////////////////////////////////////////////////////
   //
   // "Event Handlers" (callbacks) invoked by the virtual list in order for it to message back to
   // the controller.
   //
   /////////////////////////////////////////////////////////


   /**
    * This adds "top" and "height" metrics to the JSON object representing a message. These are used
    * by the virtual list in order to know how to position elements, how much "virtual spacing" to put
    * at the top and the bottom of the list, etc.
    *
    * @param {Number} messageIndex The index of the message within the model's "messages" array.
    * @param {Number} top The vertical "top" edge of the card representing the message within the list.
    * @param {Number} cardHeight The height of the card representing the message within the list.
    * @return undefined
    */
   updateMessageCardMetrics (messageIndex, top, cardHeight) {
      this.model.updateMessageCardMetrics (messageIndex, top, cardHeight);
   }

   /**
    * Retrieve the next page of messages. This asks the web worker to retrieve the messages on a non-UI thread.
    * @return undefined
    */
   getNextPageOfData() {
      this.retrieveDataInBackground();
   }

   /**
    * The user swipe-deleted a message. Delete the message from the model and then re-render.
    * @return undefined
    */
   handleDeleteMessage(index) {      
      this.model.deleteMessage(index);
      this.render();
   }


   /**
    * This re-renders the entire UI. (Actually, only those parts of the DOM that need to be repainted will
    * be repainted. Many items that are offscreen won't be output to the DOM.)
    * @return undefined
    */
   render() {
      React.render( 
        <VirtualList 
           messages={this.model.messages}
           updateMessageCardMetrics={this.updateMessageCardMetrics.bind(this)}
           getNextPageOfData={this.getNextPageOfData.bind(this)} 
           handleDeleteMessage={this.handleDeleteMessage.bind(this)}/>
        ,document.getElementById('mainContent')
      );
   }

}



//
// This is like the MAIN function for this page.
//
// Create the "hidden global" variables within a closure so that they don't pollute the global namespace.
//
(function() {

   //
   // This is the data (the list of items that show up in the UI in cards).
   //
   var model = new Model();

   //
   // This controls the UI. It is a bridge between the model and the view.
   //
   var controller = new Controller(model);

   //
   // Get the first page of messages and display them to the user.
   //
   controller.getFirstPageOfMessages();

})();