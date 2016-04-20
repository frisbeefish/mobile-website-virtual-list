/**
 * @fileoverview This is a ReactJS component that displays a single message in a single "card." All the messages
 * that are currently loaded into the browser (mobile browser, etc.) will be showin in a vertical list of
 * cards.
 */

'use strict';


import React from 'react';
import $ from 'jquery';
import moment from 'moment';


/**
 * This class manages is the card. NOTE borrowed from here to detect swipes from touch 
 * events: http://www.javascriptkit.com/javatutors/touchevents3.shtml
 *
 * @param {Object} props Any properties passed into this ReactJS object. The props passed in are:
 * <ul>
 * <li>index - the 0-based index position of this card within the entire list of cards in the UI</li>
 * <li>message - a message (data) to show in this card</li>
 * <li>handleSlideEnd - a "callback" (hosted by the "index main view component") that is called when a card has been "swiped to the right" off of the screen.</li>
 * </ul>
 * @constructor
 * @extends {React.Component}
 */
class Card extends React.Component {

   constructor(props) {
      super(props);
      this.dir = null;
      this.threshold = 100; //required min distance traveled to be considered swipe
      this.restraint = 100; // maximum distance allowed at the same time in perpendicular direction
      this.allowedTime = 500; // maximum time allowed to travel that distance
   }

   /**
    * This is called when the user does a "swipe right." When the user does a swipe, they want to
    * delete the message. This function will run a CSS animation to smoothly animate the card
    * off the screen to the right. Once the animation has finished, this will call the
    * "handleSlideEnd" callback that was passed in to the card when it was created. That callback will
    * tell the ReactJS component that manages the entire list of cards to smoothly animate "up" all of the
    * cards below the one that was swiped away - so that they will fill in the gap left by the
    * card that was swiped away.
    * @return undefined
    */
   swipeAndDelete() {

      this.didASwipe = true;

      /**
       * This event handler is invoked once the CSS animation (that slides the card off the screen
       * to the right) completes. 
       * @return undefined
       */
      var handleSlideEnd = () => {

         if (!React.findDOMNode(this.refs.card)) {
            alert('Error, no DOM node for react component in swipeAndDelete.handleSlideEnded');
            return;
         } 

         //
         // Remove this event handler from the card.
         //
         React.findDOMNode(this.refs.card).removeEventListener('transitionend', handleSlideEnd, false);

         //
         // Tell the component that manages the entire list to animate "up" all of the cards below the
         // one that was just swiped off the screen. (NOTE: Once that "animate up" finishes, the component
         // that manages the list will tell the overall application controller to delete the swiped-away
         // message from the application's "model.")
         //
         this.props.handleSlideEnd(this.props.index, this.cardHeight + 30,React.findDOMNode(this.refs.card));
      }


      //
      // Add the "handle slide ended" event handler to the card. This will cause the event handler
      // to be called once the CSS "animate off the screen to the right" animation has ended.
      //
      React.findDOMNode(this.refs.card).addEventListener('transitionend', handleSlideEnd, false);

      //
      // Remember the height of this card. We will be sending this to the component that manages the list of cards.
      //
      this.cardHeight = $(React.findDOMNode(this.refs.card)).height();

      //
      // Calculate how far to the right we need to animate the card in order for it to be completely off screen.
      //
      var cardWidthPlusPadding = $(React.findDOMNode(this.refs.card)).width() + 20;

      //
      // Add the CSS styles that specify the duration and easing for the CSS animation.
      //
      $(React.findDOMNode(this.refs.card)).addClass('transitions');

      //
      // Animate the card off the screen to the right using a CSS animation.
      //
      $(React.findDOMNode(this.refs.card)).css('transform', `translateX(${cardWidthPlusPadding}px)`);
   }


   /**
    * This event handler is called after the "slide back into place" CSS animation has completed.
    * @param {DOM.Event} e This is a browser DOM event representing a completed CSS animation.
    * @return undefined
    */
   handleCardSlidBackIntoPlace(e) {

      //
      // If mysteriously this event handler was called but after the ReactJS lifecycle's "componentWillUnmount"
      // method was called (a very unlikely event that would probably not happen), then we no longer need
      // to remove the event lister, so bail.
      //
      if (!this.slideBackIntoPlaceCallback) {
         return;
      }

      //
      // Remove this event handler from the card.
      //
      React.findDOMNode(this.refs.card).removeEventListener('transitionend', this.slideBackIntoPlaceCallback, false);
      $(React.findDOMNode(this.refs.card)).removeClass('fasttransitions');

      this.slideBackIntoPlaceCallback = null;
   }


