/**
 * 
 * Add support for scaling using jQTouch
 *
 * Copyright (c) 2009 Sam Shull <http://www.google.com/profiles/brickysam26>
 * Released under MIT license
 *
 * <code>
 *
 *		<div>
 *			<img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome" class="scalable"/>
 *		</div>
 *
 * </code>
 *
 * Known issues:
 *		- using a link that is a slideSelector (ie: body > * > ul li a) on the same psuedo-page causes problems during scaling
 *
 * 
 * $Revision$
 * $Date$
 * $LastChangedBy$
 * 
 */

(function($)
{
            
	$.fn.scalable = function (options)
	{
		return this.each(function ()
		{
			new iScale( this, options );
		});
	};

	if ($.jQTouch)
    {
        $.jQTouch.addExtension(function (jQT){
			
			function binder (e, info)
			{
				info.page.find('.scalable').scalable();
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
		
		
		function iScale (el, options)
		{
			var that = this;
			
			this.numberOfTouches = 2;
			
			this.element = el;
			this.scale(1);
			this.refresh();
			
			this.scaleLessThanOne = false;
			
			el.style.webkitTransitionTimingFunction = 'cubic-bezier(0, 0, 0.2, 1)';
		
			el.addEventListener('touchstart', this, false);
			//moved up here because I didnt see any reason to add and remove them 
			el.addEventListener('touchmove', this, false);
			el.addEventListener('touchend', this, false);
			
			window.addEventListener('unload', function ()
			{
				el.removeEventListener('touchstart', that, false);
				el.removeEventListener('touchmove', that, false);
				el.removeEventListener('touchend', that, false);
				
				this.removeEventListener('unload', arguments.callee, false);
			}, false);
			
			if (options)
			{
				$.extend(this, options);	
			}
		}
		
		iScale.prototype = {
			handleEvent: function(e) {
				switch(e.type) {
					case 'touchstart': return this.onTouchStart(e); break;
					case 'touchmove': return this.onTouchMove(e); break;
					case 'touchend': return this.onTouchEnd(e); break;
				}
			},
			
			scale: function (scale) {
				if (scale !== undefined)
				{
					this._scale = scale;
					this.element.style.webkitTransform = 'scale('+scale+')';
					return;
				}
				
				return this._scale;
			},
			
			refresh: function() {
				this.element.style.webkitTransitionDuration = '0';
			},
			
			onTouchStart: function(e) {
				if ( e.targetTouches.length != this.numberOfTouches )
				{
					return;	
				}
				
				this.refresh();
				
				this.moved = false;
				
				this.startDistance = Math.sqrt(
											   	Math.pow((e.targetTouches[1].clientX - e.targetTouches[0].clientX), 2)
												+ Math.pow((e.targetTouches[1].clientX - e.targetTouches[0].clientX), 2)
											);
				
				return false;
			},
			
			onTouchMove: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
				
				e.preventDefault();
				
				this.moved = true;
				
				this.refresh();
				
				var newDistance = Math.sqrt(
											   	Math.pow((e.targetTouches[1].clientX - e.targetTouches[0].clientX), 2)
												+ Math.pow((e.targetTouches[1].clientY - e.targetTouches[0].clientY), 2)
											),
					difference = newDistance - this.startDistance,
					percentChange = (difference / this.startDistance) / 2;
				
				this.scale(this.scale() + (this.scale() * percentChange));
				
				this.startDistance = newDistance;
				
				return false;
			},
			
			onTouchEnd: function(e) {
				var theTarget,theEvent;
				
				if( !this.moved ) {
					theTarget  = e.target;
					if(theTarget.nodeType == 3) theTarget = theTarget.parentNode;
					theEvent = document.createEvent("MouseEvents");
					theEvent.initEvent('click', true, true);
					theTarget.dispatchEvent(theEvent);
					return;
				}
				
				e.preventDefault();
				e.stopPropagation();
				
				if (!this.scaleLessThanOne && this.scale() < 1)
				{
					this.element.style.webkitTransitionDuration = '200ms';
					this.scale(1);
				}
				
				return false;
			},
			
			scaleTo: function(dest, runtime) {
				this.element.style.webkitTransitionDuration = runtime ? runtime : '300ms';
				this.scale(dest ? dest : 0);
			}
		};
    }
})(jQuery);