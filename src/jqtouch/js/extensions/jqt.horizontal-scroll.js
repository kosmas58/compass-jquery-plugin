/**
 * 
 * Add support for scrolling horizontally using jQTouch in Webkit Mobile
 *
 * Copyright (c) 2010 Sam Shull <http://samshull.blogspot.com/>
 * Released under MIT license
 * 
 * Based on the work of 
 *
 * Copyright (c) 2009 Matteo Spinelli, http://cubiq.org/
 * Released under MIT license
 * http://cubiq.org/dropbox/mit-license.txt
 *
 * Find more about the scrolling function at
 * http://cubiq.org/scrolling-div-for-mobile-webkit-turns-3/16
 * 
 * Version 3.2 - Last updated: 2010.05.31
 * 
 */

(function($) {
	
	var undefined,
		window = this,
		document = window.document,
		CSSMatrix = this.WebKitCSSMatrix,
		defaults = {
			selector: ".horizontal-scroll > table",
			attributesToOptions: attributesToOptions,
			attributes: {
				defaultDuration: "slidespeed",
				preventDefault: "preventdefault",
				defaultTransform: "defaulttransform",
				bounce: function(e){return e.attr("bounce") === "false" ? false : defaults.bounce},
				scrollBar: function(e){return e.hasClass("with-scrollbar")}
			},
			ignoreTags: "SELECT,TEXTAREA,BUTTON,INPUT",
			eventProperty: "pageX",
			numberOfTouches: 1,
			defaultDuration: 500,
			defaultTransform: "translate3d({0}px,0,0)",
			defaultOffset: 0,
			bounceSpeed: 500,
			preventDefault: true,
			maxScrollTime: 1000,
			friction: 3,
			bounceTimingFunction: "cubic-bezier(0,0,.25,1)",
			bounce: true,
			scrollBar: true,
			scrollBarElement: null,
			scrollBarOptions: {},
			events: {
				touchstart: touchStart,
				touchmove: touchMove,
				touchend: touchEnd,
				touchcancel: touchEnd,
				webkitTransitionEnd: transitionEnd,
				//unload: unload
			},
			setPosition: setPosition,
			reset: reset,
			momentum: momentum
		},
		width = function (){return window.innerWidth + "px";},
		height = function (vars){return (window.innerHeight - vars.toolbar) + "px";},
		cssRules = {
			variables: {
				toolbar: 45
			},
			defaults: {
				".horizontal-scroll": {
					width: width,
					height: "100%",
					overflow: "hidden",
					padding: "0px",
					position: "relative",
					height: height
				},
				".horizontal-scroll > table": {
					height: "100%"
				},
				".horizontal-scroll .scrollbar.horizontal": {
					"-webkit-transition-timing-function": "cubic-bezier(0,0,0.25,1)",
					"-webkit-transform": "translate3d(0,0,0)",
					"-webkit-transition-property": "-webkit-transform,opacity",
					"-webkit-transition-duration": "0,300ms",
					"-webkit-border-radius": "4px",
					"pointer-events": "none",
					opacity: 0,
					"-webkit-border-image": "-webkit-gradient(radial, 50% 50%, 2, 50% 50%, 8, from(rgba(0,0,0,.5)), to(rgba(0,0,0,.5))) 3 2",
					//background: "rgba(0,0,0,.5)",
					//"-webkit-box-shadow": "0 0 2px rgba(255,255,255,.5)",
					position: "absolute",
					"z-index": 10,
					width: "1px",
					height: "5px",
					bottom: "1px",
					left: "1px"
				}
			},
			portrait: {
				".portrait .horizontal-scroll": {
					width: width
				}
			},
			landscape: {
				".landscape .horizontal-scroll": {
					width: width
				}
			}
		};
	
    if ($.jQTouch) {
		
        $.jQTouch.addExtension(function (jQT){
            
			function binder (e, info)
			{
				var horizontal = info.page.find(defaults.selector);
				
				horizontal.scrollHorizontally(defaults.attributesToOptions(horizontal, defaults.attributes));
			}
			
			$(document.body)
				.bind("pageInserted", binder);
			
			$(function()
			{
				$(defaults.selector)
					.each(function()
					{
						$(this).scrollHorizontally(defaults.attributesToOptions($(this), defaults.attributes));
					});
			});
			
			return {};
        });
	}
	
	//$(window).bind("unload", window_unload);

	/**
	 *
	 *
	 *
	 */
	function attributesToOptions (element, attributes) {
		var options = {};
		
		$.each(attributes, function(name, value) {
			if ($.isFunction(value)) {
				options[name] = value(element);
			} else if (element.attr(value) != undefined) {
				options[name] = element.attr(value);
			}
		});
		
		return options;
	}
	
	/**
	 *
	 *
	 *
	 */
	$.fn.scrollHorizontally = function (options) {
		options = $.extend(true, {}, defaults, options || {});
		
		return this.each(function () {
			HorizontalScroll(this, options);
		});
	};
	
	/**
	 *
	 *
	 *
	 */
	$.fn.scrollHorizontally.defaults = function (options) {
		if (options !== undefined) {
			defaults = $.extend(true, defaults, options);
		}
		
		return $.extend({}, defaults);
	};
	
	/**
	 *
	 *
	 *
	 */
	$.fn.scrollHorizontally.defaultCSS = function (options) {
		if (options !== undefined) {
			cssRules = $.extend(true, cssRules, options);
		}
		
		return $.extend({}, cssRules);
	};

	/**
	 *
	 *
	 *
	 */
	function HorizontalScroll (element, options) {
		var $element = $(element).data("jqt-horizontal-scroll-options", options)
							.css("webkitTransform", format(options.defaultTransform, options.defaultOffset)),
			matrix = new CSSMatrix($element.css("webkitTransform"));
		
		$.each(options.events, function (name, func) {
			element.addEventListener(name, func, false);
		});
		
		//store for later use
		options.currentPosition = matrix.m41;
		options.parentWidth = $element.parent().width();
		
		if (options.scrollBar && options.scrollBar === true && !options.scrollBarElement) {
			options.scrollBarElement = $.isFunction(options.scrollBar) ? 
				options.scrollBar($element.parent(), "horizontal", options.scrollBarOptions || {}) :
				Scrollbar($element.parent(), "horizontal", options.scrollBarOptions || {});
		}
	}

	/**
	 *
	 *
	 *
	 */
	function touchStart (event) {
		var $this = $(this),
			options = $this.data("jqt-horizontal-scroll-options"),
			matrix, 
			width = $this.outerWidth(),
			parentWidth = $this.parent().width(),
			endPoint = -(width - parentWidth),
			quarter = parentWidth / 6;
		
		options.parentWidth = parentWidth;
		
		if (!!options.ignoreTags && $(event.target).is(options.ignoreTags) || event.targetTouches.length !== options.numberOfTouches) { 
			return null;
		}
		
		matrix = new CSSMatrix($this.css("webkitTransform"));
		
		$this.data("jqt-horizontal-scroll-current-event", {
			startLocation: event.touches[0][options.eventProperty],
			startPosition: matrix.m41,
			currentPosition: matrix.m41,
			startTime: event.timeStamp,
			moved: false,
			lastMoveTime: event.timeStamp,
			parentWidth: parentWidth,
			endPoint: endPoint,
			minScroll: !options.bounce ? 0 : quarter,
			maxScroll: !options.bounce ? endPoint : endPoint - quarter,
			timingFunction: options.bounceTimingFunction
		});
		
		if (options.scrollBarElement) {
			options.scrollBarElement.init(parentWidth, width);
		}
		
		options.setPosition($this, options, matrix.m41, "0");
		
		if (options.preventDefault) {
			event.preventDefault();
			//event.stopPropagation();
			return false;
			
		} else {
			return true;
		}
	}

	/**
	 *
	 *
	 *
	 */
	function touchMove (event) {
		var $this = $(this),
			options = $this.data("jqt-horizontal-scroll-options"),
			data = $this.data("jqt-horizontal-scroll-current-event"),
			lastMoveTime = data.lastMoveTime,
			distance = data.startLocation - event.touches[0][options.eventProperty],
			point = data.startPosition - distance;
		
		data.currentPosition = point;
		data.moved = true;
		data.lastMoveTime = event.timeStamp;
		
		if ((data.lastMoveTime - lastMoveTime) > options.maxScrollTime) {
			data.startTime = data.lastMoveTime;
		}
		
		if (options.scrollBarElement && !options.scrollBarElement.visible) {
			options.scrollBarElement.show();
		}
		
		options.setPosition($this, options, data.currentPosition, 0);
		
		if (options.preventDefault) {
			event.preventDefault();
			//event.stopPropagation();
			return false;
			
		} else {
			return true;
		}
	}

	/**
	 *
	 *
	 *
	 */
	function touchEnd (event) {
		var $this = $(this),
			options = $this.data("jqt-horizontal-scroll-options"),
			data = $this.data("jqt-horizontal-scroll-current-event"),
			theTarget, theEvent;
		
		if (!data.moved) {
			if (options.scrollBarElement) {
                options.scrollBarElement.hide();
            }
			theTarget  = event.target;
			if(theTarget.nodeType == 3) {
				theTarget = theTarget.parentNode;
			}
			theEvent = document.createEvent("MouseEvents");
			theEvent.initEvent("click", true, true);
			theTarget.dispatchEvent(theEvent);
			
			if (options.preventDefault) {
				event.preventDefault();
				event.stopPropagation();
				return false;
			}
		}
		
		options.momentum($this, options, data, event);
		
		options.setPosition($this, options, data.currentPosition, data.duration);
		
		if (options.preventDefault) {
			event.preventDefault();
			event.stopPropagation();
			return false;
			
		} else {
			return true;
		}
	}
	/**
	 *
	 *
	 *
	 */
	function transitionEnd (e) {
		
		var $this = $(this),
			options = $this.data("jqt-horizontal-scroll-options"),
			data = $this.data("jqt-horizontal-scroll-current-event");
		
		if (data) {
			if (data.currentPosition > 0) {
				data.currentPosition = 0;
				options.setPosition($this, options, 0, options.bounceSpeed);
			} else if (data.currentPosition < data.endPoint) {
				data.currentPosition = data.endPoint;
				options.setPosition($this, options, data.endPoint, options.bounceSpeed);
			} else if (options.scrollBarElement) {
				options.scrollBarElement.hide();
			}
		} else if (options.scrollBarElement) {
			options.scrollBarElement.hide();
		}
	}

	/**
	 *
	 *
	 *
	 */
	function momentum (object, options, data, event) {
		var duration = Math.min(options.maxScrollTime, data.lastMoveTime - data.startTime),
			distance = data.startPosition - data.currentPosition,
			velocity = Math.abs(distance) / duration,
			acceleration = duration * velocity * options.friction,
			momentum = Math.round(distance * velocity),
			position = Math.round(data.currentPosition - momentum);
		
		if (data.currentPosition > 0) {
			position = 0;
		} else if (data.currentPosition < data.endPoint) {
			position = data.endPoint;
		} else if (position > data.minScroll) {
			acceleration = acceleration * Math.abs(data.minScroll / position);
			position = data.minScroll;
		} else if (position < data.maxScroll) {
			acceleration = acceleration * Math.abs(data.maxScroll / position);
			position = data.maxScroll;
		}
		
		data.momentum = position / data.currentPosition;
		data.currentPosition = position;
		data.duration = acceleration;
	}

	/**
	 *
	 *
	 *
	 */
	function reset (object, options) {
		return options.setPosition(object, options, 0, options.defaultDuration);
	}

	/**
	 *
	 *
	 *
	 */
	function setPosition (object, options, position, duration, timing) {
		
		if (options.scrollBarElement) {
			var width = (object.parent().width() - object.outerWidth());
			
			if (position > 0) {
				width += Number(position);
			}
			
			options.scrollBarElement.scrollTo(options.scrollBarElement.maxScroll / width * position, 
											  format("{0}ms", duration !== undefined ? duration : options.defaultDuration));
		}
		
		if (duration !== undefined) {
			object.css("webkitTransitionDuration", format("{0}ms", duration));
		}
		
		if (timing !== undefined) {
			object.css("webkitTransitionTimingFunction", timing);
		}
		
		options.currentPosition = position || 0;
		
		return object.css("webkitTransform", format("translate3d({0}px, 0, 0)", options.currentPosition));
	}
    
    /**
     *    Format a String followed by a set of arguments using the format
     *    {0} is replaced with arguments[1]
     *
     *    @param String s
     *    @param Object arg1 ... argN
     *    @return String
     */
    function format (s)
    {
        var args = arguments;
        return s.replace(/\{(\d+)\}/g, function(a,b){return args[Number(b)+1] + ""});
    }

	/**
	 *
	 *
	 *
	 */
	function Scrollbar (object, direction, options) {
		if (!(this instanceof Scrollbar)) {
			return new Scrollbar(object, direction, options);
		}
		
		this.direction = direction;
		this.bar = $(document.createElement("div"))
			.addClass("scrollbar " + direction)
			.appendTo(object)[0];
	}
	
	Scrollbar.prototype = {
			direction: "horizontal",
			size: 0,
			maxSize: 0,
			maxScroll: 0,
			visible: false,
			
			init: function (scroll, size) {
				var offset = this.direction == "horizontal" ? 
								this.bar.offsetWidth - this.bar.clientWidth : 
								this.bar.offsetHeight - this.bar.clientHeight;
								
				this.maxSize = scroll - 8;		// 8 = distance from top + distance from bottom
				this.size = Math.round(this.maxSize * this.maxSize / size) + offset;
				this.maxScroll = this.maxSize - this.size;
				this.bar.style[this.direction == "horizontal" ? "width" : "height"] = (this.size - offset) + "px";
			},
			
			setPosition: function (pos) {
				pos = this.direction == "horizontal" ? "translate3d(" + Math.round(pos) + "px,0,0)" : "translate3d(0," + Math.round(pos) + "px,0)";
				this.bar.style.webkitTransform = pos;
			},
			
			scrollTo: function (pos, runtime) {
				this.bar.style.webkitTransitionDuration = (runtime || "400ms") + ",300ms";
				this.setPosition(pos);
			},
			
			show: function () {
				this.visible = true;
				this.bar.style.opacity = "1";
			},
		
			hide: function () {
				this.visible = false;
				this.bar.style.opacity = "0";
			},
			
			remove: function () {
				this.bar.parentNode.removeChild(this.bar);
				return null;
			}
	};
    
    $(function() {
        window.scrollTo(0,0);
		var stringRules = "", 
            rules = cssRules, 
            o = window.innerHeight > window.innerWidth ? "portrait" : "landscape",
            buildProperties = function (name, value) {
                stringRules += name + ":" + ($.isFunction(value) ? value(rules.variables) : value) + ";";
            },
            buildRules = function (name, properties) {
                stringRules += name + "{";
                
                $.each(properties, buildProperties);
                
                stringRules += "}";
            };
        
        $.each(rules.defaults, buildRules);
        $.each(rules[o], buildRules);
        
        
        $(document.createElement("style"))
            .attr({type:"text/css",media:"screen"})
            .html(stringRules)
            .appendTo("head");
        
        $(window).one("orientationchange", function () {
            //ensure repaint
            setTimeout(function () {
                window.scrollTo(0,0);
				stringRules = "";
                
                $.each(rules[window.innerHeight > window.innerWidth ? "portrait" : "landscape"], buildRules);
                
                $(document.createElement("style"))
                    .attr({type:"text/css",media:"screen"})
                    .html(stringRules)
                    .appendTo("head");
            },30)
        });
    });
    
})(jQuery);