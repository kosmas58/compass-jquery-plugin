/*!*
 * 
 * Add support for scrolling vertically and horizontally using jQTouch in Webkit Mobile
 * Plus support for slides
 *
 * Copyright (c) 2010 Sam Shull <http://samshull.blogspot.com/>
 * Released under MIT license
 * 
 * Based on the work of Matteo Spinelli, http://cubiq.org/
 * Released under MIT license
 * http://cubiq.org/dropbox/mit-license.txt
 *
 * Find more about the scrolling function at
 * http://cubiq.org/scrolling-div-for-mobile-webkit-turns-3/16
 *
 * 
 */
    
(function($) {
    //we need this in the algorithm
    if (!"WebKitCSSMatrix" in this) {
        return null;
    }
    
    var undefined,
        
        /**
         *    The global object
         *
         *    @var Object
         */
        window = this,
        
        /**
         *    Just to speed up access
         *
         *    @var DOMDocument
         */
        document = window.document,
        
        /**
         *    Just to speed up access
         *
         *    @var Function
         */
        Number = window.Number,
        
        /**
         *    Just to speed up access
         *
         *    @var Object
         */
        Math = window.Math,
        
        /**
         *    Determine 3d translate support
         *
         *    @var Boolean
         */
        supports3d = ('m11' in new WebKitCSSMatrix()),
        
        /**
         *    Single Object for base options 
         *    that is used to extend the defaults
         *
         *    @var Object
         */
        base = {
            
            /**
             *    A function for converting attributes into options @see attributes
             *
             *    @var Function
             */
            attributesToOptions: attributesToOptions,
            
            /**
             *    A dictionary of property/accessor pairs
             *    where the name of the property coincides with the name
             *    of an option, and the value is either a string representing the 
             *    name of the attribute where the value will be stored, or
             *    a function that accepts two arguments, the first of the type DOMElement 
             *    and the second is a string indicating the desired direction which then
             *    returns the desired value of the property on that object
             *
             *    @var Object
             */
            attributes: {
                //use an attribute to set the defaultDuration option
                defaultDuration: "slidespeed",
                //use an attribute to determine whether or not you want the default touch event cancelled
                preventDefault: function(e,d){return $(e).attr("preventdefault") === "false" ? false : !!defaults[d].preventDefault;},
                //use bounce?
                bounce: function(e,d){return e.attr("bounce") === "false" ? false : defaults[d].bounce},
                //use a scrollbar?
                scrollBar: function(e,d){return e.hasClass("with-scrollbar")},
                //use slides?
                useSlides: function(e,d){return $(e).find(defaults[d].slides.selector).length > 0;}
            },
            
            /**
             *    Selectors to ignore on touch start
             *
             *    @var String
             */
            ignore: "SELECT,TEXTAREA,BUTTON,INPUT",
            
            /**
             *    Should the container slide to the next container?
             *
             *    @var Boolean
             */
            useSlides: false,
            
            /**
             *    Properties for handling slides
             *
             *    @var Object
             */
            slides: {
            
                /**
                 *    jQuery selector for the slide containers
                 *
                 *    @var String
                 */
                selector: ".slide-container",
            
                /**
                 *    Identify the current slide container
                 *
                 *    @var String
                 */
                currentClass: "jqt-slide-current",
            
                /**
                 *    Portion of the slide that must be moved 
                 *    before triggerring move to next slide
                 *
                 *    @var Number
                 */
                portion: 3,
            
                /**
                 *    Amount of easing to use on slide
                 *
                 *    @var Number
                 */
                easing: 2,
            
                /**
                 *    The function to determine position of next slide
                 *
                 *    @var Function
                 */
                callback: slideTo
            },
            
            /**
             *    The number of fingers required to activate the slide motion
             *
             *    @var Number
             */
            numberOfTouches: 1,
            
            /**
             *    Amount of the parent container to use for a bounce
             *
             *    @var Number
             */
            divider: 6,
            
            /**
             *    List of touch enevts to listen to. (Hopefully add support for non-touch one day)
             *
             *    @var Array<String>
             */
            touchEventList: ["touchend","touchmove","touchcancel"],
            
            /**
             *    The return speed of a bounce
             *
             *    @var Number
             */
            bounceSpeed: 300,
            
            /**
             *    The duration of a slide
             *
             *    @var Number
             */
            defaultDuration: 500,
            
            /**
             *    Initial container offset in px
             *
             *    @var Number
             */
            defaultOffset: 0,
            
            /**
             *    should the default be prevented on the events?
             *
             *    @var Boolean
             */
            preventDefault: true,
            
            /**
             *    Limit the acceleration velocity
             *
             *    @var Number
             */
            maxScrollTime: 1000,
            
            /**
             *    Friction to apply to the acceleration
             *
             *    @var Number
             */
            friction: 3,
            
            /**
             *    Should the window.scrollTo(0,0) be called each time a touch event starts?
             *
             *    @var Boolean
             */
            scrollTopOnTouchstart: true,
            
            /**
             *    Use bounce?
             *
             *    @var Boolean
             */
            bounce: true,
            
            /**
             *    Show a scrollbar?
             *
             *    @var Boolean
             */
            scrollBar: true,
            
            /**
             *    Object reference to Scrollbar object
             *
             *    @var ScrollBar
             */
            scrollBarObject: null,
            
            /**
             *    Event handlers
             *
             *    @var Object
             */
            events: {
                //
                scrollTo: scrollTo,
                //
                reset: reset,
                //
                touchstart: touchStart,
                //
                touchmove: touchMove,
                //
                touchend: touchEnd,
                //
                touchcancel: touchEnd,
                //
                webkitTransitionEnd: transitionEnd
            },
            
            /**
             *    Function for actually performing a change to the position of
             *    the slide container
             *
             *    @var Function
             */
            setPosition: setPosition,
            
            /**
             *    Calculate the momentum of a touch event
             *
             *    @var Function
             */
            momentum: momentum
        },
        
        /**
         *
         *
         *    @var Object
         */
        defaults = {
            /**
             *    Vertical default settings
             *
             *    @var Object
             */
            vertical: $.extend({}, base, {
            
                /**
                 *    direction of the scroll, for internal use,
                 *    don't change this
                 *
                 *    @var String
                 */
                direction: "vertical",
            
                /**
                 *    The jQuery.fn function name to find
                 *    the inner dimension of an element
                 *
                 *    @var String
                 */
                dimension: "height",
            
                /**
                 *    The jQuery.fn function name to find
                 *    the outer dimension of an element
                 *
                 *    @var String
                 */
                outerDimension: "outerHeight",
            
                /**
                 *    The property of a WebKitCSSMatrix Object initialized
                 *    with the transform property of the given element
                 *    that should be used to determine position
                 *
                 *    @var String
                 */
                matrixProperty: "m42",
            
                /**
                 *    CSS/jQuery Selector for jQTouch
                 *
                 *    @var String
                 */
                selector: ".vertical-scroll > div",
            
                /**
                 *    The property on the touch property of the event 
                 *    object for calculating movement
                 *
                 *    @var String
                 */
                eventProperty: "pageY",
                
                /**
                 *    The base transform declaration
                 *
                 *    @var String
                 */
                tranform: supports3d ? "translate3d(0,{0}px,0)" : "translate(0,{0}px)",
                
                /**
                 *    
                 *
                 *    @var String
                 */
                slideProperty: "offsetTop"
            }),
            
            /**
             *    Horizontal default settings
             *
             *    @var Object
             */
            horizontal: $.extend({}, base, {
            
                /**
                 *    direction of the scroll, for internal use,
                 *    don't change this
                 *
                 *    @var String
                 */
                direction: "horizontal",
            
                /**
                 *    The jQuery.fn function name to find
                 *    the inner dimension of an element
                 *
                 *    @var String
                 */
                dimension: "width",
            
                /**
                 *    The jQuery.fn function name to find
                 *    the outer dimension of an element
                 *
                 *    @var String
                 */
                outerDimension: "outerWidth",
            
                /**
                 *    The property of a WebKitCSSMatrix Object initialized
                 *    with the transform property of the given element
                 *    that should be used to determine position
                 *
                 *    @var String
                 */
                matrixProperty: "m41",
            
                /**
                 *    CSS/jQuery Selector for jQTouch
                 *
                 *    @var String
                 */
                selector: ".horizontal-scroll > table",
            
                /**
                 *    The property on the touch property of the event 
                 *    object for calculating movement
                 *
                 *    @var String
                 */
                eventProperty: "pageX",
                
                /**
                 *    The base transform declaration
                 *
                 *    @var String
                 */
                tranform: supports3d ? "translate3d({0}px,0,0)" : "translate({0}px,0)",
                
                /**
                 *    slideHandler
                 *
                 *    @var String
                 */
                slideProperty: "offsetLeft"
            })
        },
            
        /**
         *    Dynamically determine the window height minus twice the toolbar height 
         *    for the CSS rule(s) that require specified heights
         *
         *    @var Function
         */
        bottomToolbar = function(vars){return (window.innerHeight - (vars.toolbarHeight * 2)) + "px !important"},
            
        /**
         *    Dynamically determine the window height minus the toolbar height 
         *    for the CSS rule(s) that require specified heights
         *
         *    @var Function
         */
        height = function(vars){return (window.innerHeight - vars.toolbarHeight) + "px"},
            
        /**
         *    Dynamically determine the window width for the CSS rule(s) that require specified widths
         *
         *    @var Function
         */
        width = function (){return window.innerWidth + "px";},
            
        /**
         *
         *
         *    @var Object
         */
        cssRules = {
            /**
             *
             *
             *    @var Object
             */
            variables : {
                toolbarHeight: 46
            },
            
            /**
             *    Base CSS rules, calculated on page load regardless of orientation
             *
             *    @var Object
             */
            defaults: {
                //the parent container
                ".vertical-scroll": {
                    position: "relative",
                    "z-index": 1,
                    overflow: "hidden",
                    "margin-bottom": "44px",
                    height: height
                },
                //the parent container with a toolbar
                ".vertical-scroll.use-bottom-toolbar": {
                    height: bottomToolbar
                },
                //the actual container being scrolled
                ".vertical-scroll > div": {
                    margin: "0 auto",
                    "padding-bottom":"15px",
                    "-webkit-transition-property": "-webkit-transform",
                    "-webkit-transition-timing-function": "cubic-bezier(0,0,.25,1)",
                    //overridden on element
                    "-webkit-transform": "translate3d(0,0,0)",
                    "-webkit-transition-duration": "0s",
                },
                //fullscreen rule
                ".vertical-scroll.use-bottom-toolbar": {
                    "margin-bottom": "0px"
                },
                //fullscreen rule
                ".vertical-scroll.use-bottom-toolbar > div": {
                    "padding-bottom":"0px"
                },
                //scrollbar rule
                ".scrollbar": {
                    "-webkit-transition-timing-function": "cubic-bezier(0,0,.25,1)",
                    "-webkit-transform": "translate3d(0,0,0)",
                    "-webkit-transition-property": "-webkit-transform,opacity",
                    "-webkit-transition-duration": "0,0,0,1s",
                    "-webkit-border-radius": "2px",
                    "pointer-events": "none",
                    opacity: 0,
                    background:"rgba(0,0,0,.5)",
                    //"-webkit-border-image": "-webkit-gradient(radial, 50% 50%, 2, 50% 50%, 4, from(rgba(0,0,0,.5)), to(rgba(0,0,0,.5))) 2",
                    //"-webkit-box-shadow": "0 0 3px rgba(255,255,255,.5)",
                    "-webkit-box-shadow": "0 0 2px rgba(255,255,255,.5)",
                    position: "absolute",
                    "z-index": 10,
                    width: "5px",
                    height: "5px"
                },
                //scrollbar rule
                ".scrollbar.vertical": {
                    top: "1px",
                    right: "1px"
                },
                //scrollbar horizontal
                ".scrollbar.horizontal": {
                    bottom: "1px",
                    left: "1px"
                },
                //parent container
                ".horizontal-scroll": {
                    width: width,
                    height: "100%",
                    overflow: "hidden",
                    padding: "0px",
                    position: "relative",
                    //not actually required
                    height: height,
                    "line-height":height
                },
                //actual element being scrolled
                ".horizontal-scroll > table": {
                    height: "100%",
                    "-webkit-transition-property": "-webkit-transform",
                    "-webkit-transition-timing-function": "cubic-bezier(0,0,.25,1)",
                    //overridden on element
                    "-webkit-transform": "translate3d(0,0,0)",
                    "-webkit-transition-duration": "0s",
                }
            },
            
            /**
             *    Only calculated if in portrait mode
             *
             *    @var Object
             */
            portrait: {
                ".portrait .vertical-scroll": {
                    position: "relative",
                    "z-index": 1,
                    overflow: "hidden",
                    height: height,        
                },
                ".portrait .vertical-scroll.use-bottom-toolbar,.portrait .horizontal-scroll.use-bottom-toolbar": {
                    height: bottomToolbar
                },
                ".portrait .horizontal-scroll": {
                    width: width
                },
                ".portrait .slide-container": {
                    height: height,
                    width: width
                }
            },
            
            /**
             *    Only calculated if in landscape mode
             *
             *    @var Object
             */
            landscape: {
                ".landscape .vertical-scroll": {
                    position: "relative",
                    "z-index": 1,
                    overflow: "hidden",
                    height: height,
                },
                ".landscape .vertical-scroll.use-bottom-toolbar,.landscape .horizontal-scroll.use-bottom-toolbar": {
                    height: bottomToolbar
                },
                ".landscape .horizontal-scroll": {
                    width: width
                },
                ".landscape .slide-container": {
                    height: height,
                    width: width
                }
            }
        };
    
    /*
     *    jQTouch extension
     *    
     */
    if ($.jQTouch) {
        
        $.jQTouch.addExtension(function (jQT) {
            var d = defaults;
            
            function binder (e, info) {
                var v = d.vertical, h = d.horizontal,
                    vertical = info.page.find(v.selector),
                    horizontal = info.page.find(h.selector);
                
                vertical.verticallyScroll(v.attributesToOptions(vertical, "vertical", v.attributes));
                horizontal.horizontallyScroll(h.attributesToOptions(horizontal, "horizontal", h.attributes));
            }
            
            $(document.body).bind("pageInserted", binder);
            
            $(function() {
                var v = d.vertical, 
                    h = d.horizontal;
                    
                $(v.selector)
                    .each(function() {
                        $(this).verticallyScroll(v.attributesToOptions($(this), "vertical", v.attributes));
                    });
                    
                $(h.selector)
                    .each(function() {
                        $(this).horizontallyScroll(h.attributesToOptions($(this), "horizontal", h.attributes));
                    });
            });
            
            return {};
        });
    }
    
    //$(window).bind("unload", window_unload);
    
    /**
     *    Handler for creating options out of attributes on the scroll container
     *
     *    @param DOMElement element
     *    @param String direction - "vertical" or "horizontal"
     *    @param Object attributes - @see base.attributes
     *    @return Object
     */
    function attributesToOptions (element, direction, attributes) {
        var options = {};
        
        $.each(attributes, function(name, value) {
            if ($.isFunction(value)) {
                options[name] = value(element, direction);
                
            } else if (element.attr(value) != undefined) {
                options[name] = element.attr(value);
            }
        });
        
        return options;
    }
    
    /*
     *    jQuery extensions
     *
     */
    
    /**
     *    Attach vertical inertia scrolling to one or more objects
     *
     *    @param Object options - optional
     *    @return jQuery
     */
    $.fn.verticallyScroll = function (options) {
        return this.inertiaScroll("vertical", options);
    };
    
    /**
     *    Attach horizontal inertia scrolling to one or more objects
     *
     *    @param Object options - optional
     *    @return jQuery
     */
    $.fn.horizontallyScroll = function (options) {
        return this.inertiaScroll("horizontal", options);
    };
    
    /**
     *    Attach inertia scrolling to one or more objects
     *
     *    @param Object options - optional
     *    @return jQuery
     */
    $.fn.inertiaScroll = function (direction, options) {
        options = $.extend(true, {}, defaults[direction], options || {});
        
        return this.each(function () {
            inertiaScroll(this, options);
        });
    };
    
    /**
     *    Static jQUery property
     *
     *
     *    @var Object
     */
    $.inertiaScroll = {
    
        /**
         *    Set and/or retrieve the inertia scroll defaults
         *
         *    @param Object options - @see defaults - optional
         *    @return Object
         */
        defaults: function (options) {
            if (options !== undefined) {
                defaults = $.extend(true, defaults, options);
            }
            
            return $.extend({}, defaults);
        },
        
        /**
         *    Set and/or retrieve the inertia scroll default CSS
         *
         *    @param Object options - @see cssRules - optional
         *    @return Object
         */
        defaultCSS: function (options) {
            if (options !== undefined) {
                cssRules = $.extend(true, cssRules, options);
            }
            
            return $.extend({}, cssRules);
        }
    };

    /**
     *    Initialize the component, bind event listeners, updates CSS, etc...
     *
     *    @param DOMElement element
     *    @param Object options - @see defaults
     *    @return null
     */
    function inertiaScroll (element, options) {
        var $element = $(element).data("jqt-scroll-options", options)
                            .css("webkitTransform", format(options.tranform, options.defaultOffset)),
            transform = $element.css("webkitTransform"),
            matrix = transform ? new WebKitCSSMatrix(transform) : {m41:0};
        
        $.each(options.events, function (name, func) {
            //these events get attatch
            //if (!name.match(/^touchend|touchcancel|touchmove/)) {
                element.addEventListener(name, func, false);
            //}
        });
        
        //additional bindings for jquery
        $element.bind("reset", options.events.reset)
                .bind("scrollTo", options.events.scrollTo);
        
        //store for later use
        options.currentPosition = matrix[options.matrixProperty];
        options.parentWidth = $element.parent()[options.dimension]();
        
        if (options.scrollBar && options.scrollBar === true && !options.scrollBarObject) {
            options.scrollBarObject = $.isFunction(options.scrollBar) ? 
                options.scrollBar($element.parent(), options.direction) :
                Scrollbar($element.parent(), options.direction);
        }
        
        return null;
    }

    /**
     *    The default touchstart event handler function,
     *    initializes the data for later use by the touchmove/end event handlers
     *
     *    @context scroll container
     *    @param Event event
     *    @return Boolean
     */
    function touchStart (event) {
        var $this = $(this),
            options = $this.data("jqt-scroll-options"),
            location = event.touches[0][options.eventProperty],
            matrix, mp,
            dimension = $this[options.outerDimension](),
            parent = $this.parent()[options.dimension](),
            //maxScroll
            endPoint = -(dimension - parent),
            //a distance to stop inertia from hitting
            quarter = parent / options.divider;
            
        //ignore some stuff
        if (!!options.ignore && $(event.target).is(options.ignore) || event.targetTouches.length !== options.numberOfTouches) { 
            return null;
        }
        
        options.parentDimension = parent;
        
        //sometimes this would be a bad idea
        if (options.scrollTopOnTouchstart) {
            window.scrollTo(0,0);
        }
        
        //figure out the base position
        matrix = new WebKitCSSMatrix($this.css("webkitTransform"));
        mp = matrix[options.matrixProperty];
        
        //store data for later
        $this.data("jqt-scroll-current-event", {
            startLocation: location,
            currentLocation: location,
            startPosition: mp,
            lastPosition: mp,
            currentPosition: mp,
            startTime: event.timeStamp,
            moved: false,
            lastMoveTime: event.timeStamp,
            parentDimension: parent,
            endPoint: endPoint,
            minScroll: !options.bounce ? 0 : quarter,
            maxScroll: !options.bounce ? endPoint : endPoint - quarter,
            end: false
        });
        
        if (options.scrollBarObject) {
            options.scrollBarObject.init(parent, dimension);
        }
        
        options.setPosition($this, options, mp, 0);
        
        if (options.preventDefault) {
            event.preventDefault();
            return false;
            
        } else {
            return true;
        }
    }

    /**
     *    The default touchmove event handler, performs 
     *    immediate changes to the position of the element
     *
     *    @context scroll container
     *    @param Event event
     *    @return Boolean
     */
    function touchMove (event) {
        var $this = $(this),
            options = $this.data("jqt-scroll-options"),
            data = $this.data("jqt-scroll-current-event"),
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
        
        if (options.scrollBarObject && !options.scrollBarObject.visible) {
            options.scrollBarObject.show();
        }
        
        options.setPosition($this, options, data.currentPosition, duration);
        
        if (options.preventDefault) {
            event.preventDefault();
            return false;
            
        } else {
            return true;
        }
    }

    /**
     *    The default touchend event handler, calculates
     *    necessary changes as a result of an event
     *
     *    @context scroll container
     *    @param Event event
     *    @return Boolean
     */
    function touchEnd (event) {
        var $this = $(this),
            options = $this.data("jqt-scroll-options"),
            data = $this.data("jqt-scroll-current-event"),
            theTarget, theEvent;
        
        if (!data.moved) {
            if (options.scrollBarObject) {
                options.scrollBarObject.hide();
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
                return false;
            }
        }
        
        if (options.useSlides && $.isFunction(options.slides.callback)) {
            options.slides.callback($this, options, data, event);
            
        } else {
            options.momentum($this, options, data, event);
        }
        
        options.setPosition($this, options, data.currentPosition, data.duration);
        
        if (options.preventDefault) {
            event.preventDefault();
            return false;
            
        } else {
            return true;
        }
    }
    
    /**
     *    The default transitionEnd event handler, ensures that
     *    container has not scrolled past its possible dimensions
     *    and returns to those dimensions where appropriate
     *
     *    @context scroll container
     *    @param Event event
     *    @return null
     */
    function transitionEnd (event) {
        
        var $this = $(this),
            options = $this.data("jqt-scroll-options"),
            data = $this.data("jqt-scroll-current-event");
        
        if (data && !data.end) {
            if (data.currentPosition > 0) {
                data.currentPosition = 0;
                options.setPosition($this, options, 0, options.bounceSpeed);
                
            } else if (data.currentPosition < data.endPoint) {
                data.currentPosition = data.endPoint;
                options.setPosition($this, options, data.endPoint, options.bounceSpeed);
                
            } else if (options.scrollBarObject) {
                options.scrollBarObject.hide();
            }
            data.end = true;
        } else if (options.scrollBarObject) {
            options.scrollBarObject.hide();
        }
        
        return null;
    }

    /**
     *    Calculate the momentum of a touch event
     *
     *    @param jQuery object
     *    @param Object options
     *    @param Object data
     *    @param Event event
     *    @return null
     */
    function momentum (object, options, data, event) {
        var m = Math
            duration = m.min(options.maxScrollTime, data.lastMoveTime - data.startTime),
            distance = data.startPosition - data.currentPosition,
            velocity = m.abs(distance) / duration,
            acceleration = duration * velocity * options.friction,
            momentum = m.round(distance * velocity),
            position = m.round(data.currentPosition - momentum);
        
        if (data.currentPosition > 0) {
            position = 0;
        } else if (data.currentPosition < data.endPoint) {
            position = data.endPoint;
        } else if (position > data.minScroll) {
            acceleration = acceleration * m.abs(data.minScroll / position);
            position = data.minScroll;
        } else if (position < data.maxScroll) {
            acceleration = acceleration * m.abs(data.maxScroll / position);
            position = data.maxScroll;
        }
        
        data.momentum = m.abs(momentum);
        data.currentPosition = position;
        data.duration = acceleration;
        
        return null;
    }

    /**
     *    Calculate the position of the slide which should be showing after a touch event ends
     *
     *    @param jQuery container
     *    @param Object options
     *    @param Object data
     *    @param Event event
     *    @return null
     */
    function slideTo (container, options, data, event) {
        var slides = container.find(options.slides.selector),
            current = slides.filter("."+options.slides.currentClass).eq(0),
            index,
            distance = data.startPosition - data.currentPosition,
            difference = current[options.dimension]() / options.slides.portion,
            duration;
        
        if (!current.length) {
            current = slides.eq(0);
        }
        
        index = slides.index(current[0]);
        slides.removeClass(options.slides.currentClass);
        
        if (data.currentPosition > 0) {
            position = 0;
            slides.eq(0).addClass(options.slides.currentClass);
        } else if (data.currentPosition < data.endPoint) {
            position = data.endPoint;
            slides.eq(slides.length-1).addClass(options.slides.currentClass);
        } else if (distance < -difference) {
            position = -slides.eq(index > 0 ? index - 1 : 0)
                            .addClass(options.slides.currentClass).parent().attr(options.slideProperty);
        } else if (distance > difference) {
            position = -slides.eq(index < slides.length-1 ? index + 1 : slides.length-1)
                            .addClass(options.slides.currentClass).parent().attr(options.slideProperty);
        } else {
            position = -current.addClass(options.slides.currentClass).parent().attr(options.slideProperty);
        }
        
        duration = Math.abs(data.currentPosition - position) * options.slides.easing;
        
        data.momentum = duration;
        data.currentPosition = position;
        data.duration = duration;
        
        return null;
    }

    /**
     *    Return the scroll container to its default position
     *
     *    @context scroll container
     *    @return mixed
     */
    function reset () {
        var $this = $(this),
            options = $this.data("jqt-scroll-options");
        return options.setPosition($this, options, options.defaultOffset, options.defaultDuration);
    }

    /**
     *    Return the scroll container to its default position
     *
     *    @context scroll container
     *
     *    @param Event event
     *    @param Number offset - position to move to
     *    @param Number duration - duration of the scroll
     *    @return mixed
     */
    function scrollTo (event, offset, duration) {
        var $this = $(this),
            options = $this.data("jqt-scroll-options");
            
        return options.setPosition($this, 
                                   options, 
                                   offset !== undefined ? offset : (event.detail || options.currentPosition), 
                                   duration !== undefined ? duration : options.defaultDuration);
    }

    /**
     *    Calculate the momentum of a touch event
     *
     *    @param jQuery object
     *    @param Object options
     *    @param Number position
     *    @param Number duration
     *    @param String timing - timing function
     *    @return jQuery
     */
    function setPosition (object, options, position, duration, timing) {
        
        if (options.scrollBarObject) {
            var dimension = (object.parent()[options.dimension]() - object[options.dimension]());
            
            if (position > 0) {
                dimension += Number(position);
            }
            
            options.scrollBarObject.scrollTo(options.scrollBarObject.maxScroll / dimension * position, 
                                              format("{0}ms", duration !== undefined ? duration : options.defaultDuration));
        }
        
        if (duration !== undefined) {
            object.css("webkitTransitionDuration", format("{0}ms", duration));
        }
        
        if (timing !== undefined) {
            object.css("webkitTransitionTimingFunction", timing);
        }
        
        options.currentPosition = position || 0;
        
        return object.css("webkitTransform", format(options.tranform, options.currentPosition));
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
     *    Entirely the work of Matteo Spinelli
     *    I just took out the overflow restriction and
     *    simplified the DOM creation with jQuery
     *
     *
     */
    function Scrollbar (object, direction) {
        if (!(this instanceof Scrollbar)) {
            return new Scrollbar(object, direction);
        }
        
        this.direction = direction;
        this.bar = $(document.createElement("div"))
            .addClass("scrollbar " + direction)
            .appendTo(object)[0];
    }
    
    Scrollbar.prototype = {
            direction: "vertical",
            transform: supports3d ? "translate3d({0}px,{1}px,0)" : "translate({0}px,{1}px)",
            size: 0,
            maxSize: 0,
            maxScroll: 0,
            visible: false,
            offset: 0,
            
            init: function (scroll, size) {
                this.offset = this.direction == "horizontal" ? 
                                this.bar.offsetWidth - this.bar.clientWidth : 
                                this.bar.offsetHeight - this.bar.clientHeight;
                                
                this.maxSize = scroll - 8;        // 8 = distance from top + distance from bottom
                this.size = Math.round(this.maxSize * this.maxSize / size) + this.offset;
                this.maxScroll = this.maxSize - this.size;
                this.bar.style[this.direction == "horizontal" ? "width" : "height"] = (this.size - this.offset) + "px";
            },
            
            setPosition: function (pos) {
                this.bar.style.webkitTransform = format(this.transform, 
                                                        this.direction == "horizontal" ? 
                                                        Math.round(pos) : 
                                                        0, 
                                                        this.direction == "horizontal" ? 
                                                        0 : 
                                                        Math.round(pos)
                                                        );
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
                o = window.innerHeight > window.innerWidth ? "portrait" : "landscape";
                
                $.each(rules[o], buildRules);
                
                $(document.createElement("style"))
                    .attr({type:"text/css",media:"screen"})
                    .html(stringRules)
                    .appendTo("head");
            },30)
        });
    });
    
})(jQuery);
