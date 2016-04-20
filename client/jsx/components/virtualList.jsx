
/**
 * @fileoverview This is the virual list of messages. It uses ReactJS to show content onto the screen (into the
 * DOM). But it only shows those elements that will be in the user's view or some of the elements immediately
 * "above the fold" and "below the fold." It also supports right-swipe-to-delete of messages.
 */

'use strict';

import React from 'react';
import $ from 'jquery';
import Card from './card'



/**
 * This class contains only the "data/state" for the app.
 *
 * Properties:
 * <ul>
 *    <li>messages - The Array of messages to display in the list. (Only a few will actually be displayed
 *        in the browser in DOM elements - even if the list is REALLY LONG</li>
 *    <li>updateMessageCardMetrics - Event handler/callback hosted by the controller. The virutal list
 *        calls this method so that the controller can update the model object representing a message with
 *        the "top" and "height" metrics for the card representing that message on the screen.</li>
 *    <li>getNextPageOfData - Event handler/callback hosted by the controller. Used by the list fo request
 *        another "page" of messages.</li>
 *    <li>handleDeleteMessage - Event handler/callback hosted by the controller. This deletes a message from
 *        the model's list of messages. It is called when a user swipe-deletes a message.</li>
 * </ul>
 *
 * @constructor
 */
class VirtualList extends React.Component {

   constructor(props) {
      super(props);

      var viewportHeight = $(window).height();

      this.state = {
         deletingMessage:false,
         scrollPosition:0,
         viewportHeight:viewportHeight,
         getMoreContentWaterLevel:10,
         gettingMoreContent:false,
         verticalScrollSpeed:0,
         displayListWindows:{
            cardsOnPreviousPage:10,
            cardsOnNextPage:10
         }
      }
   }


   /**
    * This is called each time the list is scrolled at all by the user. It calculates the scroll position,
    * determines the speed of scrolling (possibly useful for tuning performance of the list), generates a
    * "display list" (indicating which elements of the complete array of messages to actually display in
    * the brower as DOM elements), and also determines whether or not the user is close to viewing the bottommost
    * elements in the list. If the user is close to the bottom of the list, this method "sends an event" to the
    * controller, requesting another page of messages.
    * @return undefined
    */
   handleScrollView() {

      var scrollPosition = $('#mainContent').parent().scrollTop();

      //
      // Calculate scroll speed here.
      //
      var msNow = new Date().getTime();
      this.lastVerticalScrollSpeed = this.verticalScrollSpeed || 0;
      if (this.lastVerticalScrollTime) {
          this.verticalScrollSpeed = (scrollPosition - this.lastVerticalScrollPosition)/(msNow - this.lastVerticalScrollTime);
      } else {
          this.verticalScrollSpeed = 0;
      }
      this.lastVerticalScrollPosition = scrollPosition;
      this.lastVerticalScrollTime = msNow;

      //
      // Generate the "display list" - which is simply some indices and sizes that tell the virtual list 
      // what elements it should display to the user. Another method (a ReactJS lifecycle method) will determine
      // whether or not to actually update the DOM with this display list. Only if the list differs from the
      // last screen update will the code allow ReactJS to actually update the UI. If we didn't do this
      // sort of check, the ReactJS would always update the UI and we'd have a way worse performing list.
      //
      var displayList = this.calculateDisplayList(scrollPosition);

      //
      // Make a request for the "next page" of messages if necessary.
      //
      var gettingMoreContent = this.state.gettingMoreContent;
      if (!this.state.gettingMoreContent) {
        if ( ( displayList.numberOfMessages - displayList.lastRenderedCardIndex ) < this.state.getMoreContentWaterLevel ) {
           gettingMoreContent = true;
           this.props.getNextPageOfData();
        }
      }

      //
      // Now update the ReactJS "state" (this data is used witin the ReactJS lifecycle "shouldComponentUpdate"
      // method in order to tell ReactJS whether or not to actually update the UI).
      //
      this.setState({
         scrollPosition:scrollPosition,
         displayList:displayList,
         gettingMoreContent:gettingMoreContent,
         deletingMessage:false,
         verticalScrollSpeed:this.verticalScrollSpeed
      });
   }


