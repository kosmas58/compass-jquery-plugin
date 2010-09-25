
/*
	The MIT License
	Copyright (c) 2010 Wojciech Bednarski, http://wojciechbednarski.com

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
*/

(function($) {
	if($.jQTouch) {
		
		$.jQTouch.addExtension(function TTouch(jQTouch) {
			
			var scrollers = {};
			
			$('.scroll').each(function(scroller) {
				scrollers[scroller] = new TouchScroll(this, {elastic: true});
			});
			
			function doMagic() {
				$('#jqt').bind('pageAnimationEnd', function() {
					$('div.current .scroll > div').addClass('m').removeClass('m'); // quick hack so far...
				});
			}
			
			return doMagic();
		});
		
	}
	
	$(document).ready(function() {
		$('#tabbar li a').bind('click touchend', function() {
			$('#tabbar li a').removeClass('current');
			$(this).addClass('current');
		});
	});
})(jQuery);


/**
 * @license
 *
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
 * Copyright (C) 2010 David Aurelio. All Rights Reserved.
 * Copyright (C) 2010 uxebu Consulting Ltd. & Co. KG. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC., DAVID AURELIO, AND UXEBU
 * CONSULTING LTD. & CO. KG ``AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL APPLE INC. OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Represents a two-dimensional cubic bezier curve with the starting
 * point (0, 0) and the end point (1, 1). The two control points p1 and p2
 * have x and y coordinates between 0 and 1.
 *
 * This type of bezier curves can be used as CSS transform timing functions.
 */
function CubicBezier(p1x, p1y, p2x, p2y){
    if (!(p1x >= 0 && p1x <= 1)) {
        throw new RangeError("'p1x' must be a number between 0 and 1. "
                               + "Got " + p1x + "instead.");
    }
    if (!(p1y >= 0 && p1y <= 1)) {
        throw new RangeError("'p1y' must be a number between 0 and 1. "
                               + "Got " + p1y + "instead.");
    }
    if (!(p2x >= 0 && p2x <= 1)) {
        throw new RangeError("'p2x' must be a number between 0 and 1. "
                               + "Got " + p2x + "instead.");
    }
    if (!(p2y >= 0 && p2y <= 1)) {
        throw new RangeError("'p2y' must be a number between 0 and 1. "
                               + "Got " + p2y + "instead.");
    }

    // Control points
    this._p1 = { x: p1x, y: p1y };
    this._p2 = { x: p2x, y: p2y };
}

CubicBezier.prototype._getCoordinateForT = function(t, p1, p2){
    var c = 3 * p1,
        b = 3 * (p2 - p1) - c,
        a = 1 - c - b;

    return ((a * t + b) * t + c) * t;
};

CubicBezier.prototype._getCoordinateDerivateForT = function(t, p1, p2){
    var c = 3 * p1,
        b = 3 * (p2 - p1) - c,
        a = 1 - c - b;

    return (3 * a * t + 2 * b) * t + c;
};

CubicBezier.prototype._getTForCoordinate = function(c, p1, p2, epsilon){
    if (!isFinite(epsilon) || epsilon <= 0) {
        throw new RangeError("'epsilon' must be a number greater than 0.");
    }

    // First try a few iterations of Newton's method -- normally very fast.
    for (var t2 = c, i = 0, c2, d2; i < 8; i++) {
        c2 = this._getCoordinateForT(t2, p1, p2) - c;
        if (Math.abs(c2) < epsilon){
            return t2;
        }
        d2 = this._getCoordinateDerivateForT(t2, p1, p2);
        if (Math.abs(d2) < 1e-6){
            break;
        }
        t2 = t2 - c2 / d2;
    }

    // Fall back to the bisection method for reliability.
    t2 = c;
    var t0 = 0,
        t1 = 1,
        c2;

    if (t2 < t0){
        return t0;
    }
    if (t2 > t1){
        return t1;
    }

    while (t0 < t1) {
        c2 = this._getCoordinateForT(t2, p1, p2);
        if (Math.abs(c2 - c) < epsilon){
            return t2;
        }
        if (c > c2){
            t0 = t2;
        }
        else{
            t1 = t2;
        }
        t2 = (t1 - t0) * .5 + t0;
    }

    // Failure.
    return t2;
};

/**
 * Computes the point for a given t value.
 *
 * @param {number} t
 * @returns {Object} Returns an object with x and y properties
 */
CubicBezier.prototype.getPointForT = function(t) {
    // Special cases: starting and ending points
    if (t == 0 || t == 1) {
        return { x: t, y: t };
    }
    // check for correct t value (must be between 0 and 1)
    else if (!(t > 0) || !(t < 1)) {
        throw new RangeError("'t' must be a number between 0 and 1"
                             + "Got " + t + " instead.");
    }

    return {
        x: this._getCoordinateForT(t, this._p1.x, this._p2.x),
        y: this._getCoordinateForT(t, this._p1.y, this._p2.y)
    }
};

CubicBezier.prototype.getTforX = function(x, epsilon){
    return this._getTForCoordinate(x, this._p1.x, this._p2.x, epsilon);
};

CubicBezier.prototype.getTforY = function(y, epsilon){
    return this._getTForCoordinate(y, this._p1.y, this._p2.y, epsilon);
};

/**
 * Computes auxiliary points using De Casteljau's algorithm.
 *
 * @param {number} t must be greater than 0 and lower than 1.
 * @returns {Object} with members i0, i1, i2 (first iteration),
 *     j1, j2 (second iteration) and k (the exact point for t)
 */
