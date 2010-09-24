/**
 * 
 * Add support for scrolling horizontally and vertically using jQTouch in Safari Mobile
 *
 * Copyright (c) 2009 Sam Shull <http://www.google.com/profiles/brickysam26>
 * Released under MIT license
 *
 * <code>
 *		<div id="vertical-scrolling-example">
 *			<div class="toolbar">
 *				<h1>Vertical Scroll Example</h1>
 *			</div>
 *			<div class="vertical-scroll">
 *				<div>
 *					This is where you insert scollable text
 *				</div>
 *			</div>
 *		</div>
 *
 *		<div id="horizontal-scrolling-example">
 *			<div class="toolbar">
 *				<h1>Horizontal Scroll Example</h1>
 *			</div>
 *			<div class="horizontal-scroll">
 *				<table>
 *					<tr>
 *						<td><div class="scroll-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="scroll-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="scroll-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="scroll-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="scroll-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="scroll-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="scroll-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *					</tr>
 *				</table>
 *			</div>
 *		</div>
 * </code>
 *
 * Known issues:
 *		- <strike>horizontal scroll flickers without a button above it</strike>
 *		- must define a class selector for slideSelector to operate properly within the slide box - depending on version
 *
 *	Changes:
 *		- Updated horizontal scroll to use translate3d instead of translateX
 *		- Added "preventdefault" attribute detection as a means for allowing the event to bubble.
 * 
 * $Revision$
 * $Date$
 * $LastChangedBy$
 * 
 */