   /**
    * This calculates the size of the "spacer" above any message "cards" in the list, the index of the
    * first card to show and the last card to show, the size of the "spacer" below the last message that is
    * shown, etc. The purpose of this is to quickly calculate what *WOULD* show up on the screen based on 
    * the list of messages and where within the list the user has scrolled. Code elsewhere within this list
    * will determine whether or note it already has displayed all the items specified by this "display list." If
    * not, the UI will show the items. But if they are already showing, we save processing time by telling
    * ReactJS not to update the UI.
    *
    * @param {Number} messageIndex The index of the message within the model's "messages" array.
    * @param {Number} top The vertical "top" edge of the card representing the message within the list.
    * @param {Number} cardHeight The height of the card representing the message within the list.
    * @return {Object} This method returns a object with the following fields:
    * <ul>
    *   <li>{Number} aboveFirstRenderedCardBufferHeight - Height of spacer before the first message in the DOM.</li>
    *   <li>{Number} firstRenderedCardIndex - The index (within the this.props.messages array) of the first 
    *       message to display in the DOM. (This might be "above" the fold or within view of the user.</li>
    *   <li>{Number} lastRenderedCardIndex - The index (within the this.props.messages array) of the last 
    *       message to display in the DOM. (This might be "below" the fold or within view of the user.</li>
    *   <li>{Number} belowLastRenderedCardBufferHeight - Height of spacer after the last message in the DOM.</li>
    *   <li>{Number} numberOfMessages - To save processing time, this is a cache of the length of the messages list.</li>
    * </ul>
    */
   calculateDisplayList(scrollPosition) {

      let messages = this.props.messages;
      let messagesLength = messages.length;

      //
      // Special case. This is when the app first initializes and the entire list is rendered.
      //
      if (!scrollPosition) {
          return {
             aboveFirstRenderedCardBufferHeight:0,
             firstRenderedCardIndex:0,
             lastRenderedCardIndex:this.props.messages.length-1,
             belowLastRenderedCardBufferHeight:0,
             numberOfMessages:messagesLength
          }
      }

      let viewportHeight = this.state.viewportHeight;
      let indexOfFirstCardInViewport = 0;
      let yPosBottomEdgeOfContent = scrollPosition + viewportHeight;

      //
      // Identify the first card the user can see in the viewport.
      //
      for (; indexOfFirstCardInViewport < messagesLength; indexOfFirstCardInViewport++ ) {
         let message = messages[indexOfFirstCardInViewport];
         if (message.top >= scrollPosition) {
            break;
         }
      }

      //
      // Calculate the index of the first message in the DOM (this one is usually "above the fold." Also, calculate the 
      // height of the spacer above the first message in the DOM.
      //
      let cardsOnPreviousPage = this.state.displayListWindows.cardsOnPreviousPage;
      let firstRenderedCardIndex = Math.max(0,indexOfFirstCardInViewport-cardsOnPreviousPage);
      let aboveFirstRenderedCardBufferHeight = firstRenderedCardIndex == 0 ? 0 :
         (messages[firstRenderedCardIndex-1].top + messages[firstRenderedCardIndex-1].height - 50);

      let indexOfLastCardInViewport = indexOfFirstCardInViewport;

      //
      // Identify the last card the user can see in the viewport.
      //
      for (; indexOfLastCardInViewport < messagesLength; indexOfLastCardInViewport++ ) {
         let message = messages[indexOfLastCardInViewport];

         //
         // The card is partially below the "fold" (the bottom edge of the viewport).
         //
         if (( message.top + message.height) < yPosBottomEdgeOfContent) {
            break;
         }
      }

      //
      // Calculate the index of the last message in the DOM (this one is "below the fold." Also, calculate the 
      // height of the spacer below the last message in the DOM.
      //
      let cardsOnNextPage = this.state.displayListWindows.cardsOnNextPage;
      let lastRenderedCardIndex = Math.min(messagesLength-1,indexOfLastCardInViewport+cardsOnNextPage);
      let belowLastRenderedCardBufferHeight = 0;
      if (lastRenderedCardIndex < (messagesLength-1)) {
         let lastMessageInList = messages[messagesLength-1];
         let lastRenderedMessage = messages[lastRenderedCardIndex];
         belowLastRenderedCardBufferHeight = 
            ( 
                (lastMessageInList.top + lastMessageInList.height) -
                (lastRenderedMessage.top + lastRenderedMessage.height)
            )
      }

      return {
         aboveFirstRenderedCardBufferHeight:aboveFirstRenderedCardBufferHeight,
         firstRenderedCardIndex:firstRenderedCardIndex,
         lastRenderedCardIndex:lastRenderedCardIndex,
         belowLastRenderedCardBufferHeight:belowLastRenderedCardBufferHeight,
         numberOfMessages:messagesLength
      }
   }



