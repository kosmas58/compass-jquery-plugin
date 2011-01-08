/**
 * JQTouch DynamicHeight Extension
 * 
 * Purpose: This extension arose out of the need to have a dynamic min-height setting
 * rather than relying on the static min-height settings in the jqtouch.css file. This
 * allows for greater cross-browser compatability when aligning items to the bottom
 * of a page or on background elements.
 * 
 * Use: This extension adds a function called resetHeight() to JQTouch that should be called
 * when the page loads, whenever new ajax content is added, and when orientation is changed.
 * <code>
$(function(){
	// reset our heights on page load
	jQT.resetHeight();
});
 * </code>
 * @author Tim Golen tim@golen.net http://www.golen.net/blog/2010/05/07/jqtouch-anyheight-extension/
 * @version 1.0
 * @version 1.1
 * 	- added an optional parameter to resetHeight() for a hard minimum to be set for the height
 * for example if you never ever wanted the screen to be less than 420 pixels high.
 */
(function($) {
	if ($.jQTouch) {
		$.jQTouch.addExtension(function Counter(jQTouch){
			
			// gets the height of the browser and sets the min heights accordingly
			function resetHeight(minHeight){
				//alert(minHeight);
				if (minHeight == null) minHeight = 0;
				var height = getHeight(minHeight);
				$('body > *').css('min-height', height + 'px !important');
				$('body.fullscreen > *').css('min-height', height + 'px !important');
				$('body.fullscreen.black-translucent > *').css('min-height', height + 'px !important');
				$('body.landscape > *').css('min-height', height + 'px !important');
			}
			
			// returns the height of the browser
			function getHeight(minHeight) {
				var myHeight = 0;
				if( typeof( window.innerWidth ) == 'number' ) {
					//Non-IE
					myHeight = window.innerHeight;
				} else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
					//IE 6+ in 'standards compliant mode'
					myHeight = document.documentElement.clientHeight;
				} else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
					//IE 4 compatible
					myHeight = document.body.clientHeight;
				}
				if (myHeight < minHeight) myHeight = minHeight;
				return myHeight;
			}
			
			return {
				resetHeight: resetHeight
			}
		});
	}
})(jQuery);