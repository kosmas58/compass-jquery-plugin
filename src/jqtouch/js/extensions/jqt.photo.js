/*!*
 *    Provides event handling for iPhone like photo gallery (without thumbnail portion)
 *
 *    @author Sam Shull <http://www.google.com/profiles/brickysam26>
 *    @copyright 2010 Sam Shull <http://samshull.blogspot.com/>
 *
 *    Special Thanks to Steve Simitzis <http://saturn5.com>
 *
 *    @license <http://www.opensource.org/licenses/mit-license.html>
 *
 *    Permission is hereby granted, free of charge, to any person obtaining a copy
 *    of this software and associated documentation files (the "Software"), to deal
 *    in the Software without restriction, including without limitation the rights
 *    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *    copies of the Software, and to permit persons to whom the Software is
 *    furnished to do so, subject to the following conditions:
 *    
 *    The above copyright notice and this permission notice shall be included in
 *    all copies or substantial portions of the Software.
 *    
 *    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *    THE SOFTWARE.
 *
 *    Custom Events handled by each gallery:
 *
 *        jqt-photo-slideto            - slide to a given index (e, [index = int [, options = Object [, slides = jQuery ] ] ] )
 *        jqt-photo-goto            - jump to a given index (e, [index = int [, options = Object [, slides = jQuery ] ] ] )
 *        jqt-photo-play                - start the slideshow from the given point
 *        jqt-photo-pause                - stop the slideshow
 *        jqt-photo-prev                - go to the previous slide
 *        jqt-photo-next                - go to the next slide
 *        jqt-photo-hide-toolbars        - hide the visibility of the toolbars
 *        jqt-photo-show-toolbars        - show the visibility of the toolbars
 *        jqt-photo-toggle-toolbars    - toggle the visibility of the toolbars
 */