(function($)
{
		  
    $.fn.scrollVertically = function (options)
	{
		return this.each(function ()
		{
			new iScroll( this, options );
		});
	};
	
	$.fn.scrollHorizontally = function (options)
	{
		return this.each(function ()
		{
			new iScrollHorizontal( this, options );
		});
	};

			
    if ($.jQTouch)
    {
        $.jQTouch.addExtension(function (jQT){
            
			function binder (e, info)
			{
				var horizontal = info.page.find('.horizontal-scroll > table'),
					vertical = info.page.find('.vertical-scroll > div');
				
				horizontal.scrollHorizontally({
					acceleration: Number(horizontal.attr("slidespeed")|| 500) || null,
					preventdefault: horizontal.attr("preventdefault") !== "false",
					startposition: Number(horizontal.attr("position")|| 0) || 0
				});
				vertical.scrollVertically({
					acceleration: Number(vertical.attr("slidespeed") || 500),
					preventdefault: vertical.attr("preventdefault") !== "false",
					startposition: Number(horizontal.attr("position")|| 0) || 0
				});
			}
			
			$(document.body)
				.bind('pageInserted', binder);
			
			$(function()
			{
				$('body > *')
					.each(function()
					{
						binder({}, {page: $(this)});
					});
			});
			
			return {};
        });
		
		/**
		 * 
		 * Find more about the scrolling function at
		 * http://cubiq.org/scrolling-div-on-iphone-ipod-touch/5
		 *
		 * Copyright (c) 2009 Matteo Spinelli, http://cubiq.org/
		 * Released under MIT license
		 * http://cubiq.org/dropbox/mit-license.txt
		 * 
		 * Version 2.3 - Last updated: 2009.07.09
		 * Changes - 10/22/09 - cleaned up a little by Sam Shull
		 * 
		 */
		
		function iScroll(el, options)
		{
			var that = this;
			
			this.numberOfTouches = 1;
			this.preventdefault = true;
			this.element = el;
			this.position(options.startposition || 0);
			this.refresh();
			el.style.webkitTransitionTimingFunction = 'cubic-bezier(0, 0, 0.2, 1)';
			this.acceleration = 0.009;
		
			el.addEventListener('touchstart', this, false);
			//moved up here because I didnt see any reason to add and remove them 
			
			window.addEventListener('unload', function ()
			{
				el.removeEventListener('touchstart', that, false);
				window.removeEventListener('unload', arguments.callee, false);
			}, false);
			
			if (options)
			{
				$.extend(this, options);	
			}
		}
		
		iScroll.prototype = {
			handleEvent: function(e) {
				switch(e.type) {
					case 'touchstart': this.onTouchStart(e); break;
					case 'touchmove': this.onTouchMove(e); break;
					case 'touchend': this.onTouchEnd(e); break;
					case 'webkitTransitionEnd': this.onTransitionEnd(e); break;
				}
			},
			
			//i combined the getter and setter in order to make this 
			//more forward compatible since that is a deprecated api
			position: function (pos) {
				if (pos !== undefined)
				{
					this._position = pos;
					this.element.style.webkitTransform = 'translate3d(0, ' + pos + 'px, 0)';
					return;
				}
				
				return this._position;
			},
			
			refresh: function() {
				this.element.style.webkitTransitionDuration = '0';
		
				if( this.element.offsetHeight<this.element.parentNode.clientHeight )
					this.maxScroll = 0;
				else		
					this.maxScroll = this.element.parentNode.clientHeight - this.element.offsetHeight;
			},
			
			onTouchStart: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
				
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				
				this.refresh();
				
				var theTransform = window.getComputedStyle(this.element).webkitTransform;
				theTransform = new WebKitCSSMatrix(theTransform).m42;
				if( theTransform!=this.position() )
					this.position(theTransform);
				
				this.startY = e.targetTouches[0].clientY;
				this.scrollStartY = this.position();
				this.scrollStartTime = e.timeStamp;
				this.moved = false;
				
				//moved
				this.element.addEventListener('touchmove', this, false);
				this.element.addEventListener('touchend', this, false);
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTouchMove: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
				
				
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				var topDelta = e.targetTouches[0].clientY - this.startY;
				if( this.position() > 0 || this.position() < this.maxScroll ) topDelta/=2;
				this.position(this.position() + topDelta);
				this.startY = e.targetTouches[0].clientY;
				this.moved = true;
		
				// Prevent slingshot effect
				if( e.timeStamp-this.scrollStartTime>100 ) {
					this.scrollStartY = this.position();
					this.scrollStartTime = e.timeStamp;
				}
		
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTouchEnd: function(e) {
				//moved
				this.element.removeEventListener('touchmove', this, false);
				this.element.removeEventListener('touchend', this, false);
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				var newPosition,theTarget,theEvent,scrollDistance,scrollDuration,newDuration,newScrollDistance;
		
				// If we are outside of the boundaries, let's go back to the sheepfold
				if( this.position() > 0 || this.position() < this.maxScroll ) {
					this.scrollTo(this.position() > 0 ? 0 : this.maxScroll);
					return;
				}
		
				if( !this.moved ) {
					theTarget  = e.target;
					if(theTarget.nodeType == 3) theTarget = theTarget.parentNode;
					theEvent = document.createEvent("MouseEvents");
					theEvent.initEvent('click', true, true);
					theTarget.dispatchEvent(theEvent);
					if (this.preventdefault)
					{
						return false;
					}
				}
		

				// Lame formula to calculate a fake deceleration
				scrollDistance = this.position() - this.scrollStartY;
				scrollDuration = e.timeStamp - this.scrollStartTime;
				
				newDuration = (2 * scrollDistance / scrollDuration) / this.acceleration;
				newScrollDistance = (this.acceleration / 2) * (newDuration * newDuration);
				
				if( newDuration<0 ) {
					newDuration = -newDuration;
					newScrollDistance = -newScrollDistance;
				}
		
				newPosition = this.position() + newScrollDistance;
				
				if( newPosition>this.element.parentNode.clientHeight/2 )
					newPosition = this.element.parentNode.clientHeight/2;
				else if( newPosition>0 )
					newPosition/= 1.5;
				else if( newPosition<this.maxScroll-this.element.parentNode.clientHeight/2 )
					newPosition = this.maxScroll-this.element.parentNode.clientHeight/2;
				else if( newPosition<this.maxScroll )
					newPosition = (newPosition - this.maxScroll) / 1.5 + this.maxScroll;
				else
					newDuration*= 6;
		
				this.scrollTo(newPosition, Math.round(newDuration) + 'ms');
				
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTransitionEnd: function() {
				this.element.removeEventListener('webkitTransitionEnd', this, false);
				
				this.scrollTo( this.position() > 0 ? 0 : this.maxScroll );
			},
			
			scrollTo: function(dest, runtime) {
				this.element.style.webkitTransitionDuration = runtime ? runtime : '300ms';
				this.position(dest ? dest : 0);
				
				// If we are outside of the boundaries at the end of the transition go back to the sheepfold
				if( this.position() > 0 || this.position() < this.maxScroll )
					this.element.addEventListener('webkitTransitionEnd', this, false);
			}
		};
		
		/**
		 * 
		 * A horizontal revision of iScroll by Matteo Spinelli, http://cubiq.org/
		 *
		 * Copyright (c) 2009 Sam Shull <http://www.google.com/profiles/brickysam26>
		 * Released under MIT license
		 * 
		 * Version 0.1
		 * 
		 */
		function iScrollHorizontal(el, options)
		{
			var that = this;
			
			this.numberOfTouches = 1;
			this.preventdefault = true;
			this.element = el;
			this.position(options.startposition || 0);
			this.refresh();
			el.style.webkitTransitionTimingFunction = 'cubic-bezier(0, 0, 0.2, 1)';
			this.acceleration = 0.009;
		
			el.addEventListener('touchstart', this, false);
			//moved up here because I didnt see any reason to add and remove them 
			
			window.addEventListener('unload', function ()
			{
				el.removeEventListener('touchstart', that, false);
				window.removeEventListener('unload', arguments.callee, false);
			}, false);
			
			if (options)
			{
				$.extend(this, options);	
			}
		}
		
		iScrollHorizontal.prototype = {
			handleEvent: function(e) {
				switch(e.type) {
					case 'touchstart': this.onTouchStart(e); break;
					case 'touchmove': this.onTouchMove(e); break;
					case 'touchend': this.onTouchEnd(e); break;
					case 'webkitTransitionEnd': this.onTransitionEnd(e); break;
				}
			},
			
			position: function (pos) {
				if (pos !== undefined)
				{
					this._position = pos;
					this.element.style.webkitTransform = 'translate3d(' + pos + 'px, 0, 0)';
					return;
				}
				
				return this._position;
			},
			
			refresh: function() {
				this.element.style.webkitTransitionDuration = '0';
		
				if( this.element.offsetWidth<this.element.parentNode.clientWidth )
					this.maxScroll = 0;
				else		
					this.maxScroll = this.element.parentNode.clientWidth - this.element.offsetWidth;
			},
			
			onTouchStart: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
					
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				
				this.refresh();
				
				this.startX = e.targetTouches[0].clientX;
				this.scrollStartX = this.position();
				this.scrollStartTime = e.timeStamp;
				this.moved = false;
				
				this.element.addEventListener('touchmove', this, false);
				this.element.addEventListener('touchend', this, false);
				
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTouchMove: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
				
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				var topDelta = e.targetTouches[0].clientX - this.startX;
				if( this.position()>0 || this.position()<this.maxScroll ) topDelta/=2;
				this.position(this.position() + topDelta);
				this.startX = e.targetTouches[0].clientX;
				this.moved = true;
		
				// Prevent slingshot effect
				if( e.timeStamp-this.scrollStartTime>100 ) {
					this.scrollStartX = this.position();
					this.scrollStartTime = e.timeStamp;
				}
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTouchEnd: function(e) {
				this.element.removeEventListener('touchmove', this, false);
				this.element.removeEventListener('touchend', this, false);
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				var newPosition,theTarget,theEvent,scrollDistance,scrollDuration,newDuration,newScrollDistance;
		
				if( !this.moved ) {
					theTarget  = e.target;
					if(theTarget.nodeType == 3) theTarget = theTarget.parentNode;
					theEvent = document.createEvent("MouseEvents");
					theEvent.initEvent('click', true, true);
					theTarget.dispatchEvent(theEvent);
					if (this.preventdefault)
					{
						return false;
					}
				}
		
				// Lame formula to calculate a fake deceleration
				scrollDistance = this.position() - this.scrollStartX;
				scrollDuration = e.timeStamp - this.scrollStartTime;
				
				newDuration = (2 * scrollDistance / scrollDuration) / this.acceleration;
				newScrollDistance = (this.acceleration / 2) * (newDuration * newDuration);
				
				if( newDuration<0 ) {
					newDuration = -newDuration;
					newScrollDistance = -newScrollDistance;
				}
		
				newPosition = this.position() + newScrollDistance;
				
				if( newPosition>this.element.parentNode.clientWidth/2 )
				{
					newPosition = this.element.parentNode.clientWidth/2;
				}
				else if( newPosition<this.maxScroll-this.element.parentNode.clientWidth/2 )
				{
					newPosition = this.maxScroll-this.element.parentNode.clientWidth/2;
				}
				else if( newPosition<this.maxScroll )
				{
					newPosition = (newPosition - this.maxScroll) / 1.5 + this.maxScroll;
				}
				else
				{
					newDuration*= 6;
				}
				
				this.scrollTo(newPosition, Math.round(newDuration) + 'ms');
		
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTransitionEnd: function() {
				this.element.removeEventListener('webkitTransitionEnd', this, false);
				this.scrollTo( this.position()>0 ? 0 : this.maxScroll );
			},
			
			scrollTo: function(dest, runtime) {
				this.element.style.webkitTransitionDuration = runtime ? runtime : '300ms';
				this.position(dest ? dest : 0);
		
				// If we are outside of the boundaries at the end of the transition go back to the sheepfold
				if( this.position()>0 || this.position()<this.maxScroll )
					this.element.addEventListener('webkitTransitionEnd', this, false);
			}
		};
    }
})(jQuery);