   /////////////////////////////////////////////////////////
   //
   // ReactJS "lifecycle" callbacks. ReactJS calls these during various times within the lifecycle of
   // the virtual list ReactJS component.
   //
   /////////////////////////////////////////////////////////


   /**
    * This is called only once - when this component is first displayed onto the screen. This is a good
    * place to hook into DOM events.
    * @return undefined
    */
   componentDidMount() {

      //
      // Listen for scroll events on the main UI.
      //
      $('#mainContent').parent().on('scroll', this.handleScrollView.bind(this));

      //
      // Listen to resize events that will change the height of the list's viewport. Update the
      // "viewportHeight" in the "state" whenever the viewport height changes.
      //
      $(window).resize( () => {

        //
        // Get the size of the mobile device's screen.
        //
        var viewportHeight = $(window).height();
        this.setState({
           viewportHeight:viewportHeight
        });
      });
   }



   /**
    * This is called when the "props" have changed on the list (thus, when the list is re-rendered via the
    * controller's "render" method - not this virtual list's "render" method). This is used to clear the
    * "getting more content" flag. Clearing the flag sets up the list to be able to request more content
    * once the user gets down to viewing the bottom of the list.
    *
    * @param {Object} nextProps The value for "props" that has been set on the list but are not yet
    *                 available via "this.props" (but will be available by the time of the call to "render").
    * @return undefined
    */
   componentWillReceiveProps(nextProps) {
      if (nextProps.messages.length != this.props.messages.length && this.state.gettingMoreContent) {
         this.setState({
            gettingMoreContent:false    
         });
      } 
   }

   /**
    * Invoked before rendering when new props or state are being received. This method is not called for the 
    * initial render or when forceUpdate is used.
    *
    * Use this as an opportunity to return false when you're certain that the transition to the new props 
    * and state will not require a component update.
    *
    * If shouldComponentUpdate returns false, then render() will be completely skipped until the next
    * state change. In addition, componentWillUpdate and componentDidUpdate will not be called.
    *
    * @param {Object} nextProps The value for "props" that has been set on the list but are not yet
    *                 available via "this.props" (but will be available by the time of the call to "render").
    * @param {Object} nextState The value for "state" that has been set on the list but are not yet
    *                 available via "this.state" (but will be available by the time of the call to "render").
    * @return undefined
    */
   shouldComponentUpdate(nextProps, nextState) {

      var shouldUpdate = true;

      //
      // Only do a re-render if something in the display list has changed. This saves TONS of
      // processing because during "render" ReactJS does lots of math. Only if we set
      // "shouldUpdate" to "true," will React call "render."
      //
      if (this.state.displayList) {
          shouldUpdate = (
             (
                this.state.displayList.aboveFirstRenderedCardBufferHeight !=
                nextState.displayList.aboveFirstRenderedCardBufferHeight
             ) ||
             (
                this.state.displayList.firstRenderedCardIndex !=
                nextState.displayList.firstRenderedCardIndex
             ) ||
             (
                this.state.displayList.lastRenderedCardIndex !=
                nextState.displayList.lastRenderedCardIndex
             ) ||
             (
                this.state.displayList.belowLastRenderedCardBufferHeight !=
                nextState.displayList.belowLastRenderedCardBufferHeight
             ) ||
             (
                this.state.displayList.numberOfMessages !=
                nextState.displayList.numberOfMessages
             ) || 
             this.state.deletingMessage
          );
      } 

      return shouldUpdate;
   }