(function($){
    //we need this in the algorithm
    if (!"WebKitCSSMatrix" in this) {
        return null;
    }
    
    /**
     *
     *
     *
     */
    var undefined, 
        
        /**
         *    keep track of the registered galleries for updates on resize
         *
         *    @var Array<Element>
         */
        galleries = [],
        
        /**
         *    Does the browser support Touch
         *
         *    @var Boolean
         */
        supportsTouch = "Touch" in this,
        
        /**
         *    event types
         *
         *    @var Object
         */
        events = supportsTouch ? {
            start: "touchstart",
            move: "touchmove",
            end: "touchend"
        } : {
            start: "mousedown",
            move: "mousemove",
            end: "mouseup"
        },
        
        controlPoints,
        
        /**
         *    keep track of whether or not the parsed class rule has been inserted
         *
         *    @var Boolean
         */
        parseRuleSet = false,
        
        //bring into context
        
        /**
         *    
         *
         *    @var Window
         */
        window = this,
        
        /**
         *    
         *
         *    @var Document
         */
        document = window.document,
        
        /**
         *    
         *
         *    @var Object
         */
        Math = window.Math,
        
        //simplify access to these functions
        
        /**
         *    
         *
         *    @var Function
         */
        min = Math.min,
        
        /**
         *    
         *
         *    @var Function
         */
        floor = Math.floor,
        
        /**
         *    
         *
         *    @var Function
         */
        sqrt = Math.sqrt,
        
        /**
         *    
         *
         *    @var Function
         */
        pow = Math.pow,
        
        /**
         *    
         *
         *    @var Function
         */
        abs = Math.abs,
        
        /**
         *    current orientation
         *
         *    @var String
         */
        orientation = abs(window.orientation) == 90 ? "landscape" : "portrait",
        
        /**
         *    The default options
         *
         *    @var Object
         */
        defaults = {
            /**
             *    A list of the images to be displayed in the gallery
             *
             *    @var Array<Object>
             */
            data: [],
            
            /**
             *    displays in title bar 
             *    - supports format 
             *        {0} = current index
             *        {1} = total number of slides
             *
             *    @var String
             */
            galleryName: "{0} of {1}",
            
            /**
             *    where to start the slides in the gallery - reset on pageAnimation out
             *
             *    @var Number
             */
            defaultIndex: 0,
            
            /**
             *    properties to animate
             *
             *    @var Number
             */
            transitionProperty: "-webkit-transform",
            
            /**
             *    timing function
             *
             *    @var String
             */
            timingFunction: "cubic-bezier(0,0,.25,1)",
            
            /**
             *    the reset transform of the table
             *
             *    @var String
             */
            transform: "translate3d({0}px,0,0)",
            
            /**
             *    The template to be used for transforming the IMG tag
             *
             *    @var String
             */
            imageTransform: "scale({0}) translate3d({1}px, {2}px, 0)",
            
            /**
             *    Maximum number of slides to keep in DOM at on time - before current slide
             *
             *    @var Number
             */
            maxSlidesBefore: 2,
            
            /**
             *    Maximum number of slides to keep in DOM at on time - after current slide
             *
             *    @var Number
             */
            maxSlidesAfter: 2,
            
            /**
             *    default delay between transitions for slideshow
             *
             *    @var Number
             */
            slideDelay: 5000,
            
            /**
             *    default speed for slide change
             *
             *    @var Number
             */
            scrollSpeed: 500,
            
            /**
             *    default speed for scale resizing - used on scaleEnd
             *
             *    @var Number
             */
            scaleSpeed: 500,
            
            /**
             *    should we try to dynamically render the CSS rules
             *
             *    @var Boolean
             */
            useDynamicStyleSheet: true,
            
            /**
             *    should a slideshow repeat by default
             *
             *    @var Boolean
             */
            repeatSlideShow: false,
            
            /**
             *    selector for the parent of the gallery
             *
             *    @var String
             */
            appendTo: "#jqt",
            
            /**
             *    the attribute name for storing the index of the slide in the data
             *
             *    @var String
             */
            dataAttribute: "data-index",
            
            /**
             *    tags to ignore
             *
             *    @var Array
             */
            tagNames: "A,INPUT,SELECT,TEXTAREA",
            
            //only used by template generator
            
            /**
             *    link to return
             *
             *    @var String
             */
            backLink: '<a class="back">Back</a>',
            
            /**
             *    a blank image tag's template
             *
             *    @var String
             */
            blankImage: '<img class="jqt-photo-img"/>',
            
            /**
             *    an individual slides template
             *
             *    @var String
             */
            slideTemplate: '<td class="jqt-photo-image-slide">\
                                <div class="jqt-photo-not-loaded">\
                                    <img class="jqt-photo-img"/>\
                                    <div class="jqt-photo-caption"></div>\
                                </div>\
                            </td>',
            
            /**
             *    CSS Rule for removing the max-width/max-height properties from the images
             *
             *    @var String
             */
            parsedClassTemplate: "#jqt .jqt-photo .jqt-photo-image-slide > .{0}{max-width:auto;max-height:auto;}",
            
            /**
             *    the overall psuedo page template of a gallery
             *
             *    @var String
             */
            galleryTemplate: '<div class="jqt-photo">\
                                    <div class="toolbar toolbar-top"><\/div>\
                                    <table class="jqt-photo-table">\
                                        <tr class="jqt-photo-slide-list"><\/tr>\
                                    <\/table>\
                                    <div class="toolbar toolbar-bottom">\
                                        <div class="jqt-photo-prev"></div>\
                                        <div class="jqt-photo-pause"></div>\
                                        <div class="jqt-photo-play"></div>\
                                        <div class="jqt-photo-next"></div>\
                                    <\/div>\
                                <\/div>',
            
            //psuedo events
            
            /**
             *    Handle the pageAnimationEnd event fired by jQTouch
             *    Resets the positions and scales
             *
             *    @var Function
             */
            pageAnimationEnd: pageAnimationEnd,
            
            /**
             *    Handle the pageAnimationStart event fired by jQTouch
             *    Resets the positions and scales
             *
             *    @var Function
             */
            pageAnimationStart: pageAnimationStart,
            
            /**
             *    Handle the transition of slides in a gallery
             *
             *    @var Function
             */
            slideTo: slideTo,
            
            /**
             *    Begin a slideshow on a gallery
             *
             *    @var Function
             */
            play: play,
            
            /**
             *    End a slideshow on a gallery
             *
             *    @var Function
             */
            pause: pause,
            
            /**
             *    Go to the next slide in the list
             *
             *    @var Function
             */
            next: next,
            
            /**
             *    Go to the previous slide in the list
             *
             *    @var Function
             */
            prev: prev,
            
            /**
             *    Go to a specific or implied slide
             *
             *    @var Function
             */
            goTo: goTo,
            
            /**
             *    Reveal the toolbars
             *
             *    @var Function
             */
            showToolbars: showToolbars,
            
            /**
             *    Hide the toolbars
             *
             *    @var Function
             */
            hideToolbars: hideToolbars,
            
            /**
             *    Show/Hide the toolbars where appropriate
             *
             *    @var Function
             */
            toggleToolbars: toggleToolbars,
            
            //mouse events
            
            /**
             *    Handle a touchstart event on the gallery
             *
             *    @var Function
             */
            touchStart: touchStart,
            
            /**
             *    Handle a drag start event (triggered by touchstart) - one-finger
             *
             *    @var Function
             */
            dragStart: dragStart,
            
            /**
             *    Event handler - move - one-finger
             *
             *    @var Function
             */
            drag: drag,
            
            /**
             *    Event handler - end - one-finger
             *
             *    @var Function
             */
            dragEnd: dragEnd,
            
            /**
             *    Event handler - start - two-fingers
             *
             *    @var Function
             */
            scaleStart: scaleStart,
            
            /**
             *    Event handler - move - two-fingers
             *
             *    @var Function
             */
            scale: scale,
            
            /**
             *    Event handler - end - two-fingers
             *
             *    @var Function
             */
            scaleEnd: scaleEnd,
            
            /**
             *    An event handler for the IMG load event
             *
             *    @var Function
             */
            loader: loader,
            
            /**
             *    Function provided for generating the slides
             *
             *    @var Function
             */
            createSlide: createSlide,
            
            /**
             *    Function provided for maintaining the sliding window of slides
             *
             *    @var Function
             */
            rearrange: rearrange,
            
            //classes
            
            /**
             *    Keep track of preloaded images
             *
             *    @var String
             */
            presizedClass: "jqt-photo-presized",
            
            /**
             *    keep track of images that have data
             *
             *    @var String
             */
            parsedClass: "jqt-photo-parsed",
            
            /**
             *    Class name for identifying the current slide
             *
             *    @var String
             */
            currentClass: "jqt-photo-current",
            
            /**
             *    Class name for designating that a slideshow is in progress 
             *    (and cause pause icon to show, not play icon)
             *
             *    @var String
             */
            playingClass: "jqt-photo-playing",
            
            /**
             *    Class name for designating that an image is not currently loaded
             *
             *    @var String
             */
            notLoadedClass: "jqt-photo-not-loaded",
            
            /**
             *    Class name for initiating an animation to show the toolbars
             *
             *    @var String
             */
            toolbarAnimationInClass: "jqt-photo-toolbar-animation-in",
            
            /**
             *    Class name for initiating an animation to hide the toolbars
             *
             *    @var String
             */
            toolbarAnimationOutClass: "jqt-photo-toolbar-animation-out",
            
            /**
             *    Class name for hiding toolbars - applied outside of animation
             *
             *    @var String
             */
            toolbarHideClass: "jqt-photo-toolbar-hidden",
            
            //selectors
            
            /**
             *    The selector for the container of the slides
             *
             *    @var String
             */
            tableSelector: ".jqt-photo-table",
            
            /**
             *    The selector for the caption of a slide
             *
             *    @var String
             */
            captionSelector: ".jqt-photo-caption",
            
            /**
             *    The selector of a slide container
             *
             *    @var String
             */
            slideSelector: ".jqt-photo-image-slide",
            
            /**
             *    The selector of the scalable element, relative to a slide
             *
             *    @var String
             */
            imageSelector: "img.jqt-photo-img",
            
            /**
             *    The selector of the title element
             *
             *    @var String
             */
            titleSelector: ".toolbar-top h1",
            
            /**
             *    The selector of row that contains the images
             *
             *    @var String
             */
            listSelector: ".jqt-photo-slide-list",
            
            /**
             *    The selector of the Play Icon
             *
             *    @var String
             */
            playSelector: ".jqt-photo-play",
            
            /**
             *    The selector of the Pause Icon
             *
             *    @var String
             */
            pauseSelector: ".jqt-photo-pause",
            
            /**
             *    The selector of the Next Icon
             *
             *    @var String
             */
            nextSelector: ".jqt-photo-next",
            
            /**
             *    The selector of the Previous Icon
             *
             *    @var String
             */
            prevSelector: ".jqt-photo-prev",
            
            /**
             *    The selector of a gallery element
             *
             *    @var String
             */
            gallerySelector: ".jqt-photo"
        },
        
        /**
         *    Calculate the desired position of the caption elements within the galleries
         *
         *    @var Function
         */
        caption = function(vars){return (window.innerHeight - vars.caption) + "px";},
        
        /**
         *    Calculate the desired height of the galleries and the slides
         *
         *    @var Function
         */
        height = function(){return window.innerHeight + "px";},
        
        /**
         *    Calculate the desired width of the galleries and the slides
         *
         *    @var Function
         */
        width = function(){return window.innerWidth + "px"},
        
        /**
         *    Calculate the desired position of the bottom toolbar elements within the galleries
         *
         *    @var Function
         */
        toolbar = function(vars){return (window.innerHeight - vars.toolbar) + "px";},
        
        /**
         *    The default CSS rules for dynamic insertion
         *
         *    @var Object
         */
        cssRules = {
        
            /**
             *    Variables used by the CSS "macros" for dynamically calculating positions and dimensions
             *
             *    @var Object
             */
            variables : {
                caption: 90,
                toolbar: 45
            },
        
            /**
             *    Default CSS rules
             *
             *    @var Object
             */
            defaults: {
                "#jqt .jqt-photo .toolbar-bottom" : {
                    top: toolbar
                },
                "#jqt .jqt-photo .jqt-photo-image-slide > div" : {
                    width: width,
                    height: height,
                    "line-height": height
                },
                "#jqt .jqt-photo .jqt-photo-image-slide .jqt-photo-caption" : {
                    top: caption,
                }
            },
        
            /**
             *    Portrait view CSS rules
             *
             *    @var Object
             */
            portrait: {
                "#jqt.portrait .jqt-photo" : {
                    height: height,
                    width: width,
                },
                "#jqt.portrait .jqt-photo .toolbar-bottom" : {
                    top: toolbar
                },
                "#jqt.portrait .jqt-photo .jqt-photo-image-slide > div" : {
                    width: width,
                    height: height,
                    "line-height": height,
                },
                "#jqt .jqt-photo .jqt-photo-image-slide .jqt-photo-caption" : {
                    top: caption,
                }
            },
        
            /**
             *    Landscape view CSS rules
             *
             *    @var Object
             */
            landscape: {
                "#jqt.landscape .jqt-photo" : {
                    height: height,
                    width: width,
                },
                "#jqt.landscape .jqt-photo .toolbar-bottom" : {
                    top: toolbar,
                },
                "#jqt.landscape .jqt-photo .jqt-photo-table" : {
                    height: height,
                },
                "#jqt.landscape .jqt-photo .jqt-photo-image-slide > div" : {
                    height: height,
                    width: width,
                    "line-height": height,
                },
                "#jqt.landscape .jqt-photo .jqt-photo-image-slide .jqt-photo-caption" : {
                    top: caption,
                }
            }
        };
    
    /*
     *    jQTouch extension
     */
    if ($.jQTouch) {
        //bind the extension
        $.jQTouch.addExtension(function(jqt) {   
            /*/event handler
            function binder (event, info) {
                if (info.page.is(defaults.gallerySelector)) {
                    info.page.jqtPhoto();
                }
            }
              
            //attach
            $(document.body).bind("pageInserted", binder);
            
            //attach to appropriate containers on DOMREADY
            $(function() {
                $(defaults.gallerySelector)
                    .each(function() {
                        binder(null, {page: $(this)});
                    });
            });
            */
            return {
                generateGallery: generateGallery, 
                /**
                 *    Jump to the index of a slide in a gallery
                 *
                 *    @param jQuery | String (selector) | Element gallery
                 *    @param Number index
                 *    @param String | Object animation
                 *    @param Boolean reverse
                 *    @return jQuery
                 */
                goToSlide: function (gallery, index, animation, reverse) {
                    //trigger this first
                    var g = $(gallery), options = g.data("jqt-photo-options"),slides = g.find(options.slideSelector);
                     
                    if (slides.index("."+options.currentClass) != index) {
                        slides.removeClass(options.currentClass).eq(index).addClass(options.currentClass);
                    }
                    
                    if (!g.hasClass("current")) {
                        jqt.goTo(g, animation || "slide", reverse);
                    }
                    
                    g.triggerHandler("jqt-photo-show-toolbars");
                    
                    return g;
                }
            };
        });
    }
    
    /**
     *    Generate a gallery and attach it to the #jqt element,
     *    additionally updates scaling data, so you don't have to
     *
     *    <code>
     *        images = [{src:"/somewhere1.jpg",caption:"Not Yet Implemented",width:200,height:200},
     *                  {src:"/somewhere2.jpg",caption:"Not Yet Implemented"}];
     *    </code>
     *
     *    @param String id
     *    @param Array<Object> images
     *    @param Object options - @see defaults
     *    @return jQuery
     */
    function generateGallery (id, images, options) {
        options = $.extend({}, defaults, options);
        
        options.data = images;
        
        if (!parseRuleSet) {
            parseRuleSet = true;
            var sheet = document.styleSheets[document.styleSheets.length-1];
			sheet.insertRule(
                format(options.parsedClassTemplate, options.parsedClass), 
                sheet.cssRules.length
            );
        }
        
        options.gallery = $(options.galleryTemplate).appendTo(options.appendTo);
        
        var list = options.list = options.gallery.find(options.listSelector),
            lower = options.defaultIndex - options.maxSlidesBefore,
            upper = options.defaultIndex + options.maxSlidesAfter,
            toolbar = options.gallery.attr("id", id)
                        .find(".toolbar-top")
                        .append(
                            $("<h1></h1>").html(
                                format(options.galleryName, options.defaultIndex + 1, images.length)
                            )
                        );
        
        if (options.backLink) {
            toolbar.append(options.backLink);
        }
        
        $.each(images, function(i, data) {
            list.append(options.createSlide(data, i, options, i >= lower && i <= upper));
        });
        
        return jqtPhoto(options.gallery[0], options);
    }
    
    /*
     *
     *    jQuery Extensions
     *
     */
    
    /**
     *    A jQuery prototype extension for enabling the photo gallery
     *    on a given set of elements
     *
     *    @param Object options
     *    @return jQuery
     */
    $.fn.jqtPhoto = function(options) {
        options = $.extend({}, defaults, options || {});
        return this.each(function(){jqtPhoto(this, options)});
    };
    
    /**
     *    A static jQuery extension for setting and retrieving the jQT-Photo defaults
     *
     *    
     */
    $.jqtPhoto = {
        generateGallery: generateGallery,
    
        /**
         *    Change and/or retrieve the default options
         *
         *    @param Object options - optional
         *    @return Object
         */
        defaults: function(options) {
            if (options) {
                defaults = $.extend(defaults, options);
            }
            
            return $.extend({}, defaults);
        },
    
        /**
         *    Change and/or retrieve the default CSS
         *
         *    @param Object options - optional
         *    @return Object
         */
        defaultCSS: function(options) {
            if (options !== undefined) {
                cssRules = $.extend(true, cssRules, options);
            }
            
            return $.extend({}, cssRules);
        }
    };
    
    /*
     *
     *    Functions
     *
     */
    
    /**
     *    Intialize the photo gallery
     *
     *    @param Element | String | jQuery element
     *    @param Object options
     *    @return jQuery
     */
    function jqtPhoto (element, options) {
        var $elem = $(element),
            slides = attachEvents($elem, options).find(options.slideSelector),
            images = slides.find(options.imageSelector);
        
        options.list = $elem.find(options.listSelector);
        
        options.table = tableData($elem.data("jqt-photo-options", options), options);
        
        options.blankImage = parseImageData($elem, $(options.blankImage).load(options.loader), options);
        
        if (!slides.filter("."+options.currentClass).length) {
            if (!slides.filter(format("[{0}={1}]", options.dataAttribute, options.defaultIndex)).addClass(options.currentClass).length) {
                slides.eq(0).addClass(options.currentClass);
            }
        }
        
        $elem.find(options.tableSelector).css({
            webkitTransitionProperty: options.transitionProperty,
            webkitTransitionTimingFunction: options.timingFunction,
            webkitTransitionDuration: options.defaultDuration + "s",
            webkitTransform: format(options.transform, -slides.filter("."+options.currentClass).attr("offsetLeft") || 0)
        });
        
        parseImageData($elem, images, options);
        
        galleries = galleries.concat($.makeArray($elem));
        
        return $elem;
    }
    
    /**
     *    Record the initial start position of the image list element
     *
     *    @param jQuery target
     *    @param Object options
     *    @return null
     */
    function tableData (target, options) {
        var table = target.find(options.tableSelector),
            transform = window.getComputedStyle(table[0]).webkitTransform,
            matrix = new WebKitCSSMatrix(transform);
        
        return table.data("jqt-photo-position", {x: Number(matrix.m41 || 0), gallery: target});
    }
    
    /**
     *    Attach event listeners to the gallery
     *
     *    To Do: refractor event listeners into delegate
     *
     *    @param jQuery target
     *    @param Object options
     *    @return jQuery
     */
    function attachEvents (target, options) {
        
        return target
                .each(function(){this.addEventListener(events.start, options.touchStart, false)})
                .bind("jqt-photo-slideto", options.slideTo)
                .bind("jqt-photo-goto", options.goTo)
                .bind("jqt-photo-play", options.play)
                .bind("jqt-photo-pause", options.pause)
                .bind("jqt-photo-prev", options.prev)
                .bind("jqt-photo-next", options.next)
                .bind("jqt-photo-hide-toolbars", options.hideToolbars)
                .bind("jqt-photo-show-toolbars", options.showToolbars)
                .bind("jqt-photo-toggle-toolbars", options.toggleToolbars)
                .bind("pageAnimationEnd", options.pageAnimationEnd)
                .bind("pageAnimationStart", options.pageAnimationStart);
    }
    
    /**
     *    Record initial slide data
     *
     *    @param jQuery images
     *    @param Object options
     *    @return jQuery
     */
    function parseImageData (target, images, options) {
        return images.each(function() {
            var t = $(this).addClass(options.parsedClass),
                matrix = new WebKitCSSMatrix(window.getComputedStyle(this).webkitTransform),
                scale = Number(matrix.m11),
                data = t.data("jqt-photo-info") || {}, 
                c = {
                    scale: scale,
                    top: Number(matrix.m42),
                    left: Number(matrix.m41),
                    width: t.width() * scale,
                    height: t.height() * scale,
                    parent: t.parent()
                };
            
            data.galleryOptions = options;
            data.gallery = data.gallery || target;
            
            data[orientation] = {current: c, original: $.extend({}, c)};
            
            t.data("jqt-photo-info", data);
        });
    }
    
    /**
     *    Distributive handling for touchstart events
     *
     *    To Do: refractor to use all event based triggers
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @return Boolean
     */
    function touchStart (event) {
        var target = $(event.target.nodeType == 3 ? event.target.parentNode : event.target), 
            $this = $(this),
            options = $this.data("jqt-photo-options"),
            tt = supportsTouch ? event.targetTouches : {length: !event.ctrlKey ? 1 : 2};
        
        if (target.is(options.tagNames)) {
            return null;
        }
        
        if (target.is(options.playSelector)) {
            if (!$this.hasClass(options.playingClass) && options.play) {
                return options.play.call(this, event);
            }
            
            return true;
            
        } else if (target.is(options.pauseSelector)) {
            if ($this.hasClass(options.playingClass) && options.pause) {
                return options.pause.call(this, event);
            }
            
            return true;
            
        } else if (target.is(options.nextSelector) && options.next) {
            return options.next.call(this, event);
            
        } else if (target.is(options.prevSelector) && options.prev) {
            return options.prev.call(this, event);
            
        } else if (tt.length == 2 && target.closest(options.imageSelector).length && options.scaleStart) {
            if ($this.hasClass(options.playingClass) && options.pause) {
                options.pause.call(this);
            }
            
            return options.scaleStart.call(this, event);
            
        } else if (tt.length == 1 && options.dragStart) {
            if ($this.hasClass(options.playingClass) && options.pause) {
                options.pause.call(this, event);
            }
            
            return options.dragStart.call(this, event);
        }
        
        return true;
    }
        
    /**
     *    Initialize a drag event
     *
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @return Boolean
     */
    function dragStart (event) {
        event.preventDefault();
        window.scrollTo(0,0);
        
        var $this = $(this),
            options = $this.data("jqt-photo-options"),
            table = $this.find(options.tableSelector).css("webkitTransitionDuration", "0s"),
            position = table.data("jqt-photo-position"),
            target = $(event.target).closest(options.imageSelector),
            data = target.data("jqt-photo-info") || false,
            offset = !!data && data[orientation] || false,
            current = !!offset && offset.current || {},
            tt = supportsTouch ? event.targetTouches[0] : event;
        
        this.addEventListener(events.move, options.drag, false);
        this.addEventListener(events.end, options.dragEnd, false);
        
        $this
            .data("jqt-photo-event", {
                table: table,
                position: {current: position.x, original: position.x},
                target: target.css("webkitTransitionDuration", "0s"),
                options: options,
                slides: table.find(options.slideSelector),
                moved: false,
                x: tt.pageX,
                y: tt.pageY,
                left: current.left || 0,
                top: current.top || 0,
                timeStamp: +new Date
            });
            
        return true;
    }
    
    /**
     *    Perform a drag event
     *
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @return Boolean
     */
    function drag (event) {
        event.preventDefault();
        
        var $this = $(this),
            original = $this.data("jqt-photo-event"),
            table = original.table,
            position = original.position,
            target = original.target,
            info = target.data("jqt-photo-info"),
            data = !!info && info[orientation] || false,
            current = data.current || false,
            tt = supportsTouch ? event.targetTouches[0] : event,
            distanceX = original.x - tt.pageX,
            distanceY = original.y - tt.pageY,
            w, h, x, y, l, t, d, 
            s = current.scale;
        
        original.moved = true;
        
        //image
        if (data) {
            $this.triggerHandler("jqt-photo-hide-toolbars", [original.options]);
            
            if (distanceX) {
                x = target.width() * s;
                w = current.parent.width();
                l = original.left;
                
                if (x > w) {
                    l -= distanceX / s;
                    distanceX = 0;
                    d = ((x - w) / s) / 2;
                    
                    if (l > d) {
                        distanceX = d - l;
                        l = d;
                    } else if (l < -d) {
                        distanceX = -(l + d);
                        l = -d;
                    }
                }
                
                current.left = floor(l);
            }
            
            if (distanceY) {
                y = target.height() * s;
                h = current.parent.height(),
                t = original.top;
                
                if (y > h) {
                    t -= distanceY / s;
                }
                
                current.top = floor(t);
            }
            
            target.css({
                webkitTransitionDuration: "0s",
                webkitTransform: format(original.options.imageTransform, s, current.left, current.top)
            });
        }
        
        //table
        position.current = position.original - distanceX;
        table.css({
                webkitTransitionDuration: "0s",
                webkitTransform: format(original.options.transform, position.current)
        });
        
        return true;
    }
    
    /**
     *    End and clean up a drag event
     *
     *
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @return Boolean
     */
    function dragEnd (event) {
        var $this = $(this),
            original = $this.data("jqt-photo-event"),
            table = original.table,
            tablePosition = table.data("jqt-photo-position"),
            position = original.position,
            target = original.target,
            info = target.data("jqt-photo-info"),
            data = !!info && info[orientation] || false,
            current = data.current || false,
            slides = original.slides,
            h, x, y, t, d, n, w,
            s = current.scale;
        
        this.removeEventListener(events.move, original.options.drag, false);
        this.removeEventListener(events.end, original.options.dragEnd, false);
        
        if (!original.moved) {
            $this.trigger("jqt-photo-toggle-toolbars");
            return dispatchClick(event.target);
        }
        
        event.preventDefault();
        
        //image
        if (data) {
            y = target.height() * s;
            h = current.parent.height(),
            t = current.top;
            
            if (y > h) {
                d = ((y - h) / s) / 2;
                
                if (t > d) {
                    t = d;
                } else if (t < -d) {
                    t = -d;
                }
            }
            
            current.top = floor(t);
            
            target.css({
                webkitTransitionDuration: original.options.scaleSpeed + "ms",
                webkitTransform: format(original.options.imageTransform, s, current.left, current.top)
            });
        }
        
        d = (+new Date() - original.timeStamp);
        
        //table
        if (position.current > 0) {
            tablePosition.x = 0;
            
        } else if (position.current < (slides.eq(slides.length-1).width() - table.outerWidth())) {
            tablePosition.x = (slides.eq(slides.length-1).width() - table.outerWidth());
            
        } else {
            n = tablePosition.x < position.current ? -1 : 1;
            x = slides.filter("."+original.options.currentClass);
            t = abs(x.attr("offsetLeft") + position.current);
            w = x.width() / 3;
            
            if (t > w) {
                $this.triggerHandler("jqt-photo-slideto", [slides.index(x[0]) + n, (d > 1000 ? 1000 : d), original.options, slides]);
                return true;
            }
        }
        
        table.css({
            webkitTransitionDuration: (d > 1000 ? 1000 : d) + "ms",
            webkitTransform: format(original.options.transform, tablePosition.x)
        });
        
        return true;
    }
    
    /**
     *    Initialize a scaling event
     *
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @return Boolean
     */
    function scaleStart (event) {
        event.preventDefault();
        window.scrollTo(0,0);
        
        var $this = $(this),
            options = $this.data("jqt-photo-options"),
            tt = supportsTouch ? 
                    event.targetTouches : 
                    [
                        {pageX: controlPoints.x - event.pageX, pageY: controlPoints.y - event.pageY},
                        event
                    ];
        
        this.addEventListener(events.move, options.scale, false);
        this.addEventListener(events.end, options.scaleEnd, false);
        
        try{
            this.removeEventListener(events.move, options.drag, false);
            this.removeEventListener(events.end, options.dragEnd, false);
        }catch(e){}
        
        $this.data("jqt-photo-event", {
                target: $(event.target).closest(options.imageSelector).css("webkitTransitionDuration", "0s"),
                options: options,
                distance: sqrt(
                    pow((tt[1].pageX - tt[0].pageX), 2)
                    + pow((tt[1].pageY - tt[0].pageY), 2)
                )
            })
            .find(".image-list")
            .css("webkitTransitionDuration", "0s");//end any transform on this table
            
        return true;
    }
    
    /**
     *    Perform a scaling event
     *
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @return Boolean
     */
    function scale (event) {
        if (event.targetTouches.length != 2) {
            return true;
        }
        
        event.preventDefault();
        
        var $this = $(this),
            original = $this.data("jqt-photo-event"),
            target = original.target,
            info = target.data("jqt-photo-info"),
            data = !!info && info[orientation] || false,
            tt = event.targetTouches,
            distance = sqrt(
                pow((tt[1].pageX - tt[0].pageX), 2) +
                pow((tt[1].pageY - tt[0].pageY), 2)
            ),
            difference = distance - original.distance,
            percentChange = (difference / original.distance) / 2,
            current = data.current,
            transform;
        
        if (!current) {
            parseImageData($this, target, original.options);
            info = target.data("jqt-photo-info");
            data = !!info && info[orientation] || false;
            current = data.current;
        }
        
        $this.triggerHandler("jqt-photo-hide-toolbars", [original.options]);
        
        transform = format(original.options.imageTransform, 
                        (current.scale = (current.scale + (current.scale * percentChange))), 
                        current.left, 
                        current.top                        
                   );
        
        original.distance = distance;
            
        target.css({webkitTransitionDuration: "0s", webkitTransform: transform});
        
        return true;
    }
    
    /**
     *    End a scaling event
     *
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @return Boolean
     */
    function scaleEnd (event) {
        event.preventDefault();
        
        var $this = $(this),
            original = $this.data("jqt-photo-event"),
            info = original.target.data("jqt-photo-info"),
            data = !!info && info[orientation] || false,
            current = data.current;
        
        this.removeEventListener(events.move, original.options.scale, false);
        this.removeEventListener(events.end, original.options.scaleEnd, false);
        
        if (!current) {
            parseImageData($this, original.target, original.options);
            info = original.target.data("jqt-photo-info");
            data = !!info && info[orientation] || false;
            current = data.current;
        }
        
        if (current.scale < data.original.scale) {
            current.scale = data.original.scale;
            current.left = data.original.left;
            current.top = data.original.top;
        }
        
        original.target.css({
            webkitTransitionDuration: original.options.scaleSpeed + "ms",
            webkitTransform: format(original.options.imageTransform, current.scale, current.left, current.top)
        });
        
        return true;
    }
    
    /**
     *    Dispatch a click event on a given target, in the event 
     *    a single-target touch event did not result in movement
     *
     *    @param Element target
     *    @return Boolean
     */
    function dispatchClick (target) {
        var theEvent = target.ownerDocument.createEvent("MouseEvents");
        theEvent.initEvent("click", true, true);
        target.dispatchEvent(theEvent);
        return true;
    }
    
    /**
     *    Begin a slideshow
     *
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @param Number index
     *    @return Boolean
     */
    function play (event, index) {
        event.preventDefault && event.preventDefault();
        
        var $this = $(this),
            options = $this.data("jqt-photo-options"),
            slides = $this.find(options.slideSelector),
            n = index === undefined || index < 0 
                ? Number(slides.filter("."+options.currentClass).attr(options.dataAttribute))
                : abs(index);
                
        addHover($this.addClass(options.playingClass), $this.find(options.pauseSelector)[0]);
        
        if (n != index) {
            $this.triggerHandler("jqt-photo-goto", [n, 0, options, slides]);
        }
        
        $this.data("jqt-photo-slide-timer", setInterval(function(){slideInterval($this, slides, options)}, options.slideDelay));
            //.triggerHandler("jqt-photo-hide-toolbars", [options]);
        
        return true;
    }
    
    /**
     *    Handler for slideshow intervals
     *
     *
     *
     *    @param jQuery target
     *    @param jQuery slides
     *    @param Object options
     *    @return null
     */
    function slideInterval (target, slides, options) {
        //current index + 1
        var index = Number(target.find(options.slideSelector).filter("."+options.currentClass).attr(options.dataAttribute)) + 1,
            func = "jqt-photo-slideto";//"slideTo";
        
        if (index === options.data.length) {
            if (!options.repeatSlideShow) {
                target.triggerHandler("jqt-photo-pause");
                return null;
            }
            index = 0;
            func = "jqt-photo-goto";//"goTo";
        }
        
        //options[func].call(target[0], {}, index, options.scrollSpeed, options);
        target.triggerHandler(func, [index, options.scrollSpeed, options, slides]);
        
        target.triggerHandler("jqt-photo-hide-toolbars", [options]);
        
        return null;
    }
    
    /**
     *    End a slideshow
     *
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @return Boolean
     */
    function pause (event) {
        event.preventDefault && event.preventDefault();
        
        var $this = $(this), 
            timer = $this.data("jqt-photo-slide-timer"), 
            options = $this.data("jqt-photo-options");
            
        addHover($this, $this.find(options.playSelector)[0]);
        
        clearInterval(timer);
        $this.removeClass(options.playingClass)
            .data("jqt-photo-slide-timer", null)
            .triggerHandler("jqt-photoshow-toolbars");
        
        return true;
    }
    
    /**
     *    Perform a slide to a given, or inferred next slide, using the data provided
     *
     *
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @param Number index
     *    @param Number duration
     *    @param Object options
     *    @param jQuery slides - optional;
     *    @return Boolean
     */
    function slideTo (event, index, duration, options, slides) {
        event.preventDefault && event.preventDefault();
        
        var $this = $(this), table, current, title, last, img;
            
        options = options || $this.data("jqt-photo-options");
        
        slides = slides || $this.find(options.slideSelector);
        
        table = options.table;
        
        index = Number(index || 0);
        //how long should this particular transition take?
        duration = duration === undefined || duration < 0 ? options.scrollSpeed : (Number(duration) || 0);
        
        if (index >= options.data.length) {
            $this.triggerHandler("jqt-photo-goto", [0, duration, options, slides]);
            return true;
        }
        
        if (index < 0) {
            index = options.data.length + index;
        }
        
        last = slides.filter("."+options.currentClass);
        
        //new current
        current = slides.removeClass(options.currentClass).filter(format("[{0}={1}]", options.dataAttribute, index));
        
        img = current.find(options.imageSelector);
        
        if (img.attr("src") != options.data[index].src) {
            img.parent().addClass(options.notLoadedClass);
            img.attr("src", options.data[index].src);
        }
        
        //new position
        position = -current.addClass(options.currentClass).attr("offsetLeft");
    
        if (position > 0) {
            position = 0;
        } else if (position < -(table.width()-current.width())) {
            position = -(table.width()-current.width());
        }
        
        //trigger slide change event
        $this.trigger("jqt-photo-slide-change", [index, duration, position]);
        //save the position
        table.data("jqt-photo-position").x = position;
        //atach animation end listener, and set necessary css properties
         table.one("webkitTransitionEnd", function() {
            options.rearrange(current, last, options);
        })
        .css({
            webkitTransitionDuration: duration+"ms",
            webkitTransform: format(options.transform, position)
        });
        
        //update the title of the gallery
        title = $this.find(options.titleSelector);
        title.html(format(options.galleryName || title.html(), Number(index) + 1, options.data.length));
        
        return true;
    }
    
    /**
     *    Jump to a given, or inferred next slide, using the data provided
     *
     *
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @param Number index    - optional; index of the slide to go to
     *    @param Number duration - optional; duration of the transition
     *    @param Object options - optional; the options associated with the gallery
     *    @param jQuery slides - optional;
     *    @return Boolean
     */
    function goTo (event, index, duration, options, slides) {
        event.preventDefault && event.preventDefault();
        
        var $this = $(this), table, current, title, last, img;
        
        options = options || $this.data("jqt-photo-options");
        
        slides = slides || $this.find(options.slideSelector);
        
        table = options.table;
        
        index = Number(index || 0);
        //how long should this particular transition take?
        duration = duration === undefined || duration < 0 ? options.scrollSpeed : (Number(duration) || 0);
        
        if (index >= options.data.length) {
            index = 0;
        }
        
        if (index < 0) {
            index = options.data.length + index;
        }
        
        last = slides.filter("."+options.currentClass);
        
        //new current
        current = slides.removeClass(options.currentClass).filter(format("[{0}={1}]", options.dataAttribute, index));
        
        img = current.find(options.imageSelector);
        
        if (img.attr("src") != options.data[index].src) {
            img.parent().addClass(options.notLoadedClass);
            img.attr("src", options.data[index].src);
        }
        
        //position of the new current
        position = -current.addClass(options.currentClass).attr("offsetLeft");
        
        if (position > 0) {
            position = 0;
        } else if (position < -(table.width()-current.width())) {
            position = -(table.width()-current.width());
        }
        
        //save the position
        table.data("jqt-photo-position").x = position;
        //reset scales after slide and set css to cause the slide
        table.css({
            webkitTransitionDuration: "0s",
            webkitTransform: format(options.transform, position)
        });
        
        //update the title
        //title element
        title = $this.find(options.titleSelector);
        title.html(format(options.galleryName || title.html(), Number(index) + 1, options.data.length));
        
        options.rearrange(current, last, options);
        
        return true;
    }
    
    /**
     *    Reassign the img tags with src attributes in order to maintain the 
     *    memory consumption
     *
     *    @param jQuery current - the current slide
     *    @param jQuery last - the previous slide
     *    @param Object options - the gallery options
     *    @return Boolean
     */
    function rearrange (current, last, options) {
        var next = current.next()
            prev = current.prev();
            
        next.length && next.find(options.imageSelector).attr("src", options.data[next.attr(options.dataAttribute)].src);
            
        prev.length && prev.find(options.imageSelector).attr("src", options.data[prev.attr(options.dataAttribute)].src);
        
        current.prevAll().slice(options.maxSlidesBefore)
            .find(options.imageSelector)
            .filter("[src]")
            .each(function() {
                var clone = options.blankImage.clone(true),
                    $this = $(this);
                
                $this.parent().addClass(options.notLoadedClass);
                $this.replaceWith(clone);
                
                parseImageData($this, clone, options);
            });
            
        current.nextAll().slice(options.maxSlidesAfter)
            .find(options.imageSelector)
            .filter("[src]")
            .each(function() {
                var clone = options.blankImage.clone(true),
                    $this = $(this);
                
                $this.parent().addClass(options.notLoadedClass);
                $this.replaceWith(clone);
                
                parseImageData($this, clone, options);
            });
        
        if (last[0] !== current[0]) {
            resetDimensions(last.find(options.imageSelector));
        }
        
        return true;
    }
    
    /**
     *    Transition to previous slide (or last slide) in gallery
     *
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @return Boolean
     */
    function prev (event) {
        event.preventDefault && event.preventDefault();
        
        var $this = $(this),
            options = $this.data("jqt-photo-options"),
            slides = $this.find(options.slideSelector),
            index = Number(slides.filter("."+options.currentClass).attr(options.dataAttribute));
           
        addHover($this, event.target);
           
        $this.triggerHandler("jqt-photo-goto", [index - 1, 0, options, slides]);
        
        return true;
    }
    
    /**
     *    Transition to next slide (or first slide) in gallery
     *
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @return Boolean
     */
    function next (event) {
        event.preventDefault && event.preventDefault();
        
        var $this = $(this),
            options = $this.data("jqt-photo-options"),
            slides = $this.find(options.slideSelector),
            index = Number(slides.filter("."+options.currentClass).attr(options.dataAttribute));
           
        addHover($this, event.target);
           
        $this.triggerHandler("jqt-photo-goto", [index + 1, 0, options, slides]);
        
        return true;
    }
    
    /**
     *    Trigger an animation to slide up/slide down the toobars on a given gallery
     *    using a predetermined class
     *
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @param Object options
     *    @return null
     */
    function toggleToolbars (event, options) {
        if (event && event.target && event.target.tagName === "A") {
            return null;
        }
        
        var gallery = $(this);
        
        options = options || gallery.data("jqt-photo-options");
        
        if (gallery.hasClass(options.toolbarHideClass)) {
            gallery.triggerHandler("jqt-photo-show-toolbars", [options]);
            
        } else {
            gallery.triggerHandler("jqt-photo-hide-toolbars", [options]);
        }
        return null;
    }
    
    /**
     *    Trigger an animation to slide up the toobars on a given gallery
     *    using a predetermined class
     *
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @param Object options
     *    @return null
     */
    function hideToolbars (event, options) {
        var gallery = $(this);
        
        options = options || gallery.data("jqt-photo-options");
        
        if (!gallery.hasClass(options.toolbarHideClass)) {
            gallery.one("webkitTransitionEnd",function() {
                gallery.addClass(options.toolbarHideClass)
                    .removeClass(options.toolbarAnimationOutClass);
            })
            .addClass(options.toolbarAnimationOutClass);
        }
        return null;
    }
    
    /**
     *    Trigger an animation to slide down the toobars on a given gallery
     *    using a predetermined class
     *
     *
     *    @context The gallery element
     *
     *    @param Event event
     *    @param Object options
     *    @return null
     */
    function showToolbars (event, options) {
        var gallery = $(this);
        
        options = options || gallery.data("jqt-photo-options");
        
        if (gallery.hasClass(options.toolbarHideClass)) {
            gallery.one("webkitTransitionEnd",function() {
                gallery.removeClass(options.toolbarAnimationInClass);
            })
            .addClass(options.toolbarAnimationInClass)
            .removeClass(options.toolbarHideClass);
        }
        return null;
    }
    
    /**
     *    The jQTouch animation start event
     *
     *    @context The gallery element
     *
     *    @param jQuery.Event event
     *    @param Object info
     *    @return null
     */
    function pageAnimationStart (event, info) {
        if (info && info.direction == "in") {
            var $this = $(this),
                options = $this.data("jqt-photo-options"),
                slides = $this.find(options.slideSelector),
                index = Number(slides.filter("."+options.currentClass).attr(options.dataAttribute)),
                n = index > -1 ? index : (options.defaultIndex > -1 ? options.defaultIndex : 0);
                //n = (options.defaultIndex > -1 ? options.defaultIndex : 0);
                     
            if (slides.index("."+options.currentClass) != n) {
                $this.triggerHandler("jqt-photo-goto", [n, 0, options, slides]);
                $this.triggerHandler("jqt-photo-show-toolbars");
            }
        }
        return null;
    }
    
    /**
     *    The jQTouch animation end event
     *
     *    @context The gallery element
     *
     *    @param jQuery.Event event
     *    @param Object info
     *    @return null
     */
    function pageAnimationEnd (event, info) {
        var $this = $(this),
            options = $this.data("jqt-photo-options"),
            slides = $this.find(options.slideSelector),
            index,n;
            //n = (options.defaultIndex > -1 ? options.defaultIndex : 0);
                
        if (info && info.direction == "out") {
            $this.triggerHandler("jqt-photo-goto", [options.defaultIndex, 0, options, slides]);
            $this.triggerHandler("jqt-photo-show-toolbars");
        } else {
            index = Number(slides.filter("."+options.currentClass).attr(options.dataAttribute));
            n = index > -1 ? index : (options.defaultIndex > -1 ? options.defaultIndex : 0)
            $this.triggerHandler("jqt-photo-goto", [n, 0, options, slides]);
        }
        return null;
    }
    
    /**
     *    Create a slide for insertion using the provided information
     *
     *    @param Object data - the information about the slide
     *    @param Number index - index of the data in the list
     *    @param Object options - the information about the gallery
     *    @param Boolean inWindow - in the slide window
     */
    function createSlide (data, index, options, inWindow) {
        var slide = $(data.template || options.slideTemplate).attr(options.dataAttribute, index),
            img = slide.find(options.imageSelector);
        
        parseImageData(options.gallery, img.load(options.loader), options);
        
        if (inWindow) {
            img.attr("src", data.src);
        }
        
        if (data.caption) {
            slide.find(options.captionSelector).html(data.caption);
        }
                        
        return slide;               
    }
    
    /**
     *    Reset the scale and position of the given images
     *
     *    @param jQuery images
     *    @return jQuery
     */
    function resetDimensions (images) {
        return images.each(function(i) {
            var t = $(this),
                data = t.data("jqt-photo-info"),
                d = data[orientation];//,p;
            
            /*if (!d) {
                p = t.parent(defaults.gallerySelector);
                parseImageData(p, t, p.data("jqt-photo-options"));
                d = data[orientation];
            }*/
            
            //image should be resized?
            if (d && d.current.scale != 1 && d.current.scale != d.original.scale) {
                t.css({
                    webkitTransitionDuration: "0s", 
                    webkitTransform: format(data.galleryOptions.imageTransform, 
                                            d.current.scale = d.original.scale,
                                            d.current.left = d.original.left,
                                            d.current.top = d.original.top
                                     )
                });
                
                d.current.width = d.original.width;
                d.current.height = d.original.height;
            }
            return null;
        });
    }
    
    /**
     *    Add the hover class to the given element on touchstart
     *
     *    @param jQuery gallery
     *    @param DOMElement | jQuery element
     *    @return null
     */
    function addHover (gallery, element) {
        $(element).addClass("hover")
        gallery.one("touchend", function(){$(element).removeClass("hover")});
        return null;
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
     *    window.onorientationchange event handler updates all slide data for the new orientation
     *    (if it doesn't already exist) and resets the scale of the images
     *
     *    @return null
     */
    function onorientationchange () {
        orientation = abs(window.orientation) == 90 ? "landscape" : "portrait";
        
        //effectively this shouldn't be necessary, but it appears to be
        $("#jqt").removeClass("portrait landscape").addClass(orientation);
        
        //make sure the slides line up appropriately, use delay to ensure repaint has passed
        setTimeout(function(){
            var playing = [],
                loop = function() {
                    var $this = $(this), 
                        options = $this.data("jqt-photo-options"),
                        slides = $this.find(options.slideSelector),
                        images =  slides.find(options.imageSelector);
                    
                    //if ($this.is(":visible")) {
                        alignSlides($this, slides, options);
                    //}
                    
                    if ($this.hasClass(options.playingClass)) {
                        playing.push(this);
                        $this.triggerHandler("jqt-photo-pause");
                    }
                    
                    //if (!images.data("jqt-photo-info")[orientation]) {
                    //    parseImageData($this, images, defaults);
                    //}
                    
                    resetDimensions(images.filter("[src]"));
                };
            
            $(galleries).filter(":visible").each(loop).end().filter(":not(:visible)").each(loop);
            
            $(playing).triggerHandler("jqt-photo-play");
            
        }, 10);
            
        controlPoints = {x: window.innerWidth/2, y: window.innerHeight/2};
        
        return null;
    }
    
    /**
     *    Reset the transform after an orientation change
     *    to ensure that the slides are correctly aligned
     *
     *
     *
     *    @param jQuery galleries
     *    @return jQuery
     */
    function alignSlides ($this, slides, options) {
        table = $this.find(options.tableSelector),
        position = -slides.filter("."+options.currentClass).attr("offsetLeft");
                
        table.data("jqt-photo-position").x = position;
        
        table.css({
            webkitTransitionDuration: "0s",
            webkitTransform: format(options.transform, position)
        });
        
        return null;
    }
    
    /**
     *    image onload event handler
     *
     *    @context An IMG tag
     *
     *    @return null
     */
    function loader () {
        var innerWidth = window.innerWidth,
            innerHeight = window.innerHeight,
            $this = $(this),
            w = $this.width(),
            h = $this.height(),
            top, left,
            scale = min(min(w, innerWidth)/w, min(h, innerHeight)/h),
            width = w * scale,
            height = h * scale,
            data = $this.data("jqt-photo-info"),
            options = data.galleryOptions;
        
        $this.parent().removeClass(options.notLoadedClass);
        
        if (!$this.is(":visible")) {
            data.gallery.one("pageAnimationEnd", function(){parseImageData(data.gallery, $this, data.galleryOptions)});
            
        } else if (width > innerWidth || height > innerHeight) {
            
            left = -floor(((width - innerWidth) / scale) / 2);
            
            top = -floor(((height - innerHeight) / scale) / 2);
            
            $this.css({
                 webkitTransitionDuration: "0s",
                 webkitTransform: format(options.imageTransform, scale, left, top)
            })
            .addClass(options.presizedClass);
            
            data = data[orientation];
            data.current.scale = data.original.scale = scale;
            data.current.left = data.original.left = left;
            data.current.top = data.original.top = top;
            data.current.width = data.original.width = width * scale;
            data.current.height = data.original.height = height * scale;
        } 
        
        return null;
    }
    
    //load the css on dom ready
    $(function() {
        window.scrollTo(0,0);
        controlPoints = {x: window.innerWidth/2, y: window.innerHeight/2};
        
        if (defaults.useDynamicStyleSheet) {
            var stringRules = "", 
                rules = cssRules, 
                o = window.innerHeight > window.innerWidth ? "portrait" : "landscape",
                buildProperties = function(name, value) {
                    stringRules += name + ":" + ($.isFunction(value) ? value(rules.variables) : value) + ";";
                },
                buildRules = function(name, properties) {
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
            
            //make sure the css is correct on orientationchange
            $(window).one("orientationchange", function() {
                //ensure repaint
                //setTimeout(function() {
                    window.scrollTo(0,0);
                    
                    orientation = abs(window.orientation) == 90 ? "landscape" : "portrait";
        
                    //effectively this shouldn't be necessary, but it appears to be
                    $("#jqt").removeClass("portrait landscape").addClass(orientation);
                    
                    stringRules = "";
                    
                    $.each(rules[orientation], buildRules);
                    
                    $(document.createElement("style"))
                        .attr({type:"text/css",media:"screen"})
                        .html(stringRules)
                        .appendTo("head");
                //}, 10);
            });
        }
        //Orientation event listener bind
        $(window).bind("orientationchange", onorientationchange);
        //http://cubiq.org/iscroll-3-3-beta-2
        //use resize instead of orientationchange
        //$(window).bind("resize", onorientationchange);
    });
    
})(jQuery);