   /////////////////////////////////////////////////////////
   //
   // ReactJS "lifecycle" callbacks. ReactJS calls these during various times within the lifecycle of
   // the virtual list ReactJS component.
   //
   /////////////////////////////////////////////////////////


   /**
    * This is called by ReactJS after it has added this component to the browser's DOM. Now that the
    * component is in the DOM, it has a "top" position and a height. This code will report those metrics back
    * to the virtual list (which will report them back to the app controller and model). These metrics are used
    * by the virtual list to do its magic.
    *
    * @return undefined
    */
   componentDidMount() {
      var cardHeight = $(React.findDOMNode(this.refs.card)).height();
      var top = $(React.findDOMNode(this.refs.card)).offset().top;
      this.props.cardIsInDom(this.props.index, top,cardHeight);
   }


   /**
    * This is called by the ReactJS plumbing each time (after the first time) that this "div" (and its contents) 
    * is updated/re-rendered to the web page.
    * @return undefined
    */
   componentDidUpdate(prevProps, prevState) {
      var cardHeight = $(React.findDOMNode(this.refs.card)).height();
      var top = $(React.findDOMNode(this.refs.card)).offset().top;
      this.props.cardIsInDom(this.props.index, this.props.message,top,cardHeight);
   }


   /**
    * This is called by ReactJS when it is removing a component from the DOM. This is our last chance to
    * clean up any outstanding memory allocations related to the DOM element.
    *
    * @return undefined
    */
   componentWillUnmount() {

      //
      // We do this magicalness because there are times when the code picks up a "swipe" but by the
      // time the card slings back into place, the card has been removed from the DOM by ReactJS or has
      // been reused. So we have to make "handleCardSlidBackIntoPlace" an external function and provide
      // this card object with a "slideBackIntoPlaceCallback" property so that if needed, we can
      // do a "removeEventListener" call from the "componentWillUnmount" call - just to make sure we
      // disconnect the event listener and clean up memory. (If we don't do that and we run into some
      // race condition, we can get a card being removed but the event listener is still connected to
      // the card so memory leaks - since the card can't really be relinquised to the memory gods.)
      //
      if (this.slideBackIntoPlaceCallback) {
         React.findDOMNode(this.refs.card).removeEventListener('transitionend', this.slideBackIntoPlaceCallback, false);
         $(React.findDOMNode(this.refs.card)).removeClass("fasttransitions");
         this.slideBackIntoPlaceCallback = null;
      }
   }


   /////////////////////////////////////////////////////////
   //
   // "Event Handlers" (callbacks) invoked when the user does various actions.
   //
   /////////////////////////////////////////////////////////

   /**
    * This event handler is called when the user places their finger down on the mobile device and starts to
    * possibly swipe. Keep track of where and when the user placed their finger down.
    * @param {React.SyntheticEvent} e This is the ReactJS "synthetic" touch event.
    * @return undefined
    */
   handleTouchStart(e) {

      var touchobj = e.nativeEvent.changedTouches[0];

      this.dir = 'none';
      this.swipeType = 'none';
      this.dist = 0;
      this.startX = touchobj.pageX;
      this.startY = touchobj.pageY;
      this.startTime = new Date().getTime();

      this.didASwipe = false;
   }


   /**
    * This event handler is called when the user moves their finger as it is touching the screen of the mobile
    * device. Keep track of where and when the user moves their finger.
    * @param {React.SyntheticEvent} e This is the ReactJS "synthetic" touch event.
    * @return undefined
    */
   handleTouchMove(e) {

      if (this.didASwipe) {
         return;
      }

      var touchobj = e.nativeEvent.changedTouches[0];

      //
      // Get horizontal dist traveled by finger while in contact with surface.
      //
      this.distX = touchobj.pageX - this.startX;

      //
      // Get vertical dist traveled by finger while in contact with surface.
      //
      this.distY = touchobj.pageY - this.startY;

      //
      // If distance traveled horizontally is greater than vertically, consider this a horizontal movement
      //
      if (Math.abs(this.distX) > Math.abs(this.distY)) {
         this.dir = (this.distX < 0) ? 'left' : 'right';
      }

      //
      // Else consider this a vertical movement
      //
      else {
         this.dir = (this.distY < 0) ? 'up' : 'down';
      }

      //
      // Move the card left/right as the user tries to swipe/delete the message.
      //
      if ( (this.dir === 'left' || this.dir === 'right') && Math.abs(this.distY) < 20) {
         var cardSlideDistanceX = Math.max(0,this.distX);
         $(React.findDOMNode(this.refs.card)).css('transform', `translateX(${cardSlideDistanceX}px) translateZ(0)`);
      }
   }