   /////////////////////////////////////////////////////////
   //
   // "Event Handlers" (callbacks) invoked by the cards in the list in order for them to send messages back to
   // this virtual list.
   //
   /////////////////////////////////////////////////////////


   /**
    * This is called (by each card) when it is first displayed within the browser's DOM. It allows us
    * to convey back to the model the "metrics" (top position and height) of the card containing the
    * message.
    *
    * @param {Number} messageIndex The index of the message within the model's "messages" array.
    * @param {Number} top The vertical "top" edge of the card representing the message within the list.
    * @param {Number} cardHeight The height of the card representing the message within the list.
    * @return undefined
    */
   cardIsInDom (cardIndex, top, cardHeight) {
     
      //
      // The top must be adjusted based on the scroll position in order to provide us with the "absolute" top
      // value. (Without doing this, the "top" value only represents the top with regards to the viewport not
      // with regards to the very top of the virtual list's content area.)
      //
      top = this.state.scrollPosition + top;

      //
      // Now tell the controller to update the message's "metrics" data in the model.
      //
      this.props.updateMessageCardMetrics (cardIndex, top, cardHeight)
   }

   /**
    * The user swipe-deleted the card. We set the "state" of the vitual list to "deletingMessage" (so that
    * the "shouldComponentUpdate" will return true - and ReactJS will paint the UI - thus hiding the
    * deleted card). We pass the "delete message" event on up to the controller so that it updates the
    * model object (which contains the list of messages).
    *
    * @param {Number} index The index of the message that should be deleted.
    * @return undefined
    */
   handleDeleteMessage(index) {

      this.setState({
        deletingMessage:true    
      });

      //
      // Since the user swipe-deleted the card and it is offscreen, when ReactJS tries to "re use" this card
      // (which it does rather than deleting DOM notes), the contents of the card would be hidden (since it is)
      // offscreen). Therefore, what we do here is reset the card to a state so that it is again visible on the 
      // screen. (What will happen is that instantaneously the conten of the card will be changed to contain the
      // message that was just beneath the message just deleted.)
      //
      $('.mdl-card').removeClass('transitions');
      $('.mdl-card').css('transform', 'none'); 

     this.props.handleDeleteMessage(index);
   }


   /**
    * This is where we use the calculated "display list" to tell ReactJS what elements to display in the
    * browser's DOM.
    *
    * @return undefined
    */
   render() {

      //
      // Get the display list and other stuff. This was all calculated during new data arrival and 
      // virtual scrolling - and the decision was made based on these values whether or not we actually
      // had to re-render the UI. Only if any of these values changed do we re-render.
      //
      var {
         aboveFirstRenderedCardBufferHeight,
         firstRenderedCardIndex,
         lastRenderedCardIndex,
         belowLastRenderedCardBufferHeight,
      } = this.state.displayList || this.calculateDisplayList();

      //
      // Create the ReactJS components for each card that will be displayed in the DOM.
      //
      var cards = [];
      for (let index = firstRenderedCardIndex; index <= lastRenderedCardIndex; index++ ) {
         var message = this.props.messages[index];

         cards.push (
            <Card 
               key = {index}
               index = {index}
               cardIsInDom={this.cardIsInDom.bind(this)}
               handleSlideEnd={this.handleDeleteMessage.bind(this)}
               message = {message}/>
         );
      }

      //
      // This is what we return to ReactJS. It uses this to determine what to write to the DOM.
      //
      return (
        <div>
          <div className='cardsBeforeArea' style={{height:aboveFirstRenderedCardBufferHeight+"px"}}></div>
          {cards}
          <div className='cardsAfterArea' ref='cardsAfterArea' style={{height:belowLastRenderedCardBufferHeight+"px"}}></div>
        </div>
      )
   }
}

export default VirtualList;




