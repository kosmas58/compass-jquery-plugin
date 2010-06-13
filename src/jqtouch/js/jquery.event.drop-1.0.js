;(function($){ // secure $ jQuery alias
/*******************************************************************************************/	
// jquery.event.drop.js - rev 10
// Copyright (c) 2008, Three Dub Media (http://threedubmedia.com)
// Liscensed under the MIT License (MIT-LICENSE.txt)
// http://www.opensource.org/licenses/mit-license.php
// Created: 2008-06-04 | Updated: 2008-08-05
/*******************************************************************************************/
// Events: drop, dropstart, dropend
/*******************************************************************************************/

// JQUERY METHOD
$.fn.drop = function( fn1, fn2, fn3 ){
	if ( fn2 ) this.bind('dropstart', fn1 ); // 2+ args
	if ( fn3 ) this.bind('dropend', fn3 ); // 3 args
	return !fn1 ? this.trigger('drop') // 0 args
		: this.bind('drop', fn2 ? fn2 : fn1 ); // 1+ args
	};

// DROP MANAGEMENT UTILITY
$.dropManage = function( opts ){ // return filtered drop target elements, cache their positions
	$.extend( drop, { // set new options
		filter: '*', data: [], tolerance: null 
		}, opts||{} ); 
	return drop.$elements
		.filter( drop.filter )
		.each(function(i){ 
			drop.data[i] = drop.locate( this ); 
			});
	};

// SPECIAL EVENT CONFIGURATION
var drop = $.event.special.drop = {
	delay: 100, // default frequency to track drop targets
	mode: 'intersect', // default mode to determine valid drop targets 
	$elements: $([]), data: [], // storage of drop targets and locations
	setup: function(){
		drop.$elements = drop.$elements.add( this );
		drop.data[ drop.data.length ] = drop.locate( this );
		},
	teardown: function(){ var elem = this;
		drop.$elements = drop.$elements.not( this ); 
		drop.data = $.grep( drop.data, function( obj ){ 
			return ( obj.elem!==elem ); 
			});
		},
	// shared handler
	handler: function( event ){ 
		var dropstart = null, dropped;
		event.dropTarget = drop.dropping || undefined; // dropped element
		if ( drop.data.length && event.dragTarget ){ 
			// handle various events
			switch ( event.type ){
				// drag/mousemove, from $.event.special.drag
				case 'drag': // TOLERATE >>
					drop.event = event; // store the mousemove event
					if ( !drop.timer ) // monitor drop targets
						drop.timer = setTimeout( drop.tolerate, 20 ); 
					break;			
				// dragstop/mouseup, from $.event.special.drag
				case 'mouseup': // DROP >> DROPEND >>
					drop.timer = clearTimeout( drop.timer ); // delete timer	
					if ( !drop.dropping ) break; // stop, no drop
					if ( drop.allowed ){
						event.type = "drop"; // hijack event
						dropped = $.event.handle.call( drop.dropping, event ); // trigger "drop"
						}
					dropstart = false;
				// activate new target, from tolerate (async)
				case drop.dropping && 'dropstart': // DROPSTART >> ( new target )
					event.type = "dropend"; // hijack event
					dropstart = dropstart===null && drop.allowed ? true : false;
				// deactivate active target, from tolerate (async)
				case drop.dropping && 'dropend': // DROPEND >> 
					$.event.handle.call( drop.dropping, event ); // trigger "dropend"
					drop.dropping = null; // empty dropper
					if ( dropped === false ) event.dropTarget = undefined;
					if ( !dropstart ) break; // stop
					event.type = "dropstart"; // hijack event
				// activate target, from tolerate (async)
				case drop.allowed && 'dropstart': // DROPSTART >> 
					event.dropTarget = this;
					drop.dropping = $.event.handle.call( this, event )!==false ? this : null; 
					break;
				}
			}
		},
	// async, recursive tolerance execution
	tolerate: function(){ 
		var i = 0, drp, winner, // local variables 
		xy = [ drop.event.pageX, drop.event.pageY ], // mouse location
		drg = drop.locate( drop.event.dragProxy ); // drag proxy location
		drop.tolerance = drop.tolerance || drop.modes[ drop.mode ]; // custom or stored tolerance fn
		do if ( drp = drop.data[i] ){ // each drop target location
			if ( drop.tolerance ) // tolerance function is defined
				winner = drop.tolerance.call( drop, drop.event, drg, drp ); // execute
			else if ( drop.contains( drp, xy ) ) winner = drp; // mouse is always fallback
			} while ( ++i<drop.data.length && !winner ); // loop
		drop.event.type = ( winner = winner || drop.best ) ? 'dropstart' : 'dropend'; // start ? stop 
		if ( drop.event.type=='dropend' || winner.elem!=drop.dropping ) // don't dropstart on active drop target
			drop.handler.call( winner ? winner.elem : drop.dropping, drop.event ); // handle events
		if ( drop.last && xy[0] == drop.last.pageX && xy[1] == drop.last.pageY ) // no movement
			delete drop.timer; // idle, don't recurse
		else drop.timer = setTimeout( drop.tolerate, drop.delay ); // recurse
		drop.last = drop.event; // to compare idleness
		drop.best = null; // reset comparitors
		},	
	// returns the location positions of an element
	locate: function( elem ){ // return { L:left, R:right, T:top, B:bottom, H:height, W:width }
		var $el = $(elem), pos = $el.offset(), h = $el.outerHeight(), w = $el.outerWidth();
		return { elem: elem, L: pos.left, R: pos.left+w, T: pos.top, B: pos.top+h, W: w, H: h };
		},
	// test the location positions of an element against another OR an X,Y coord
	contains: function( target, test ){ // target { L,R,T,B,H,W } contains test [x,y] or { L,R,T,B,H,W }
		return ( ( test[0] || test.L ) >= target.L && ( test[0] || test.R ) <= target.R 
			&& ( test[1] || test.T ) >= target.T && ( test[1] || test.B ) <= target.B ); 
		},
	// stored tolerance modes
	modes: { // fn scope: "$.event.special.drop" object 
		// target with mouse wins, else target with most overlap wins
		'intersect': function( event, proxy, target ){
			return this.contains( target, [ event.pageX, event.pageY ] ) ? // check cursor
				target : this.modes['overlap'].apply( this, arguments ); // check overlap
			},
		// target with most overlap wins	
		'overlap': function( event, proxy, target ){
			// calculate the area of overlap...
			target.overlap = Math.max( 0, Math.min( target.B, proxy.B ) - Math.max( target.T, proxy.T ) )
				* Math.max( 0, Math.min( target.R, proxy.R ) - Math.max( target.L, proxy.L ) );
			if ( target.overlap > ( ( this.best || {} ).overlap || 0 ) ) // compare overlap
				this.best = target; // set as the best match so far
			return null; // no winner
			},
		// proxy is completely contained within target bounds	
		'fit': function( event, proxy, target ){
			return this.contains( target, proxy ) ? target : null;
			},
		// center of the proxy is contained within target bounds	
		'middle': function( event, proxy, target ){
			return this.contains( target, [ proxy.L+proxy.W/2, proxy.T+proxy.H/2 ] ) ? target : null;
			}
		} 	 
	};
	
/*******************************************************************************************/
})(jQuery); // confine scope