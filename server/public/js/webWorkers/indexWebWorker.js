(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
(function () {

   /**
    * This does an HTTP GET of the next page of messages. Once the messages arrive, it will send those messages
    * over to the UI thread.
    * @return undefined
    */
   function getMessages(nextPageToken, numberOfMessagesToRetrieve) {
      console.log('web worker getting next page of messages');
      var xhr;
      var url = '/api/messages?pageToken=' + nextPageToken + '&limit=' + numberOfMessagesToRetrieve;
      xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function () {
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
   onmessage = function (e) {
      var nextPageToken = e.data.nextPageToken;
      var numberOfMessagesToRetrieve = e.data.numberOfMessagesToRetrieve;
      getMessages(nextPageToken, numberOfMessagesToRetrieve);
   };
})();

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc2NvdHQvZGV2L2dvb2dsZS9jbGllbnQvanMvd2ViV29ya2Vycy9pbmRleFdlYldvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2tCQSxZQUFZLENBQUM7Ozs7OztBQU1iLENBQUMsWUFBVzs7Ozs7OztBQU9ULFlBQVMsV0FBVyxDQUFDLGFBQWEsRUFBQywwQkFBMEIsRUFBRTtBQUM1RCxhQUFPLENBQUMsR0FBRyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7QUFDeEQsVUFBSSxHQUFHLENBQUM7QUFDUixVQUFJLEdBQUcsZ0NBQThCLGFBQWEsZUFBVSwwQkFBMEIsQUFBRSxDQUFDO0FBQ3pGLFNBQUcsR0FBRyxJQUFJLGNBQWMsRUFBRSxDQUFDO0FBQzNCLFNBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM1QixTQUFHLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDekQsU0FBRyxDQUFDLGtCQUFrQixHQUFHLFlBQVc7QUFDakMsYUFBSSxHQUFHLENBQUMsVUFBVSxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLEdBQUcsRUFBRTs7QUFFM0MsbUJBQU8sQ0FBQyxHQUFHLENBQUMsMkNBQTJDLENBQUMsQ0FBQzs7Ozs7O0FBTXpELGdCQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQzs7Ozs7QUFLMUMsdUJBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztVQUN0QjtPQUNILENBQUM7QUFDRixTQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDYjs7Ozs7Ozs7QUFRRCxZQUFTLEdBQUcsVUFBUyxDQUFDLEVBQUU7QUFDckIsVUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7QUFDekMsVUFBSSwwQkFBMEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDO0FBQ25FLGlCQUFXLENBQUMsYUFBYSxFQUFDLDBCQUEwQixDQUFDLENBQUM7SUFDeEQsQ0FBQztDQUVKLENBQUEsRUFBRyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQGZpbGVvdmVydmlldyBUaGlzIGlzIHRoZSB3ZWIgd29ya2VyIGNvZGUgdGhhdCBydW5zIGluIHRoZSBub24tVUkgdGhyZWFkLiBJdCByZXRyaWV2ZXMgcGFnZXMgb2YgbWVzc2FnZXMuXG4gKlxuICogTk9URTogTW9zdCBvZiB0aGUgYXBwIGlzIHJ1bm5pbmcgd2l0aGluIHRoZSBtYWluIFVJIHRocmVhZCBvZiB0aGUgYnJvd3Nlci4gSG93ZXZlciB0aGVyZSBpcyBhIFwid2ViIHdvcmtlclwiIFxuICogdGhyZWFkICh0aGF0IGRvZXNuJ3QgaW50ZXJmZXJlIHdpdGggdGhlIFVJIHRocmVhZCkgdGhhdCBpcyB1c2VkIGZvciByZXRyaWV2aW5nIGVhY2ggXCJuZXh0IHBhZ2VcIiBvZiBtZXNzYWdlcyBpblxuICogdGhlIGJhY2tncm91bmQuXG4gKlxuICogVGhlIGJhc2ljIGxvZ2ljIGlzIHRoaXM6XG4gKlxuICogPG9sPlxuICogPGxpPkZpcnN0LCB3aXRoaW4gdGhlIG1haW4gVUkgdGhyZWFkIGxvYWQgdGhlIGluaXRpYWwgcGFnZSBvZiBtZXNzYWdlcy48L2xpPlxuICogPGxpPkVhY2ggdGltZSB0aGUgZW50aXJlIFVJIGdvZXMgdGhyb3VnaCBhIHJlcGFpbnQsIGxvYWQgdGhlIG5leHQgcGFnZSBvZiBtZXNzYWdlcyBpbiB0aGUgd2ViIHdvcmtlciB0aHJlYWQ8L2xpPlxuICogPGxpPlRoYXQgbmV4dCBwYWdlIG9mIG1lc3NhZ2VzIGlzIHN0b3JlZCBieSB0aGUgY29kZSBpbiB0aGUgVUkgdGhyZWFkLjwvbGk+XG4gKiA8bGk+VGhlbiwgc29tZSB0aW1lIGxhdGVyLCB3aGVuIHRoZSB1c2VyIGdldHMgbmVhciB0aGUgYm90dG9tIG9mIHRoZSBsaXN0LCBhZGQgdGhlIHByZXZpb3VzbHkgcmV0cmlldmVkXG4gKiBtZXNzYWdlcyB0byB0aGUgZW5kIG9mIHRoZSBsaXN0IGluIHRoZSBcIm1vZGVsXCIgb2YgdGhlIGFwcGxpY2F0aW9uIGFuZCBoYXZlIHRoZSBtYWluIFVJIHJlLXJlbmRlciBpdHNlbGYuPC9saT5cbiAqIDwvb2w+XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vL1xuLy8gVGhpcyBpcyB3aGVyZSB0aGUgYWN0aW9uIGlzLiBDcmVhdGUgdGhlIFwiaGlkZGVuIGdsb2JhbFwiIHZhcmlhYmxlcyB3aXRoaW4gYSBjbG9zdXJlIHNvIHRoYXQgdGhleVxuLy8gZG9uJ3QgcG9sbHV0ZSB0aGUgZ2xvYmFsIG5hbWVzcGFjZS5cbi8vXG4oZnVuY3Rpb24oKSB7XG5cbiAgIC8qKlxuICAgICogVGhpcyBkb2VzIGFuIEhUVFAgR0VUIG9mIHRoZSBuZXh0IHBhZ2Ugb2YgbWVzc2FnZXMuIE9uY2UgdGhlIG1lc3NhZ2VzIGFycml2ZSwgaXQgd2lsbCBzZW5kIHRob3NlIG1lc3NhZ2VzXG4gICAgKiBvdmVyIHRvIHRoZSBVSSB0aHJlYWQuXG4gICAgKiBAcmV0dXJuIHVuZGVmaW5lZFxuICAgICovXG4gICBmdW5jdGlvbiBnZXRNZXNzYWdlcyhuZXh0UGFnZVRva2VuLG51bWJlck9mTWVzc2FnZXNUb1JldHJpZXZlKSB7XG4gICAgICBjb25zb2xlLmxvZygnd2ViIHdvcmtlciBnZXR0aW5nIG5leHQgcGFnZSBvZiBtZXNzYWdlcycpO1xuICAgICAgdmFyIHhocjtcbiAgICAgIHZhciB1cmwgPSBgL2FwaS9tZXNzYWdlcz9wYWdlVG9rZW49JHtuZXh0UGFnZVRva2VufSZsaW1pdD0ke251bWJlck9mTWVzc2FnZXNUb1JldHJpZXZlfWA7XG4gICAgICB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgIHhoci5vcGVuKCdHRVQnLCB1cmwsIGZhbHNlKTtcbiAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09IDQgJiYgeGhyLnN0YXR1cyA9PSAyMDApIHtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3dlYiB3b3JrZXIgcmVjZWl2ZWQgbmV4dCBwYWdlIG9mIG1lc3NhZ2VzJyk7XG5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBKU09OaWZ5IHRoZSByZXN1bHQuIElmIHRoaXMgd2FzIGRvbmUgaW4gdGhlIFVJIHRocmVhZCwgaXQgbWlnaHQgYnJpZWZseSBmcmVlemUgdGhpbmdzLiBCdXRcbiAgICAgICAgICAgIC8vIHNpbmNlIHdlIGFyZSBpbiBhIG5vbi1VSSB0aHJlYWQsIG5vIHByb2JsZW0hXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBOb3cgc2VuZCB0aGUgSlNPTiBsaXN0IG9mIFwibmV4dCBtZXNzYWdlc1wiIG9uIG92ZXIgdG8gdGhlIFVJIHRocmVhZCBmb3Igc2FmZWtlZXBpbmcuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgcG9zdE1lc3NhZ2UocmVzdWx0KTtcbiAgICAgICAgIH1cbiAgICAgIH07XG4gICAgICB4aHIuc2VuZCgpO1xuICAgfVxuXG4gICAvKipcbiAgICAqIFRoaXMgaXMgYSBtZXNzYWdlIGhhbmRsZXIgdGhhdCBpcyBjYWxsZWQgZXZlcnkgdGltZSB0aGUgVUkgdGhyZWFkIGNhbGxzIFwid29ya2VyLnBvc3RNZXNzYWdlKCkuXCIgV2hlblxuICAgICogdGhlIFVJIHRocmVhZCBzZW5kcyBhIG1lc3NhZ2UgdG8gdGhlIHdvcmtlciB0aHJlYWQgKHZpYSBcInBvc3RNZXNzYWdlXCIpLCB0aGUgd29ya2VyIHRocmVhZCB0aGVuIG1ha2VzXG4gICAgKiBhbiBIVFRQIEdFVCBjYWxsIHRvIHRoZSBzZXJ2ZXIgaW4gb3JkZXIgdG8gcmV0cmlldmUgdGhlIG5leHQgcGFnZSBvZiBtZXNzYWdlcy5cbiAgICAqIEByZXR1cm4gdW5kZWZpbmVkXG4gICAgKi9cbiAgIG9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBuZXh0UGFnZVRva2VuID0gZS5kYXRhLm5leHRQYWdlVG9rZW47XG4gICAgICB2YXIgbnVtYmVyT2ZNZXNzYWdlc1RvUmV0cmlldmUgPSBlLmRhdGEubnVtYmVyT2ZNZXNzYWdlc1RvUmV0cmlldmU7XG4gICAgICBnZXRNZXNzYWdlcyhuZXh0UGFnZVRva2VuLG51bWJlck9mTWVzc2FnZXNUb1JldHJpZXZlKTtcbiAgIH07XG5cbn0pKCk7Il19
