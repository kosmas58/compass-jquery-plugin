/**
 * 
 * Add support for scrolling vertically using jQTouch in Webkit Mobile
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
		
		/**
		 *
		 *
		 *
		 */
        window = this,
		
		/**
		 *
		 *
		 *
		 */
        document = window.document,
		
		/**
		 *
		 *
		 *
		 */
        defaults = {
            /**
             *
             *
             *
             */
            selector: ".vertical-scroll > div",
            
            /**
             *
             *
             *
             */
            attributesToOptions: attributesToOptions,
            
            /**
             *
             *
             *
             */
            attributes: {
                defaultDuration: "slidespeed",
                preventDefault: "preventdefault",
                bounce: function(e){return e.attr("bounce") === "false" ? false : defaults.bounce},
                scrollBar: function(e){return e.hasClass("with-scrollbar")}
            },
            
            /**
             *
             *
             *
             */
            ignoreTags: "SELECT,TEXTAREA,BUTTON,INPUT",
            
            /**
             *
             *
             *
             */
            eventProperty: "pageY",
            
            /**
             *
             *
             *
             */
            numberOfTouches: 1,
            
            /**
             *
             *
             *
             */
			touchEventList: ["touchend","touchmove","touchcancel"],
            
            /**
             *
             *
             *
             */
			bounceSpeed: 300,
            
            /**
             *
             *
             *
             */
            defaultDuration: 500,
            
            /**
             *
             *
             *
             */
            defaultTransform: "translate3d({0}px,0,0)",
            
            /**
             *
             *
             *
             */
            defaultOffset: 0,
            
            /**
             *
             *
             *
             */
            preventDefault: true,
            
            /**
             *
             *
             *
             */
            maxScrollTime: 1000,
            
            /**
             *
             *
             *
             */
            friction: 3,
            
            /**
             *
             *
             *
             */
            scrollTopOnTouchstart: true,
            
            /**
             *
             *
             *
             */
            bounce: true,
            
            /**
             *
             *
             *
             */
            scrollBar: true,
            
            /**
             *
             *
             *
             */
            scrollBarElement: null,
            
            /**
             *
             *
             *
             */
            scrollBarOptions: {},
            
            /**
             *
             *
             *
             */
            events: {
                touchstart: touchStart,
                touchmove: touchMove,
                touchend: touchEnd,
                touchcancel: touchEnd,
                webkitTransitionEnd: transitionEnd,
                //unload: unload
            },
            
            /**
             *
             *
             *
             */
            setPosition: setPosition,
            
            /**
             *
             *
             *
             */
            reset: reset,
            
            /**
             *
             *
             *
             */
            momentum: momentum
        },
            
        /**
         *
         *
         *
         */
        bottomToolbar = function(vars){return (window.innerHeight - (vars.toolbarHeight * 2)) + "px !important"},
            
        /**
         *
         *
         *
         */
        height = function(vars){return (window.innerHeight - vars.toolbarHeight) + "px"},
            
        /**
         *
         *
         *
         */
        cssRules = {
            variables : {
                toolbarHeight: 45
            },
            defaults: {
                ".vertical-scroll": {
                    position: "relative",
                    "z-index": 1,
                    overflow: "hidden",
                    height: height
                },
                ".vertical-scroll.use-bottom-toolbar": {
                    height: bottomToolbar
                },
                ".vertical-scroll > div": {
                    margin: "0 auto",
                    "padding-bottom":"5px",
                    "-webkit-transition-property": "-webkit-transform",
                    "-webkit-transition-timing-function": "cubic-bezier(0,0,.25,1)",
                    "-webkit-transform": "translate3d(0,0,0)",
                    "-webkit-transition-duration": 0,
                },
                "#jqt.fullscreen .vertical-scroll.use-bottom-toolbar > div": {
                    "padding-bottom":"0px"
                },
                ".vertical-scroll .scrollbar.vertical": {
                    "-webkit-transition-timing-function": "cubic-bezier(0,0,.25,1)",
                    "-webkit-transform": "translate3d(0,0,0)",
                    "-webkit-transition-property": "-webkit-transform,opacity",
                    "-webkit-transition-duration": "0,1s",
                    "-webkit-border-radius": "4px",
                    "pointer-events": "none",
                    opacity: 0,
					"-webkit-border-image": "-webkit-gradient(radial, 50% 50%, 2, 50% 50%, 4, from(rgba(0,0,0,.5)), to(rgba(0,0,0,.5))) 3",
                    position: "absolute",
                    "z-index": 10,
                    width: "1px",
                    height: "5px",
                    top: "1px",
                    right: "1px"
                }
            },
            portrait: {
                ".portrait .vertical-scroll": {
                    position: "relative",
                    "z-index": 1,
                    overflow: "hidden",
                    height: height,        
                },
                ".portrait .vertical-scroll.use-bottom-toolbar": {
                    height: bottomToolbar
                }
            },
            landscape: {
                ".landscape .vertical-scroll": {
                    position: "relative",
                    "z-index": 1,
                    overflow: "hidden",
                    height: height,
                },
                ".landscape .vertical-scroll.use-bottom-toolbar": {
                    height: bottomToolbar
                }
            }
        };
    
    /*
     *
     *
     *	
     */
    if ($.jQTouch) {
        
        $.jQTouch.addExtension(function (jQT){
            
            function binder (e, info) {
                var vertical = info.page.find(defaults.selector);
                
                vertical.scrollVertically(defaults.attributesToOptions(vertical, defaults.attributes));
            }
            
            $(document.body).bind("pageInserted", binder);
            
            $(function() {
                $(defaults.selector)
                    .each(function() {
                        $(this).scrollVertically(defaults.attributesToOptions($(this), defaults.attributes));
                    });
            });
            
            return {};
        });
    }
    
    //$(window).bind("unload", window_unload);
    
    /**
     *
     *
	 *	@param DOMElement element
     *	@param Object attributes
	 *	@return Object
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
     *	@param Object options - optional
	 *	@return jQuery
     */
    $.fn.scrollVertically = function (options) {
        options = $.extend(true, {}, defaults, options || {});
        
        return this.each(function () {
            VerticalScroll(this, options);
        });
    };
    
    /**
     *
     *
     *	@param Object options - @see defaults - optional
	 *	@return Object
     */
    $.fn.scrollVertically.defaults = function (options) {
        if (options !== undefined) {
            defaults = $.extend(true, defaults, options);
        }
        
        return $.extend({}, defaults);
    };
    
    /**
     *
     *
     *	@param Object options - @see cssRules - optional
	 *	@return Object
     */
    $.fn.scrollVertically.defaultCSS = function (options) {
        if (options !== undefined) {
            cssRules = $.extend(true, cssRules, options);
        }
        
        return $.extend({}, cssRules);
    };

    /**
     *
     *
     *	@param DOMElement element
	 *	@param Object options - @see defaults
     */
    function VerticalScroll (element, options) {
        var $element = $(element).data("jqt-vertical-scroll-options", options)
                            .css("webkitTransform", format(options.defaultTransform, options.defaultOffset)),
            transform = $element.css("webkitTransform"),
            matrix = transform ? new WebKitCSSMatrix(transform) : {m41:0};
        
        $.each(options.events, function (name, func) {
            //these events get attatch
			if (!name.match(/^touchend|touchcancel|touchmove/)) {
				element.addEventListener(name, func, false);
			}
        });
		
		//setup an event delegate for touchend/cancel/move events
		//safari doesn't fire a touchend event if the finger moves off the screen onto the toolbar
		//thought this would help - sadly no
		//detecting the location of the last touchmove event was useless
		//got any ideas?
		options.delegate = function (event) {
			if (options.events[event.type]) {
				return options.events[event.type].call(element, event);
			}
			return null;
		};
        
        //store for later use
        options.currentPosition = matrix.m41;
        options.parentWidth = $element.parent().width();
        
        if (options.scrollBar && options.scrollBar === true && !options.scrollBarElement) {
            options.scrollBarElement = $.isFunction(options.scrollBar) ? 
                options.scrollBar($element.parent(), "vertical", options.scrollBarOptions || {}) :
                Scrollbar($element.parent(), "vertical", options.scrollBarOptions || {});
        }
		
		return null;
    }

    /**
     *
     *
     *
     */
    function touchStart (event) {
        var $this = $(this),
            options = $this.data("jqt-vertical-scroll-options"),
			location = event.touches[0][options.eventProperty],
            matrix, 
            height = $this.outerHeight(),
            parentHeight = $this.parent().height(),
            endPoint = -(height - parentHeight),
            quarter = parentHeight / 6;
        
        options.parentHeight = parentHeight;
        
        if (options.scrollTopOnTouchstart) {
            window.scrollTo(0,0);
        }
        
        if (!!options.ignoreTags && $(event.target).is(options.ignoreTags) || event.targetTouches.length !== options.numberOfTouches) { 
            return null;
        }
        
        matrix = new WebKitCSSMatrix($this.css("webkitTransform"));
        
        $this.data("jqt-vertical-scroll-current-event", {
            startLocation: location,
			currentLocation: location,
            startPosition: matrix.m42,
            lastPosition: matrix.m42,
            currentPosition: matrix.m42,
            startTime: event.timeStamp,
            moved: false,
            lastMoveTime: event.timeStamp,
            parentHeight: parentHeight,
            endPoint: endPoint,
            minScroll: !options.bounce ? 0 : quarter,
            maxScroll: !options.bounce ? endPoint : endPoint - quarter,
            end: false
        });
        
        if (options.scrollBarElement) {
            options.scrollBarElement.init(parentHeight, height);
        }
        
        options.setPosition($this, options, matrix.m42, "0");
		
		$.each(options.touchEventList, function (index, name) {
			window.addEventListener(name, options.delegate, false);
		});
        
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
            options = $this.data("jqt-vertical-scroll-options"),
            data = $this.data("jqt-vertical-scroll-current-event"),
            lastMoveTime = data.lastMoveTime,
            position = event.touches[0][options.eventProperty],
            distance = data.startLocation - position,
            point = data.startPosition - distance,
            duration = 0;
        
        //apply friction if past scroll points
        if (point > 5) {
            point = (point - 5) / options.friction;
        } else if (point < data.endPoint) {
            point = data.endPoint - ((data.endPoint - point) / options.friction);
        }
        
        data.currentPosition = data.lastPosition = Math.floor(point);
        data.moved = true;
        data.lastMoveTime = event.timeStamp;
		data.currentLocation = position;
        
        if ((data.lastMoveTime - lastMoveTime) > options.maxScrollTime) {
            data.startTime = data.lastMoveTime;
        }
        
        if (options.scrollBarElement && !options.scrollBarElement.visible) {
            options.scrollBarElement.show();
        }
        
        options.setPosition($this, options, data.currentPosition, duration);
        
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
            options = $this.data("jqt-vertical-scroll-options"),
            data = $this.data("jqt-vertical-scroll-current-event"),
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
                //event.stopPropagation();
                return false;
            }
        }
        
        options.momentum($this, options, data, event);
        
        options.setPosition($this, options, data.currentPosition, data.duration);
		
		$.each(options.touchEventList, function (index, name) {
			window.removeEventListener(name, options.delegate, false);
		});
        
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
    function transitionEnd (e) {
        
        var $this = $(this),
            options = $this.data("jqt-vertical-scroll-options"),
            data = $this.data("jqt-vertical-scroll-current-event");
        
        if (data && !data.end) {
            if (data.currentPosition > 0) {
                data.currentPosition = 0;
                options.setPosition($this, options, 0, options.bounceSpeed);
            } else if (data.currentPosition < data.endPoint) {
                data.currentPosition = data.endPoint;
                options.setPosition($this, options, data.endPoint, options.bounceSpeed);
            } else if (options.scrollBarElement) {
                options.scrollBarElement.hide();
            }
            data.end = true;
        } else if (options.scrollBarElement) {
            options.scrollBarElement.hide();
        }
        
        return null;
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
        
        data.momentum = Math.abs(momentum);
        data.currentPosition = position;
        data.duration = acceleration;
        
        return null;
    }

    /**
     *
     *
     *
     *
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
        
        return null;
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
            var height = (object.parent().height() - object.height());
            
            if (position > 0) {
                height += Number(position);
            }
            
            options.scrollBarElement.scrollTo(options.scrollBarElement.maxScroll / height * position, 
                                              format("{0}ms", duration !== undefined ? duration : options.defaultDuration));
        }
        
        if (duration !== undefined) {
            object.css("webkitTransitionDuration", format("{0}ms", duration));
        }
        
        if (timing !== undefined) {
            object.css("webkitTransitionTimingFunction", timing);
        }
        
        options.currentPosition = position || 0;
        
        return object.css("webkitTransform", format("translate3d(0, {0}px, 0)", options.currentPosition));
    }
    
    /**
     *    Format a String followed by a set of arguments using the format
     *    {0} is replaced with arguments[1]
     *
     *    @param String s
     *    @param Object arg1 ... argN
     *    @return String
     */
    function format (s) {
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
            direction: "vertical",
            size: 0,
            maxSize: 0,
            maxScroll: 0,
            visible: false,
            
            init: function (scroll, size) {
                var offset = this.direction == "horizontal" ? 
                                this.bar.offsetWidth - this.bar.clientWidth : 
                                this.bar.offsetHeight - this.bar.clientHeight;
                                
                this.maxSize = scroll - 8;        // 8 = distance from top + distance from bottom
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
    
    //load stylesheet(s)
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