   /**
    * The user lifted their finger off the device after swiping. We determine here whether or not to complete the
    * "swipe and delete" action or to slide the card back into place - since the user didn't swipe far enough to
    * the right.
    * @param {React.SyntheticEvent} e This is the ReactJS "synthetic" touch event.
    * @return undefined
    */
   handleTouchEnd(e) {

      //
      // Get time elapsed since the user first put their finger down on the mobile device's screen.
      //
      this.elapsedTime = new Date().getTime() - this.startTime;

      //
      // OK, the first condition for a swipe was met - the user did a nice, quick swipe.
      //
      if (this.elapsedTime <= this.allowedTime) { 

         //
         // OK, 2nd condition for horizontal swipe met - the movement in the X direction and Y direction
         // make this a swipe.
         //

         //
         // Set swipeType to either "left" or "right."
         //
         if (Math.abs(this.distX) >= this.threshold && Math.abs(this.distY) <= this.restraint) { 
            this.swipeType = this.dir;

         //
         // Set swipeType to either "top" or "down."
         //
         } else if (Math.abs(this.distY) >= this.threshold && Math.abs(this.distX) <= this.restraint) { 
            this.swipeType = this.dir;
         }

         if (this.swipeType === 'right') { 
            this.swipeAndDelete();
         }
      }

      //
      // If the user didn't do a swipe-and-delete, we'll "snap the card back" into position here.
      //
      if (!this.didASwipe) {
        $(React.findDOMNode(this.refs.card)).addClass('fasttransitions');

        //
        // We do this magicalness because there are times when the code picks up a "swipe" but by the
        // time the card slings back into place, the card has been removed from the DOM by ReactJS or has
        // been reused. So we have to make "handleCardSlidBackIntoPlace" an external function and provide
        // this card object with a "slideBackIntoPlaceCallback" property so that if needed, we can
        // do a "removeEventListener" call from the "componentWillUnmount" call - just to make sure we
        // disconnect the event listener and clean up memory. (If we don't do that and we run into some
        // race condition, we can get a card being removed but the event listener is still connected to
        // the card so memory leaks - since the card can't really be relinquised to the memory gods.)
        //
        this.slideBackIntoPlaceCallback = this.handleCardSlidBackIntoPlace.bind(this);

        //
        // Add the "handle slide ended" event handler to the card. This will cause the event handler
        // to be called once the CSS animation bringing the card back to translateX(0px) is done.
        //
        React.findDOMNode(this.refs.card).addEventListener('transitionend', this.slideBackIntoPlaceCallback, false);

        $(React.findDOMNode(this.refs.card)).css('transform', `translateX(0px)`);
      }
   }



   /**
    * This method is called when the main list controller wants to render this card to the screen.
    *
    * @return undefined
    */
   render() {

      //
      // The date and time of the post. These show up underneath the title of the post.
      //
      var time = moment(this.props.message.updated).format('h:mm a');
      var dayAndDate = moment(this.props.message.updated).format('ddd, MMM Do YYYY')

      //
      // If the message is "deleted," we still create a card/div for that message, but it is set to
      // display NONE. This is because if we didn't do that, when the user deletes a message (and it was
      // removed from the model's "messages" list), ReactJS would reuse card divs already on the screen. And
      // If a originally containing one author's avatar was repurposed to show a different message by a different
      // author, then there would be a short flash in iOS as one avatar image was replaced with another. This only
      // happend during swipe-deleting a message. But the UX was terrible. So I changed the logic to not delete
      // the message but instead mark it as "deleted," and now React doesn't shift the contents of all the div cards
      // by one when a message is deleted, and now no longer do we get a flash of the avatar images during a swipe
      // delete in iOS.
      //
      // Oh, put more simply, just set card divs for deleted messages to "display:none." It is still in the DOM
      // tree of the browser but just doesn't show in the UI.
      //
      var hiddenCssClass = this.props.message.deleted ? ' hidden ' : '';

      return (
         <div ref = 'card' className = {'demo-card-wide mdl-card mdl-shadow--2dp ' + hiddenCssClass}

            onTouchStart = {this.handleTouchStart.bind(this)}
            onTouchMove = {this.handleTouchMove.bind(this)}
            onTouchEnd = {this.handleTouchEnd.bind(this)} >

            <div className = 'mdl-card__title' >
               <img src = {'http://message-list.appspot.com' + this.props.message.author.photoUrl} />
               <div className='nameAndTime'>
                  <div className='name'>
                     <h4>{this.props.message.author.name}</h4> 
                  </div>
                  <div className='time'>
                  <span>{dayAndDate + ' at ' + time}</span>
                  </div>
               
               </div>
            </div> 
            <div className = 'mdl-card__supporting-text' > {this.props.message.content} </div> 
         </div>
      )
   }
}


export default Card;

