/**
 * 
 * Add support for sliding horizontally and vertically using jQTouch in Safari Mobile
 *
 * Copyright (c) 2009 Sam Shull <http://www.google.com/profiles/brickysam26>
 * Released under MIT license
 *
 * <code>
 *
 *		<div id="vertical-sliding-example">
 *			<div class="toolbar">
 *				<h1>Vertical Slide Example</h1>
 *			</div>
 *			<div class="vertical-slide">
 *				<div>
 *					This is where you insert scollable text
 *				</div>
 *			</div>
 *		</div>
 *
 *		<div id="horizontal-sliding-example">
 *			<div class="toolbar">
 *				<h1>Horizontal Slide Example</h1>
 *			</div>
 *			<a href="#home" class="grayButton swap">Gotta have something here or you get a flicker</a>
 *			<div class="horizontal-slide">
 *				<table>
 *					<tr>
 *						<td><div class="slide-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="slide-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="slide-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="slide-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="slide-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="slide-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="slide-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *					</tr>
 *				</table>
 *			</div>
 *		</div>
 * </code>
 *
 * Known issues:
 *		- horizontal scroll flickers without a button above it
 *		- must define a class selector for slideSelector to operate properly within the slide box
 * 
 * $Revision$
 * $Date$
 * $LastChangedBy$
 * 
 */