CubicBezier.prototype._getAuxPoints = function(t){
    if (!(t > 0) || !(t < 1)) {
        throw new RangeError("'t' must be greater than 0 and lower than 1");
    }

    // First series of auxiliary points
    var i0 = { // first control point of the left curve
            x: t * this._p1.x,
            y: t * this._p1.y
        },
        i1 = {
            x: this._p1.x + t*(this._p2.x - this._p1.x),
            y: this._p1.y + t*(this._p2.x - this._p1.y)
        },
        i2  = { // second control point of the right curve
            x: this._p2.x + t*(1 - this._p2.x),
            y: this._p2.y + t*(1 - this._p2.y)
        };

    // Second series of auxiliary points
    var j0 = { // second control point of the left curve
            x: i0.x + t*(i1.x - i0.x),
            y: i0.y + t*(i1.y - i0.y)
        },
        j1 = { // first control point of the right curve
            x: i1.x + t*(i2.x - i1.x),
            y: i1.y + t*(i2.y - i1.y)
        };

    // The division point (ending point of left curve, starting point of right curve)
    var k = {
            x: j0.x + t*(j1.x - j0.x),
            y: j0.y + t*(j1.y - j0.y)
        };

    return {
        i0: i0,
        i1: i1,
        i2: i2,
        j0: j0,
        j1: j1,
        k: k
    }
};

/**
 * Divides the bezier curve into two bezier functions.
 *
 * De Casteljau's algorithm is used to compute the new starting, ending, and
 * control points.
 *
 * @param {number} t must be greater than 0 and lower than 1.
 *     t == 1 or t == 0 are the starting/ending points of the curve, so no
 *     division is needed.
 *
 * @returns {CubicBezier[]} Returns an array containing two bezier curves
 *     to the left and the right of t.
 */
CubicBezier.prototype.divideAtT = function(t){
    if (t < 0 || t > 1) {
        throw new RangeError("'t' must be a number between 0 and 1. "
                             + "Got " + t + " instead.");
    }

    // Special cases t = 0, t = 1: Curve can be cloned for one side, the other
    // side is a linear curve (with duration 0)
    if (t === 0 || t === 1){
        var curves = [];
        curves[t] = CubicBezier.linear();
        curves[1-t] = this.clone();
        return curves;
    }

    var left = {},
        right = {},
        points = this._getAuxPoints(t);

    var i0 = points.i0,
        i1 = points.i1,
        i2 = points.i2,
        j0 = points.j0,
        j1 = points.j1,
        k = points.k;

    // Normalize derived points, so that the new curves starting/ending point
    // coordinates are (0, 0) respectively (1, 1)
    var factorX = k.x,
        factorY = k.y;

    left.p1 = {
        x: i0.x / factorX,
        y: i0.y / factorY
    };
    left.p2 = {
        x: j0.x / factorX,
        y: j0.y / factorY
    };

    right.p1 = {
        x: (j1.x - factorX) / (1 - factorX),
        y: (j1.y - factorY) / (1 - factorY)
    };

    right.p2 = {
        x: (i2.x - factorX) / (1 - factorX),
        y: (i2.y - factorY) / (1 - factorY)
    };

    return [
        new CubicBezier(left.p1.x, left.p1.y, left.p2.x, left.p2.y),
        new CubicBezier(right.p1.x, right.p1.y, right.p2.x, right.p2.y)
    ];
};

CubicBezier.prototype.divideAtX = function(x, epsilon) {
    if (x < 0 || x > 1) {
        throw new RangeError("'x' must be a number between 0 and 1. "
                             + "Got " + x + " instead.");
    }

    var t = this.getTforX(x, epsilon);
    return this.divideAtT(t);
};

CubicBezier.prototype.divideAtY = function(y, epsilon) {
    if (y < 0 || y > 1) {
        throw new RangeError("'y' must be a number between 0 and 1. "
                             + "Got " + y + " instead.");
    }

    var t = this.getTforY(y, epsilon);
    return this.divideAtT(t);
};

CubicBezier.prototype.clone = function() {
    return new CubicBezier(this._p1.x, this._p1.y, this._p2.x, this._p2.y);
};

CubicBezier.prototype.toString = function(){
    return "cubic-bezier(" + [
        this._p1.x,
        this._p1.y,
        this._p2.x,
        this._p2.y
    ].join(", ") + ")";
};

CubicBezier.linear = function(){
    return new CubicBezier
};

CubicBezier.ease = function(){
    return new CubicBezier(0.25, 0.1, 0.25, 1.0);
};
CubicBezier.linear = function(){
    return new CubicBezier(0.0, 0.0, 1.0, 1.0);
};
CubicBezier.easeIn = function(){
    return new CubicBezier(0.42, 0, 1.0, 1.0);
};
CubicBezier.easeOut = function(){
    return new CubicBezier(0, 0, 0.58, 1.0);
};
CubicBezier.easeInOut = function(){
    return new CubicBezier(0.42, 0, 0.58, 1.0);
};





// Modified by Wojciech Bednarski, orginally by David Aurelio rev from May 05, 2010 - http://github.com/davidaurelio/TouchScroll/tree/master/src/
// 
// Search for @wbednarski to find difference

