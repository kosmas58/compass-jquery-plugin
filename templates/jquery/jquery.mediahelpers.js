/*
* jQuery Media Helper Utilities from jQuery Mobile: resolution and CSS media query related helpers and behavior
* Copyright (c) jQuery Project, Scott Jehl, Filament Group, Inc
* Dual licensed under the MIT (MIT-LICENSE.txt) and GPL (GPL-LICENSE.txt) licenses.
* Exposed utilities:

	* orientationchange event from jQuery Mobile
		Handler automatically falls back to resize event in browsers that don't natively support it
		The event object contains an "orientation" property, which will equal either "portrait" or "landscape"
		Examples:
			$(window).bind('orientationchange', function(event){
				//alert( event.orientation );
			});
			
			
	* $.mh.media method: pass a CSS media type or query and get a bool return
		Note: this feature relies on actual media query support for media queries, though types will work most anywhere
		Examples:
			$.mh.media('screen') //>> tests for screen media type
			$.mh.media('screen and (min-width: 480px)') //>> tests for screen media type with window width > 480px
			$.mh.media('@media screen and (-webkit-min-device-pixel-ratio: 2)') //>> tests for webkit 2x pixel ratio (iPhone 4)
			
			
	* Cross-browser media-query width and orientation breakpoint classes
		This script automatically adds classes to the HTML element:
			- "portrait" or "landscape" for orientation
			- Min/Max width breakpoint classes for the following widths (by default):
				320px, 480px, 768px, 1024px
				
				...which translate to classes that correspond to media query sytnax:
				.min-width-480px, .max-width-1024px, etc
				
		You can add breakpoints by number or array, like so:
			$.mh.addResolutionBreakpoints( 500 );
			$.mh.addResolutionBreakpoints( [500, 1200] );		
			
*/ 
(function($, window, undefined ) {

var $win = $(window),
	$html = $( "html" ),
	doc = window.document,
	
	//media-query-like width breakpoints, which are translated to classes on the html element 
	resolutionBreakpoints = [320,480,768,1024];
	
	//mh namespace	
	$.mh = {};


/* $.mh.media method: pass a CSS media type or query and get a bool return
	note: this feature relies on actual media query support for media queries, though types will work most anywhere
	examples:
		$.mh.media('screen') //>> tests for screen media type
		$.mh.media('screen and (min-width: 480px)') //>> tests for screen media type with window width > 480px
		$.mh.media('@media screen and (-webkit-min-device-pixel-ratio: 2)') //>> tests for webkit 2x pixel ratio (iPhone 4)
*/
$.mh.media = (function() {
	// TODO: use window.matchMedia once at least one UA implements it
	var cache = {},
		testDiv = $( "<div id='jquery-mediatest'>" ),
		fakeBody = $( "<body>" ).append( testDiv );
	
	return function( query ) {
		if ( !( query in cache ) ) {
			var styleBlock = $( "<style type='text/css'>" +
				"@media " + query + "{#jquery-mediatest{position:absolute;}}" +
				"</style>" );
			$html.prepend( fakeBody ).prepend( styleBlock );
			cache[ query ] = testDiv.css( "position" ) === "absolute";
			fakeBody.add( styleBlock ).remove();
		}
		return cache[ query ];
	};
})();

/*
orientationchange event support from jQuery Mobile
 - falls back to resize in browsers that don't natively support the event
 - written by "Cowboy" Ben Alman and Scott Gonz‡lez
*/ 
var special_event,
	get_orientation,
	last_orientation;

$.event.special.orientationchange = special_event = {
	setup: function(){
		// If the event is supported natively, return false so that jQuery
		// will bind to the event using DOM methods.
		if ( "orientation" in window ) { return false; }
		
		// Get the current orientation to avoid initial double-triggering.
		last_orientation = get_orientation();
		
		// Because the orientationchange event doesn't exist, simulate the
		// event by testing window dimensions on resize.
		$win.bind( "resize", handler );
	},
	teardown: function(){
		// If the event is not supported natively, return false so that
		// jQuery will unbind the event using DOM methods.
		if ( $.support.orientation ) { return false; }
		
		// Because the orientationchange event doesn't exist, unbind the
		// resize event handler.
		$win.unbind( "resize", handler );
	},
	add: function( handleObj ) {
		// Save a reference to the bound event handler.
		var old_handler = handleObj.handler;
		
		handleObj.handler = function( event ) {
			// Modify event object, adding the .orientation property.
			event.orientation = get_orientation();
			
			// Call the originally-bound event handler and return its result.
			return old_handler.apply( this, arguments );
		};
	}
};

// If the event is not supported natively, this handler will be bound to
// the window resize event to simulate the orientationchange event.
function handler() {
	// Get the current orientation.
	var orientation = get_orientation();
	
	if ( orientation !== last_orientation ) {
		// The orientation has changed, so trigger the orientationchange event.
		last_orientation = orientation;
		$win.trigger( "orientationchange" );
	}
};

// Get the current page orientation. This method is exposed publicly, should it
// be needed, as jQuery.event.special.orientationchange.orientation()
special_event.orientation = get_orientation = function() {
	var elem = doc.documentElement;
	return elem && elem.clientWidth / elem.clientHeight < 1.1 ? "portrait" : "landscape";
};
	

/*
	private function for adding/removing breakpoint classes to HTML element for faux media-query support
	It does not require media query support, instead using JS to detect screen width > cross-browser support
	This function is called on orientationchange, resize, and mobileinit, and is bound via the 'htmlclass' event namespace
*/	
function detectResolutionBreakpoints(){
	var currWidth = $win.width(),
		minPrefix = "min-width-",
		maxPrefix = "max-width-",
		minBreakpoints = [],
		maxBreakpoints = [],
		unit = "px",
		breakpointClasses;
		
	$html.removeClass( minPrefix + resolutionBreakpoints.join(unit + " " + minPrefix) + unit + " " + 
		maxPrefix + resolutionBreakpoints.join( unit + " " + maxPrefix) + unit );
				
	$.each(resolutionBreakpoints,function( i, breakPoint ){
		if( currWidth >= breakPoint ){
			minBreakpoints.push( minPrefix + breakPoint + unit );
		}
		if( currWidth <= breakPoint ){
			maxBreakpoints.push( maxPrefix + breakPoint + unit );
		}
	});
	
	if( minBreakpoints.length ){ breakpointClasses = minBreakpoints.join(" "); }
	if( maxBreakpoints.length ){ breakpointClasses += " " +  maxBreakpoints.join(" "); }
	
	$html.addClass( breakpointClasses );	
};

/* $.mh.addResolutionBreakpoints method: */	
$.mh.addResolutionBreakpoints = function( newbps ){
	if( $.type( newbps ) === "array" ){
		resolutionBreakpoints = resolutionBreakpoints.concat( newbps );
	}
	else {
		resolutionBreakpoints.push( newbps );
	}
	resolutionBreakpoints.sort(function(a,b){ return a-b; })
	detectResolutionBreakpoints();
}


/* bind to orientationchange and resize  
to add classes to HTML element for min/max breakpoints and orientation */
$win.bind("orientationchange.htmlclass resize.htmlclass", function(event){
	//add orientation class to HTML element on flip/resize.
	if(event.orientation){
		$html.removeClass( "portrait landscape" ).addClass( event.orientation );
	}
	//add classes to HTML element for min/max breakpoints	
	detectResolutionBreakpoints();
});

//trigger event manually
$win.trigger( "orientationchange.htmlclass" );

})(jQuery, this );