(function($)
{
            
	$.fn.slideVertically = function (options)
	{
		return this.each(function ()
		{
			new iSlide( this, options );
		});
	};

	$.fn.slideHorizontally = function (options)
	{
		return this.each(function ()
		{
			new iSlideHorizontal( this, options );
		});
	};
	
    if ($.jQTouch)
    {
        $.jQTouch.addExtension(function (jQT){
			
			function binder (e, info)
			{
				var horizontal = info.page.find('.horizontal-slide > table'),
					vertical = info.page.find('.vertical-slide > div');
				
				horizontal.slideHorizontally({acceleration: Number(horizontal.attr("slidespeed")|| 500) || null});
				vertical.slideVertically({acceleration: Number(vertical.attr("slidespeed") || 500)});
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
		 * Modified version of
		 * http://cubiq.org/slideing-div-on-iphone-ipod-touch/5
		 *
		 * Copyright (c) 2009 Matteo Spinelli, http://cubiq.org/
		 * Released under MIT license
		 * http://cubiq.org/dropbox/mit-license.txt
		 * 
		 *
		 *	Modifications by Sam Shull <http://www.google.com/profiles/brickysam26>
 		 * Released under MIT license
		 */
		
		function iSlide(el, options)
		{
			var that = this;
			
			this.numberOfTouches = 1;
			
			this.acceleration = 500;
			
			this.element = el;
			this.position(0);
			this.refresh();
			el.style.webkitTransitionTimingFunction = 'cubic-bezier(0, 0, 0.2, 1)';
		
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
		
		iSlide.prototype = {
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
					this.maxSlide = 0;
				else		
					this.maxSlide = this.element.parentNode.clientHeight - this.element.offsetHeight;
			},
			
			onTouchStart: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
				
				e.preventDefault();
				this.refresh();
				
				var theTransform = window.getComputedStyle(this.element).webkitTransform;
				theTransform = new WebKitCSSMatrix(theTransform).m42;
				if( theTransform!=this.position() )
					this.position(theTransform);
				
				this.startY = e.targetTouches[0].clientY;
				this.slideStartY = this.position();
				this.slideStartTime = e.timeStamp;
				this.moved = false;
				
				this.element.addEventListener('touchmove', this, false);
				this.element.addEventListener('touchend', this, false);
		
				return false;
			},
			
			onTouchMove: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
				
				e.preventDefault();
				var topDelta = e.targetTouches[0].clientY - this.startY;
				if( this.position()>0 || this.position()<this.maxSlide ) topDelta/=2;
				this.position(this.position() + topDelta);
				this.startY = e.targetTouches[0].clientY;
				this.moved = true;
		
				return false;
			},
			
			onTouchEnd: function(e) {
				e.preventDefault();
				this.element.removeEventListener('touchmove', this, false);
				this.element.removeEventListener('touchend', this, false);
				
				var newPosition = this.position(),theTarget,theEvent,slideDistance;
				
				// If we are outside of the boundaries, let's go back to the sheepfold
				if( newPosition > 0 || newPosition < this.maxSlide ) {
					this.slideTo(newPosition > 0 ? 0 : this.maxSlide);
					return;
				}
		
				if( !this.moved ) {
					theTarget  = e.target;
					if(theTarget.nodeType == 3) theTarget = theTarget.parentNode;
					theEvent = document.createEvent("MouseEvents");
					theEvent.initEvent('click', true, true);
					theTarget.dispatchEvent(theEvent);
					return false
				}
					
				if (newPosition > 0)
				{
					slideDistance = 0;
				}
				else if ( newPosition < this.maxSlide )
				{
					slideDistance = this.maxSlide;
				}
				else
				{
					slideDistance = this.snapTo( this.position(), this.slideStartY < this.position());
				}
				
				this.slideTo( slideDistance, this.acceleration + 'ms');
				
					return;
			},
			
			onTransitionEnd: function() {
				this.element.removeEventListener('webkitTransitionEnd', this, false);
				this.slideTo( this.position() > 0 ? 0 : this.maxSlide );
			},
			
			slideTo: function(dest, runtime) {
				this.element.style.webkitTransitionDuration = runtime ? runtime : this.acceleration + 'ms';
				this.position(dest ? dest : 0);
		
				// If we are outside of the boundaries at the end of the transition go back to the sheepfold
				if( this.position() > 0 || this.position() < this.maxSlide )
					this.element.addEventListener('webkitTransitionEnd', this, false);
			},
			
			snapTo: function (dest, dir)
			{
				if (dest != 0)
				{
					var opposite = -dest,
						elements = this.element.querySelectorAll('.vertical-slide-snapto'),
						i = 0, 
						l = elements.length;
					
					for (l = elements.length; i < l; ++i)
					{
						//console.log('element['+i+']: '+ elements[i].offsetTop);
						if (elements[i].offsetTop >= opposite)
						{
							return !dir
									? -elements[i].offsetTop
									: -(elements[i-1]||elements[0]||{offsetTop:dest}).offsetTop;
						}
					}
				}
				
				return dest;
			}
		};
		
		/**
		 * 
		 * Modified version of
		 * http://cubiq.org/slideing-div-on-iphone-ipod-touch/5
		 *
		 * Copyright (c) 2009 Matteo Spinelli, http://cubiq.org/
		 * Released under MIT license
		 * http://cubiq.org/dropbox/mit-license.txt
		 * 
		 *
		 *	Modifications by Sam Shull <http://www.google.com/profiles/brickysam26>
 		 * Released under MIT license
		 */
		function iSlideHorizontal(el, options)
		{
			var that = this;
			
			this.numberOfTouches = 1;
			
			this.acceleration = 500;
			
			this.element = el;
			this.position(0);
			this.refresh();
			el.style.webkitTransitionTimingFunction = 'cubic-bezier(0, 0, 0.2, 1)';
			this.acceleration = null;
		
			el.addEventListener('touchstart', this, false);
			
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
		
		iSlideHorizontal.prototype = {
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
					this.element.style.webkitTransform = 'translateX(' + pos + 'px)';
					return;
				}
				
				return this._position;
			},
			
			refresh: function() {
				this.element.style.webkitTransitionDuration = '0';
				
				if( this.element.offsetWidth<this.element.parentNode.clientWidth )
					this.maxSlide = 0;
				else		
					this.maxSlide = this.element.parentNode.clientWidth - this.element.offsetWidth;
			},
			
			onTouchStart: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return false;
					
				e.preventDefault();
				this.refresh();
				
				this.slideStartX = this.startX = e.targetTouches[0].clientX;
				this.slideStartTime = e.timeStamp;
				this.moved = false;
				
				this.element.addEventListener('touchmove', this, false);
				this.element.addEventListener('touchend', this, false);
		
				return false;
			},
			
			onTouchMove: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return false;
					
				e.preventDefault();
				var topDelta = e.targetTouches[0].clientX - this.startX;
				this.position(this.position() + topDelta);
				this.startX = e.targetTouches[0].clientX;
				this.moved = true;
		
				return false;
			},
			
			onTouchEnd: function(e) {
				e.preventDefault();
				var newPosition,theTarget,theEvent,slideDistance,slideDuration,newDuration,newSlideDistance;
				
				this.element.removeEventListener('touchmove', this, false);
				this.element.removeEventListener('touchend', this, false);
				
				// If we are outside of the boundaries, let's go back to the sheepfold
				if( this.position() > 0 || this.position() < this.maxSlide ) {
					this.slideTo(this.position() > 0 ? 0 : this.maxSlide);
					return;
				}
		
				if( !this.moved ) {
					theTarget = e.target;
					if(theTarget.nodeType == 3) theTarget = theTarget.parentNode;
					theEvent = document.createEvent("MouseEvents");
					theEvent.initEvent('click', true, true);
					theTarget.dispatchEvent(theEvent);
					return false
				}
				
				newPosition = this.position() + ((this.startX - this.slideStartX) / 2);
				
				if (newPosition > 0)
				{
					newPosition = 0;
				}
				else if ( newPosition < this.maxSlide )
				{
					newPosition = this.maxSlide;
				}
				else
				{
					newPosition = this.snapTo( this.position(), newPosition > this.position());
				}
				
				this.slideTo( newPosition, this.acceleration + 'ms');
		
				return false;
			},
			
			onTransitionEnd: function() {
				this.element.removeEventListener('webkitTransitionEnd', this, false);
				this.slideTo( this.position()>0 ? 0 : this.maxScroll );
			},
			
			slideTo: function(dest, runtime) {
				this.element.style.webkitTransitionDuration = runtime ? runtime : this.acceleration + 'ms';
				this.position(dest ? dest : 0);
				
				if( this.position()>0 || this.position() < this.maxSlide )
					this.element.addEventListener('webkitTransitionEnd', this, false);
			},
			
			snapTo: function (dest, dir)
			{
				if (dest != 0)
				{
					//the children of the first row of the table - in case of nested tables
					var opposite = -dest, i = 0, 
						elements = this.element.querySelectorAll('.horizontal-slide-snapto'), 
						l = elements.length;
					
					for (; i < l; ++i)
					{
						if (elements[i].offsetLeft >= opposite)
						{
							return !dir
									? -elements[i].offsetLeft
									: -(elements[i-1]||elements[0]||{offsetLeft:dest}).offsetLeft;
						}
					}
				}
				
				return dest;
			}
		};
    }
})(jQuery);