/**
	@license

	Copyright (c) 2010 uxebu Consulting Ltd. & Co. KG
	Copyright (c) 2010 David Aurelio
	All rights reserved.

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met:

	1. Redistributions of source code must retain the above copyright
	   notice, this list of conditions and the following disclaimer.
	2. Redistributions in binary form must reproduce the above copyright
	   notice, this list of conditions and the following disclaimer in the
	   documentation and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
	LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
	CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
	SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
	INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
	CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
	ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
	POSSIBILITY OF SUCH DAMAGE.
*/
var TouchScroll = (function(){
	//
	//	SCROLLER CONFIGURATION
	//
	var config = {
		// the minimum move distance to trigger scrolling (in pixels)
		threshold: 5,

		// minimum scroll handle size
		scrollHandleMinSize: 25,

		// flicking detection and configuration
		flicking: {
			// longest duration between last touchmove and the touchend event to trigger flicking
			triggerThreshold: 150,

			// the friction factor (per milisecond).
			// This factor is used to precalculate the flick length. Lower numbers
			// make flicks decelerate earlier.
			friction: 0.998,

			// minimum speed needed before the animation stop (px/ms)
			// This value is used to precalculate the flick length. Larger numbers
			// lead to shorter flicking lengths and durations
			minSpeed: 0.15,

			// the timing function for flicking animinations (control points for a cubic bezier curve)
			timingFunc: [0, 0.3, 0.6, 1]
		},

		// bouncing configuration
		elasticity: {
			// factor for the bounce length while dragging
			factorDrag: 0.5,

			// factor for the bounce length while flicking
			factorFlick: 0.2,

			// maximum bounce (in px) when flicking
			max: 100
		},

		// snap back configuration
		snapBack: {
			// the timing function for snap back animations (control points for a cubic bezier curve)
			// when bouncing out before, the first control point is overwritten to achieve a smooth
			// transition between bounce and snapback.
			timingFunc: [0.4, 0, 1, 1],

			// default snap back time
			defaultTime: 400,

			// whether the snap back effect always uses the default time or
			// uses the bounce out time.
			alwaysDefaultTime: true
		}
	};

	//
	//	FEATURE DETECTION
	//
	/* Determine touch events support */
	var hasTouchSupport = (function(){
		if("createTouch" in document){ // True on the iPhone
			return true;
		}
		try{
			var event = document.createEvent("TouchEvent"); // Should throw an error if not supported
			return !!event.initTouchEvent; // Check for existance of initialization method
		}catch(error){
			return false;
		}
	}());

	/*
		In some older versions of Android, WebKitCSSMatrix is broken and does
		not parse a "matrix" directive properly.
	*/
	var parsesMatrixCorrectly = (function(){
		var m = new WebKitCSSMatrix("matrix(1, 0, 0, 1, -20, -30)");
		return m.e == -20 && m.f == -30;
	}());

	//
	// FEATURE BASED CODE BRANCHING
	//

	/* Define event names */
	var events;
	if(hasTouchSupport){
		events = {
			start: "touchstart",
			move: "touchmove",
			end: "touchend",
			cancel: "touchcancel"
		};
	}else{
		events = {
			start: "mousedown",
			move: "mousemove",
			end: "mouseup",
			cancel: "touchcancel" // unnecessary here
		};
	}

	var getMatrixFromNode;
	if(parsesMatrixCorrectly){
		getMatrixFromNode = function(/*HTMLElement*/node){ /*WebKitCSSMatrix*/
			var doc = node.ownerDocument,
				transform = window.getComputedStyle(node).webkitTransform;

			return new WebKitCSSMatrix(transform);
		}
	}else{
		var reMatrix = /matrix\(\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/;
		getMatrixFromNode = function(/*HTMLElement*/node){ /*WebKitCSSMatrix*/
			var doc = node.ownerDocument,
				transform = window.getComputedStyle(node).webkitTransform,
				matrix = new WebKitCSSMatrix(),
				match = reMatrix.exec(transform);

			if(match){
				matrix.e = match[1];
				matrix.f = match[2];
			}

			return matrix;
		}
	}

	//
	// UTILITY FUNCTIONS
	//
	function setTransitionProperty(/*HTMLElement*/node){
		node.style.webkitTransformStyle = "preserve-3d";
		node.style.webkitTransitionProperty = "-webkit-transform";
	};

	function applyMatrixToNode(/*HTMLElement*/node,
	                           /*WebKitCSSMatrix*/matrix,
	                           /*String?*/duration,
	                           /*String?*/timingFunc){
		var s = node.style;
		if(duration != null){
			s.webkitTransitionDuration = duration + "";
		}
		if(timingFunc != null){
			s.webkitTransitionTimingFunction = timingFunc + "";
		}

		// This is twice as fast as than directly assigning the matrix
		// to the style property (maybe because no function call is involved?).
		node.style.webkitTransform = "translate(" + matrix.e + "px, " + matrix.f + "px)";
	}

	function getMatrixFromEvent(event){ /*WebKitCSSMatrix*/
		if(event.touches && event.touches.length){
			event = event.touches[0];
		}

		var matrix = new WebKitCSSMatrix;
		matrix.e = event.pageX;
		matrix.f = event.pageY;

		return matrix;
	};

	function roundMatrix(/*WebKitCSSMatrix*/matrix){ /*WebKitCSSMatrix*/
		matrix.e = Math.round(matrix.e);
		matrix.f = Math.round(matrix.f);
		return matrix;
	}

	// A DOM node to clone for scrollbars
	var scrollbarsTemplate = document.createElement("div");
	scrollbarsTemplate.innerHTML = [
		'<div class="touchScrollTrack touchScrollTrackX">',
			'<div class="touchScrollHandle"></div>',
		'</div>',
		'<div class="touchScrollTrack touchScrollTrackY">',
			'<div class="touchScrollHandle"></div>',
		'</div>'
	].join("");

/*
	=== TOUCH CONTROLLER ======================================================
	Does the actual work.

	The event handling is divided into two parts:
	The scroller constructor tracks "move", "end", and "cancel" events and
	delegates them to the currently active scroller, if any.

	Every single scroller only listens for the "start" event on its outer node,
	and sets itself as the currently active scroller.
*/

/*
	Every object with a "handleEvent" method can be registered as DOM Level 2
	event listener. On event, the method is called on the registered object.
*/
TouchScroll.handleEvent = function handleEvent(event){
	var currentScroller = this.prototype.currentScroller;
	if(currentScroller){
		currentScroller.handleEvent(event);
	}else if(event.type === events.move){ // always cancel move events at this point
		event.preventDefault();
	}
};

/*
	Listening to end, move, and cancel event.
	Event listening takesplace during bubbling, so other scripts can cancel
	scrolling by simply stopping event propagation.
*/


document.addEventListener(events.move, TouchScroll, false);
document.addEventListener(events.end, TouchScroll, false);
document.addEventListener(events.cancel, TouchScroll, false);

/**
	Constructor for scrollers.

	@constructor
	@param {HTMLElement} scrollElement The node to make scrollable
	@param {Object} [options] Options for the scroller- Known options are
		elastic {Boolean} whether the scroller bounces
*/
function TouchScroll(/*HTMLElement*/scrollElement, /*Object*/options){
	options = options || {};
	this.elastic = !!options.elastic,

	// references to scroll div elements
	this.scrollers = {
		container: scrollElement,
		outer: /*HTMLElement*/null,
		inner: /*HTMLElement*/null,
		e: /*HTMLElement*/null,
		f: /*HTMLElement*/null
	};

	// Whether the scroller scrolls
	this._scrolls = {e: false, f: false};

	// The minimal scroll values (fully scrolled to the bottom/right)
	// Object with attributes "e" and "f"
	this._scrollMin = {e: false, f: false};

	// References DOM nodes for scrollbar tracks and handles.
	// Gets set up by "_initDom"
	//	{
	//		container: HTMLElement,
	//		handles:{e: HTMLElement, f: HTMLElement},
	//		maxOffsets: {e: Number, f: Number}, -> maximum offsets for the handles
	//		offsetRatios: {e: Number, f: Number}, -> Ratio of scroller offset to handle offset
	//		sizes: {e: Number, f: Number}, -> handle sizes
	//		tracks: {e: HTMLElement, f: HTMLElement},
	//	}
	this._scrollbars = null,


	/* ---- SCROLLER STATE ---- */

	this._isScrolling = false;

	this._startEvent = null;

	// the current scroller offset
	this._currentOffset = new WebKitCSSMatrix();

	// Events tracked during a move action
	// [ {timeStamp: Number, matrix: WebKitCSSMatrix} ]
	// The last two events get tracked.
	this._trackedEvents = /*Array*/null;

	// Keeps track whether flicking is active
	this._flicking = {e: false, f: false};

	// Queued bounces
	this._bounces = {e: null, f: null};

	// Animation timeouts
	// This implementation uses timeouts for combined animations,
	// because the webkitTransitionEnd event fires late on iPhone 3G
	this._animationTimeouts = {e: [], f: []};

	this._initDom();
	this.setupScroller();
}

TouchScroll.prototype = {
	// references the currently active scroller
	// static property!
	currentScroller: null,

	// Maps event types to method names.
	handlerNames: {
		resize: "setupScroller",
		orientationchange: "setupScroller",
		webkitTransitionEnd: "onTransitionEnd",
		DOMSubtreeModified: "setupScroller",

		touchstart: "onTouchStart",
		mousedown: "onTouchStart",
		touchmove: "onTouchMove",
		mousemove: "onTouchMove",
		touchend: "onTouchEnd",
		mouseup: "onTouchEnd",
		touchcancel: "onTouchEnd"
	},

	// Does DOM initialization needed for the scroller
	_initDom: function initDom(){
		// wrap the scroller contents with two additional <div> elements
		var innerScroller = document.createElement("div"),
			outerScroller = innerScroller.cloneNode(false),
			parentNode = this.scrollers.container;

		innerScroller.className = "touchScrollInner";
		parentNode.className += " touchScroll";

		for(var i = 0, iMax = parentNode.childNodes.length; i < iMax; i++){
			innerScroller.appendChild(parentNode.firstChild);
		}

		outerScroller.appendChild(innerScroller);
		parentNode.appendChild(outerScroller);

		this.scrollers.outer = this.scrollers.f = outerScroller;
		this.scrollers.inner = this.scrollers.e = innerScroller;

		// init scroll layers for transitions
		setTransitionProperty(outerScroller);
		setTransitionProperty(innerScroller);

		innerScroller.style.display = "inline-block";
		innerScroller.style.minWidth = "100%";
		innerScroller.style.webkitBoxSizing = "border-box";

		// add scrollbars
		var scrollbarsNode = scrollbarsTemplate.cloneNode(true),
			trackE = scrollbarsNode.querySelector(".touchScrollTrackX"),
			trackF = scrollbarsNode.querySelector(".touchScrollTrackY"),
			handleE = trackE.firstElementChild,
			handleF = trackF.firstElementChild;


		var style = scrollbarsNode.style;
		style.pointerEvents = "none"; // make clicks/touches on scrollbars "fall through"
		style.webkitTransitionProperty = "opacity";
		style.webkitTransitionDuration = "250ms";
		style.opacity = "0";

		var scrollbars = this._scrollbars = {
			container: scrollbarsNode,
			tracks: {
				e: trackE,
				f: trackF
			},
			handles: {
				e: handleE,
				f: handleF
			},
			sizes : {e: 0, f: 0}
		}

		setTransitionProperty(handleE);
		setTransitionProperty(handleF);

		parentNode.insertBefore(scrollbarsNode, outerScroller);

		/*
			Apply relative positioning to the scrolling container.
			This is needed to enable scrollbar positioning.
		*/
		if(window.getComputedStyle(parentNode).position == "static"){
			parentNode.style.position = "relative";
		}

		this.setupScroller();

		// initialize event listeners
		parentNode.addEventListener(events.start, this, false);
		outerScroller.addEventListener("webkitTransitionEnd", this, false);
		outerScroller.addEventListener("DOMSubtreeModified", this, true);
		window.addEventListener("orientationchange", this, false);
		window.addEventListener("resize", this, false);
	},

	setupScroller: function setupScroller(debug){
		var scrollContainer = this.scrollers.outer.parentNode,
			containerSize = {
				e: scrollContainer.offsetWidth,
				f: scrollContainer.offsetHeight
			},
			innerScroller = this.scrollers.inner,
			scrollerSize = {
				e: innerScroller.offsetWidth,
				f: innerScroller.offsetHeight
			},
			scrollbars = this._scrollbars,
			scrollMin = {
				e: Math.min(containerSize.e - scrollerSize.e, 0),
				f: Math.min(containerSize.f - scrollerSize.f, 0)
			};

		scrollbars.container.style.height = containerSize.f + "px";

		// Minimum scroll offsets
		this._scrollMin = scrollMin;
		var scrolls = this._scrolls = {
			e: scrollMin.e < 0,
			f: scrollMin.f < 0
		};

		this._doScroll = scrolls.e || scrolls.f;

		// scrollbar container class name changes if both scrollbars are visible
		scrollbars.container.className = "touchScrollBars";
		if(scrolls.e && scrolls.f){
			scrollbars.container.className += " touchScrollBarsBoth";
		}

		// hide/show scrollbars
		scrollbars.tracks.e.style.display = scrolls.e ? "" : "none";
		scrollbars.tracks.f.style.display = scrolls.f ? "" : "none";

		var scrollbarTrackSizes = {
				e: scrollbars.tracks.e.offsetWidth,
				f: scrollbars.tracks.f.offsetHeight
			};

		// calculate and apply scroll bar handle sizes
		scrollbars.sizes = {
			e: Math.round(Math.max(
				scrollbarTrackSizes.e * containerSize.e / scrollerSize.e,
				config.scrollHandleMinSize
			)),
			f: Math.round(Math.max(
				scrollbarTrackSizes.f * containerSize.f / scrollerSize.f,
				config.scrollHandleMinSize
			))
		};
		scrollbars.handles.e.style.width = scrollbars.sizes.e + "px";
		scrollbars.handles.f.style.height = scrollbars.sizes.f + "px";

		// maximum scrollbar offsets
		scrollbars.maxOffsets = {
			e: scrollbarTrackSizes.e - scrollbars.handles.e.offsetWidth,
			f: scrollbarTrackSizes.f - scrollbars.handles.f.offsetHeight
		};

		// calculate offset ratios
		// (scroller.offset * offsetratio = scrollhandle.offset)
		scrollbars.offsetRatios = {
			e: scrolls.e ? (scrollbarTrackSizes.e - scrollbars.handles.e.offsetWidth) / scrollMin.e : 0,
			f: scrolls.f ? (scrollbarTrackSizes.f - scrollbars.handles.f.offsetHeight) / scrollMin.f : 0
		};
	},

	// Standard DOM Level 2 event handler
	handleEvent: function handleEvent(event){
		var handlerName = this.handlerNames[event.type];
		if(handlerName){
			this[handlerName](event);
		}
	},

	// Handles touch start events on the scroller
	onTouchStart: function onTouchStart(event){
		if(!this._doScroll){
			return;
		}
		this.__proto__.currentScroller = this;
		this._isScrolling = false;
		this._trackedEvents = [];
		this._determineOffset();
		this._trackEvent(event);
		this._startEventTarget = event.target; // We track this to work around a bug in android, see below
		var wasAnimating = this._stopAnimations();

		this._startEvent = event;
		
		// @wbednarski
		// let it bubbling, so JQTouch can do stuff
		// event.stopPropagation();

		/*
			If the scroller was animating, prevent the default action of the event.
			This prevents clickable elements to be activated accidentally.

			Also, we need to cancel the touchstart event to prevent android from
			queuing up move events and fire them only when the touch ends.
		*/
		//if(wasAnimating){
			event.preventDefault();
		//}

	},

	// Handles touch move events on the scroller
	onTouchMove: function onTouchMove(event){
		if(!this._doScroll){
			return;
		}

		// must be present, because touchstart fired before
		var lastEventOffset = this._trackedEvents[1].matrix,
			scrollOffset = getMatrixFromEvent(event).translate(
				-lastEventOffset.e,
				-lastEventOffset.f,
				0
			),
			isScrolling = this._isScrolling,
			doScroll = isScrolling;

		event.stopPropagation();
		event.preventDefault();

		if(!doScroll){
			var threshold = config.threshold,
			doScroll = scrollOffset.e <= -threshold || scrollOffset.e >= threshold ||
			           scrollOffset.f <= -threshold || scrollOffset.f >= threshold;
		}

		if(doScroll){
			if(!isScrolling){
				this._isScrolling = true;
				this.showScrollbars();
			}

			this._scrollBy(scrollOffset);
			this._trackEvent(event);
		}

	},

	onTouchEnd: function onTouchEnd(event){
		var startTarget = this._startEventTarget;

		if(!this._isScrolling && startTarget == event.target){
		/*
			If no scroll has been made, the touchend event should trigger
			a focus and a click (if occurring on the same node as the
			touchstart event).
			Unfortunately, we've canceled the touchstart event to work around
			a bug in android -- so we need to dispatch our own focus and
			click events.
		*/


			var node = event.target;
			while(node.nodeType != 1){
				node = node.parentNode;
			}
			var focusEvent = document.createEvent("HTMLEvents");
			focusEvent.initEvent("focus", false, false);
			node.dispatchEvent(focusEvent);
			//node.focus();

			var clickEvent = document.createEvent("MouseEvent");
			clickEvent.initMouseEvent(
				"click", //type
				true, //canBubble
				true, //cancelable
				event.view,
				1, //detail (number of clicks for mouse events)
				event.screenX,
				event.screenY,
				event.clientX,
				event.clientY,
				event.ctrlKey,
				event.altKey,
				event.shiftKey,
				event.metaKey,
				event.button,
				null// relatedTarget
			);
			node.dispatchEvent(clickEvent);
		}else if(this._isScrolling){
			var moveSpec = this._getLastMove();
			if(moveSpec.duration <= config.flicking.triggerThreshold && moveSpec.length){
			/*
				If the time between the touchend event and the last tracked
				event is below threshold, we are triggering a flick.
			*/
				var flickDuration = this._getFlickingDuration(moveSpec.speed),
					flickLength = this._getFlickingLength(moveSpec.speed, flickDuration),
					flickVector = moveSpec.matrix,
					factor = flickLength / moveSpec.length;

				flickVector.e *= factor;
				flickVector.f *= factor;

				this.startFlick(flickVector, flickDuration);
			}
		}

		if(!(this.isAnimating())){
			var snappingBack = this._snapBack();
			if(!snappingBack){
				this.hideScrollbars();
			}
		}
		delete this._startEventTarget;
		this._isScrolling = false;
		this.__proto__.currentScroller = null;
	},

	onTransitionEnd: function onTransitionEnd(event){
		["e", "f"].forEach(function(axis){
			if(event.target === this.scrollers[axis]){
				this._flicking[axis] = false;
			}
		}, this);

		if(!this.isAnimating()){
			this.hideScrollbars();
		}
	},

	isAnimating: function isAnimating(){
		var timeouts = this._animationTimeouts;
		var hasTimeouts = timeouts.e.length > 0 || timeouts.f.length > 0;
		var isFlicking = this._flicking.e || this._flicking.f;
		return hasTimeouts || isFlicking;
	},

	scrollBy: function scrollBy(/*Number*/x, /*Number*/y){
		this._stopAnimations();

		var matrix = new WebKitCSSMatrix();
		matrix.e = -x;
		matrix.f = -y;
		return this._scrollBy(matrix);
	},

	scrollTo: function scrollTo(x, y){
		this._stopAnimations();

		var scrollMin = this._scrollMin;
		var m = new WebKitCSSMatrix();
		m.e = Math.min(0, Math.max(scrollMin.e, -x));
		m.f = Math.min(0, Math.max(scrollMin.f, -y));

		var currentOffset = this._currentOffset;
		m.e -= currentOffset.e;
		m.f -= currentOffset.f;

		return this._scrollBy(m);
	},

	center: function center(){
		var x = -Math.round(this._scrollMin.e/2);
		var y = -Math.round(this._scrollMin.f/2);
		return this.scrollTo(x, y);
	},

	// Scrolls the layer by applying a transform matrix to it.
	//
	// As this method is called for every touchmove event, the code is rolled
	// out for both axes (leading to redundancies) to get maximum performance.
	_scrollBy: function _scrollBy(/*WebKitCSSMatrix*/matrix){
		var scrolls = this._scrolls;
		if(!scrolls.e){
			matrix.e = 0;
		}
		if(!scrolls.f){
			matrix.f = 0;
		}

		var scrollMin = this._scrollMin,
			currentOffset = this._currentOffset,
			newOffset = currentOffset.multiply(matrix),
			isOutOfBounds = {e: false, f: false}, // whether the new position is out of the scroller bounds
			scrollbarSizeSubstract = {e: 0, f: 0};

		if(this.elastic){
			var factor = config.elasticity.factorDrag,
				wasOutOfBounds = { // whether the scroller was already beyond scroll bounds
					e: currentOffset.e < scrollMin.e || currentOffset.e > 0,
					f: currentOffset.f < scrollMin.f || currentOffset.f > 0
				};

			if(wasOutOfBounds.e){
				// if out of scroll bounds, apply the elasticity factor
				newOffset.e -= matrix.e * (1 - factor);
			}
			if(wasOutOfBounds.f){
				newOffset.f -= matrix.f * (1 - factor);
			}

			if(newOffset.e < scrollMin.e || newOffset.e > 0){
				isOutOfBounds.e = true;
				scrollbarSizeSubstract.e = newOffset.e >= 0 ?
				                           newOffset.e : scrollMin.e - newOffset.e;
			}
			if(newOffset.f < scrollMin.f || newOffset.f > 0){
				isOutOfBounds.f = true;
				scrollbarSizeSubstract.f = newOffset.f >= 0 ?
				                           newOffset.f : scrollMin.f - newOffset.f;
			}

			var crossingBounds = { // whether the drag/scroll action went across scroller bounds
					e: (!wasOutOfBounds.e || !isOutOfBounds.e) && (isOutOfBounds.e || isOutOfBounds.e),
					f: (!wasOutOfBounds.f || !isOutOfBounds.f) && (isOutOfBounds.f || isOutOfBounds.f)
				};


			if(crossingBounds.e){
				/*
					If the drag went across scroll bounds, we need to apply a
					"mixed strategy": The part of the drag outside the bounds
					is mutliplicated by the elasticity factor.
				*/
				if(currentOffset.e > 0){
					newOffset.e /= factor;
				}else if(newOffset.e > 0){
					newOffset.e *= factor;
				}else if(currentOffset.e < scrollMin.e){
					newOffset.e += (scrollMin.e - currentOffset.e) / factor;
				}else if(newOffset.e < scrollMin.e){
					newOffset.e -= (scrollMin.e - newOffset.e) * factor;
				}
			}

			if(crossingBounds.f){
				if(currentOffset.f > 0){
					newOffset.f /= factor;
				}else if(newOffset.f > 0){
					newOffset.f *= factor;
				}else if(currentOffset.f < scrollMin.f){
					newOffset.f += (scrollMin.f - currentOffset.f) / factor;
				}else if(newOffset.f < scrollMin.f){
					newOffset.f -= (scrollMin.f - newOffset.f) * factor;
				}
			}
		}else{
			// Constrain scrolling to scroller bounds
			if(newOffset.e < scrollMin.e){
				newOffset.e = scrollMin.e;
			}else if(newOffset.e > 0){
				newOffset.e = 0;
			}

			if(newOffset.f < scrollMin.f){
				newOffset.f = scrollMin.f;
			}else if(newOffset.f > 0){
				newOffset.f = 0;
			}
		}

		this._currentOffset = newOffset;

		var offsetX = newOffset.translate(0, 0, 0),
			offsetY = newOffset.translate(0, 0, 0);

		offsetX.f = offsetY.e = 0;

		applyMatrixToNode(this.scrollers.e, offsetX);
		applyMatrixToNode(this.scrollers.f, offsetY);

		// scrollbar position
		var ratios = this._scrollbars.offsetRatios;
		offsetX.e *= ratios.e;
		offsetY.f *= ratios.f;

		if(isOutOfBounds.e){
			this._squeezeScrollbar("e", scrollbarSizeSubstract.e, newOffset.e < 0);
		}else{
			applyMatrixToNode(this._scrollbars.handles.e, offsetX);
		}
		if(isOutOfBounds.f){
			this._squeezeScrollbar("f", scrollbarSizeSubstract.f, newOffset.f < 0);
		}else{
			applyMatrixToNode(this._scrollbars.handles.f, offsetY);
		}
	},

	// Tracks all properties needed for scrolling
	// We're tracking only the last two events for the moment
	_trackEvent: function _trackEvent(event){
		var trackedEvents = this._trackedEvents;
		trackedEvents[0] = trackedEvents[1];
		trackedEvents[1] = {
			matrix: getMatrixFromEvent(event),
			timeStamp: event.timeStamp
		};
	},

	showScrollbars: function showScrollbars(){
		var style = this._scrollbars.container.style;
		style.webkitTransitionDuration = "";
		style.opacity = "1";
	},

	hideScrollbars: function hideScrollbars(){
		var style = this._scrollbars.container.style;
		style.webkitTransitionDuration = "250ms";
		style.opacity = "0";
	},

	_squeezeScrollbar: function _squeezeScrollbar(axis, substract, squeezeAtEnd, duration, timingFunc){
		var scrollbars = this._scrollbars;
		var handleStyle = scrollbars.handles[axis].style;

		var defaultSize = scrollbars.sizes[axis];
		var size = Math.max(defaultSize - substract, 1);

		var matrix = new WebKitCSSMatrix();
		matrix[axis] = squeezeAtEnd ? scrollbars.maxOffsets[axis] : 0;
		matrix[axis == "f" ? "d" : "a"] = size / defaultSize;

		handleStyle.webkitTransformOrigin = squeezeAtEnd ? "100% 100%" : "0 0";
		handleStyle.webkitTransitionProperty = "-webkit-transform";
		handleStyle.webkitTransform = matrix;

		if(duration){
			handleStyle.webkitTransitionDuration = duration + "ms";
			handleStyle.webkitTransitionTimingFunction = timingFunc;
			this._animationTimeouts[axis].push(setTimeout(function(){
				handleStyle.webkitTransitionDuration = "";
			}, duration));
		}else{
			handleStyle.webkitTransitionDuration = "";
		}
	},

	_determineOffset: function _determineOffset(round){
		var offsetX = getMatrixFromNode(this.scrollers.e),
			offsetY = getMatrixFromNode(this.scrollers.f),
			currentOffset = offsetX.multiply(offsetY);

		if(round){
			roundMatrix(currentOffset);
		}

		this._currentOffset = currentOffset;
	},

	_stopAnimations: function _stopAnimations(){ /*Boolean*/
		var isAnimating = false;
		var scrollbars = this._scrollbars;
		["e", "f"].forEach(function(axis){
			this.scrollers[axis].style.webkitTransitionDuration = "";
			var handle = scrollbars.handles[axis];
			handle.style.webkitTransitionDuration = "";
			setTransitionProperty(handle);
			scrollbars.tracks[axis].style.webkitBoxPack = "";


			var timeouts = this._animationTimeouts[axis];
			isAnimating = isAnimating || timeouts.length;
			timeouts.forEach(function(timeoutId){
				clearTimeout(timeoutId);
			});
			timeouts.length = 0;
		}, this);

		// if animating, we stop animations by determining the current
		// offset (rounding its values) and then setting those values
		// to the scroller by calling "scrollBy"
		this._determineOffset(true);
		this._scrollBy(new WebKitCSSMatrix());

		// deleting queued bounces
		this._bounces.e = this._bounces.f = null;

		return isAnimating;
	},

	_getLastMove: function _getLastMove(){
		var trackedEvents = this._trackedEvents,
			event0 = trackedEvents[0],
			event1 = trackedEvents[1];

		if(!event0){
			return {duration: 0, matrix: new WebKitCSSMatrix(), length: 0, speed: 0};
		}

		var duration = event1.timeStamp - event0.timeStamp,
			matrix = event1.matrix.multiply(event0.matrix.inverse()),
			length = Math.sqrt(matrix.e * matrix.e + matrix.f * matrix.f);

		return {
			duration: duration, // move duration in miliseconds
			matrix: matrix, // matrix of the move
			length: length, // length of the move in pixels
			speed: length / duration // speed of the move in miliseconds
		}
	},

	// returns flicking duration in miliseconds for a given speed
	_getFlickingDuration: function _getFlickingDuration(pixelsPerMilisecond){
		/*
			The duration is computed as follows:

			variables:
				m = minimum speed before stopping = config.flicking.minSpeed
				d = duration
				s = speed = pixelsPerMilisecond
				f = friction per milisecond = config.flicking.friction

			The minimum speed is computed as follows:
					m = s * f ^ d

				// as the minimum speed is given and we need the duration we
				// can solve the equation for d:
			<=> 	d = log(m/s) / log(f)
		*/
		var duration =	Math.log(
							config.flicking.minSpeed /
							pixelsPerMilisecond
						) /
						Math.log(config.flicking.friction);

		return duration > 0 ? Math.round(duration) : 0;
	},

	_getFlickingLength: function _getFlickingLength(initialSpeed, flickDuration){
		/*
			The amount of pixels to flick is the sum of the distance covered every
			milisecond of the flicking duration.

			Because the distance is decelerated by the friction factor, the speed
			at a given time t is:

				pixelsPerMilisecond * friction^t

			and the distance covered is:

				d = distance
				s = initial speed = pixelsPerMilisecond
				t = time = duration
				f = friction per milisecond = config.flicking.friction

				d = sum of s * f^n for n between 0 and t
			<=>	d = s * (sum of f^n for n between 0 and t)

			which is a geometric series and thus can be simplified to:
				d = s *  (1 - f^(d+1)) / (1 - f)
		*/
		var factor = (1 - Math.pow(config.flicking.friction, flickDuration + 1)) / (1 - config.flicking.friction);
		return initialSpeed * factor;
	},

	startFlick: function startFlick(matrix, duration){
		if(!duration){
			return;
		}

		var epsilon = 1 / duration, // precision for bezier computations
			points = config.flicking.timingFunc, // control points for the animation function
			timingFunc = new CubicBezier(points[0], points[1], points[2], points[3]),
			min = this._scrollMin,
			currentOffset = this._currentOffset,
			scrollbars = this._scrollbars;

		roundMatrix(matrix);
		if(!this._scrolls.e){
			matrix.e = 0;
		}
		if(!this._scrolls.f){
			matrix.f = 0;
		}

		var scrollTarget = this._currentOffset.multiply(matrix);

		["e", "f"].forEach(function(axis){
			var distance = matrix[axis],
				target = scrollTarget[axis],
				segmentFraction = 1; // the fraction of the flick distance until crossing scroller bounds

			// compute distance fraction where flicking crosses scroller bounds
			if(target < min[axis]){
				segmentFraction = 1 - Math.max(Math.min((target - min[axis]) / matrix[axis], 1), 0);
			}else if(target > 0){
				segmentFraction = 1 - Math.max(Math.min((target - 0) / matrix[axis], 1), 0);
			}

			var flick = segmentFraction * distance,
				bounce = distance - flick;

			if(!(flick || bounce)){
				this._snapBack(axis);
				return;
			}

			var t = timingFunc.getTforY(segmentFraction, epsilon),
				timeFraction = timingFunc.getPointForT(t).x,
				bezierCurves = timingFunc.divideAtT(t);

			var flickTransform =  new WebKitCSSMatrix();
			flickTransform[axis] = currentOffset[axis];

			var flickDuration = timeFraction * duration;

			if(flick && timeFraction){
				this._flicking[axis] = true;

				// animate scroller
				flickTransform[axis] += flick;
				applyMatrixToNode(this.scrollers[axis], flickTransform,
				                  flickDuration + "ms", bezierCurves[0]);

				// animate scrollbars
				var scrollbarTransform = flickTransform.translate(0, 0, 0);
				scrollbarTransform[axis] *= scrollbars.offsetRatios[axis];
				applyMatrixToNode(scrollbars.handles[axis], scrollbarTransform,
				                  flickDuration + "ms", bezierCurves[0]);

			}

			if(this.elastic && bounce){
				var bounceTransform = flickTransform.translate(0, 0, 0),
					bounceTiming = bezierCurves[1];

				// Creating a smooth transition from bounce out to snap back
				bounceTiming._p2 = {
					x: 1 - config.snapBack.timingFunc[0],
					y: 1 - config.snapBack.timingFunc[1]
				};

				// limit the bounce to the configured maximum
				var bounceFactor = Math.min(
					config.elasticity.factorFlick,
					config.elasticity.max / Math.abs(bounce)
				);

				bounceTransform[axis] += bounce * bounceFactor;
				var bounceDuration = (1 - timeFraction) * duration * bounceFactor;
				this._bounces[axis] = {
					timingFunc: bounceTiming,
					duration: bounceDuration + "ms",
					matrix: bounceTransform,
					bounceLength: Math.abs(bounce * bounceFactor)
				};

				// play queued animations with timeouts, because
				// the webkitTransitionEnd event fires late on iPhone 3G
				var that = this;
				var timeouts = this._animationTimeouts[axis];
				var handle = this._sc

				timeouts.push(setTimeout(function(){
					that._playQueuedBounce(axis);
				}, flickDuration));

				timeouts.push(setTimeout(function(){
					var duration = config.snapBack.alwaysDefaultTime ? null : bounceDuration;
					that._snapBack(axis, duration);
					timeouts.length = 0; // clear timeouts
				}, flickDuration + bounceDuration));
			}
		}, this);
	},

	_playQueuedBounce: function _playQueuedBounce(axis){
		var bounce = this._bounces[axis];

		if(bounce){
			var scroller = this.scrollers[axis],
				that = this,
				matrix = bounce.matrix,
				duration = bounce.duration,
				timingFunc = bounce.timingFunc;

			applyMatrixToNode(scroller, matrix, duration, timingFunc);

			// bounce scrollbar handle
			this._squeezeScrollbar(axis, bounce.bounceLength, matrix[axis] < 0, duration, timingFunc);

			this._bounces[axis] = null;
			return true;
		}

		return false;
	},

	_snapBack: function _snapBack(/*String?*/axis, /*Number?*/duration){ /*Boolean*/
		if(axis == null){
			var snapBackE = this._snapBack("e", duration);
			var snapBackF = this._snapBack("f", duration);
			return snapBackE || snapBackF;
		}

		duration = duration || config.snapBack.defaultTime;

		var scroller = this.scrollers[axis],
			offset = getMatrixFromNode(scroller),
			cp = config.snapBack.timingFunc, // control points
			timingFunc = new CubicBezier(cp[0], cp[1], cp[2], cp[3]);

		if(offset[axis] < this._scrollMin[axis] || offset[axis] > 0){
			offset[axis] = Math.max(Math.min(offset[axis], 0), this._scrollMin[axis]);
			this._squeezeScrollbar(axis, 0, offset[axis] < 0, duration, timingFunc);
			applyMatrixToNode(scroller, offset, duration + "ms", timingFunc);

			return true;
		}

		return false;
	}
};

return TouchScroll;
}());
