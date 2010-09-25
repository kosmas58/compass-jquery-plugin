/*

            _/    _/_/    _/_/_/_/_/                              _/
               _/    _/      _/      _/_/    _/    _/    _/_/_/  _/_/_/
          _/  _/  _/_/      _/    _/    _/  _/    _/  _/        _/    _/
         _/  _/    _/      _/    _/    _/  _/    _/  _/        _/    _/
        _/    _/_/  _/    _/      _/_/      _/_/_/    _/_/_/  _/    _/
       _/
    _/

    Created by David Kaneda <http://www.davidkaneda.com>
    Documentation and issue tracking on Google Code <http://code.google.com/p/jqtouch/>

    Special thanks to Jonathan Stark <http://jonathanstark.com/>
    and pinch/zoom <http://www.pinchzoom.com/>

    (c) 2009 by jQTouch project members.
    See LICENSE.txt for license.

    $Revision: 148 $
    $Date: 2010-04-24 17:00:00 -0400 (Sat, 24 Apr 2010) $
    $LastChangedBy: davidcolbykaneda $

*/

(function($) {
    $.jQTouch = function(options) {

        // Set support values
        $.support.WebKitCSSMatrix = (typeof WebKitCSSMatrix == "object");
        $.support.touch = (typeof Touch == "object");
        $.support.WebKitAnimationEvent = (typeof WebKitTransitionEvent == "object");

        // Initialize internal variables
        var $body,
            $head=$('head'),
            hist=[],
            newPageCount=0,
            jQTSettings={},
	        hashCheckInterval,
            currentPage,
            orientation,
            isMobileWebKit = RegExp(" Mobile/").test(navigator.userAgent),
            tapReady=true,
            lastAnimationTime=0,
            touchSelectors=[],
            publicObj={},
            tapBuffer=351,
            extensions=$.jQTouch.prototype.extensions,
            defaultAnimations=['slide','flip','slideup','swap','cube','pop','dissolve','fade','back'],
            animations=[],
            hairextensions='';
        // Get the party started
        init(options);

        function init(options) {

            var defaults = {
                addGlossToIcon: true,
                backSelector: '.back, .cancel, .goback',
                cacheGetRequests: true,
                cubeSelector: '.cube',
                dissolveSelector: '.dissolve',
                fadeSelector: '.fade',
                fixedViewport: true,
                flipSelector: '.flip',
                formSelector: 'form',
                fullScreen: true,
                fullScreenClass: 'fullscreen',
                icon: null,
                touchSelector: 'a, .touch',
                popSelector: '.pop',
                preloadImages: false,
                slideSelector: '#jqt > * > ul li a, .slide',
                slideupSelector: '.slideup',
                startupScreen: null,
                statusBar: 'default', // other options: black-translucent, black
                submitSelector: '.submit',
                swapSelector: '.swap',
                useAnimations: true,
                useFastTouch: true // Experimental.
            };
            jQTSettings = $.extend({}, defaults, options);

            // Preload images
            if (jQTSettings.preloadImages) {
                for (var i = jQTSettings.preloadImages.length - 1; i >= 0; i--) {
                    (new Image()).src = jQTSettings.preloadImages[i];
                };
            }
            // Set icon
            if (jQTSettings.icon) {
                var precomposed = (jQTSettings.addGlossToIcon) ? '' : '-precomposed';
                hairextensions += '<link rel="apple-touch-icon' + precomposed + '" href="' + jQTSettings.icon + '" />';
            }
            // Set startup screen
            if (jQTSettings.startupScreen) {
                hairextensions += '<link rel="apple-touch-startup-image" href="' + jQTSettings.startupScreen + '" />';
            }
            // Set viewport
            if (jQTSettings.fixedViewport) {
                hairextensions += '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0;"/>';
            }
            // Set full-screen
            if (jQTSettings.fullScreen) {
                hairextensions += '<meta name="apple-mobile-web-app-capable" content="yes" />';
                if (jQTSettings.statusBar) {
                    hairextensions += '<meta name="apple-mobile-web-app-status-bar-style" content="' + jQTSettings.statusBar + '" />';
                }
            }
            if (hairextensions) {
                $head.prepend(hairextensions);
            }

            // Initialize on document ready:
            $(document).ready(function() {

                // Add extensions
                for (var i in extensions) {
                    var fn = extensions[i];
                    if ($.isFunction(fn)) {
                        $.extend(publicObj, fn(publicObj));
                    }
                }

                // Add animations
                for (var i in defaultAnimations) {
                    var name = defaultAnimations[i];
                    var selector = jQTSettings[name + 'Selector'];
                    if (typeof(selector) == 'string') {
                        addAnimation({name:name, selector:selector});
                    }
                }

                touchSelectors.push('input');
                touchSelectors.push(jQTSettings.touchSelector);
                touchSelectors.push(jQTSettings.backSelector);
                touchSelectors.push(jQTSettings.submitSelector);
                $(touchSelectors.join(', ')).css('-webkit-touch-callout', 'none');
                $(jQTSettings.backSelector).tap(liveTap);
                $(jQTSettings.submitSelector).tap(submitParentForm);

                $body = $('#jqt');

                if (jQTSettings.fullScreenClass && window.navigator.standalone == true) {
                    $body.addClass(jQTSettings.fullScreenClass + ' ' + jQTSettings.statusBar);
                }

                // Create custom live events
                $body
                    .bind('touchstart', handleTouch)
                    .bind('orientationchange', updateOrientation)
                    .trigger('orientationchange')
                    .submit(submitForm);

                if (jQTSettings.useFastTouch && $.support.touch) {
                    $body.click(function(e) {
                        var timeDiff = (new Date()).getTime() - lastAnimationTime;
                        if (timeDiff > tapBuffer) {
                            var $el = $(e.target);

                            if ($el.attr('nodeName')!=='A' && $el.attr('nodeName')!=='AREA' && $el.attr('nodeName')!=='INPUT') {
                                $el = $el.closest('a, area');
                            }

                            if ($el.isExternalLink()) {
                                return true;
                            }
                        }
                        
                        return false;
                        
                    });

                    // This additionally gets rid of form focusses
                    $body.mousedown(function(e) {
                        var timeDiff = (new Date()).getTime() - lastAnimationTime;
                        if (timeDiff < tapBuffer) {
                            return false;
                        }
                    });
                }

                // Make sure exactly one child of body has "current" class
                if ($('#jqt > .current').length == 0) {
                    currentPage = $('#jqt > *:first');
                } else {
                    currentPage = $('#jqt > .current:first');
                    $('#jqt > .current').removeClass('current');
                }

                // Go to the top of the "current" page
                $(currentPage).addClass('current');
                location.hash = '#' + $(currentPage).attr('id');
                addPageToHistory(currentPage);
                scrollTo(0, 0);
                startHashCheck();
            });
        }

        // PUBLIC FUNCTIONS
        function goBack(to) {
            // Init the param
            if (hist.length <= 1)
            {
                window.history.go(-2);
            }
            
            var numberOfPages = Math.min(parseInt(to || 1, 10), hist.length-1),
                curPage = hist[0];

            // Search through the history for an ID
            if(isNaN(numberOfPages) && typeof(to) === "string" && to != '#' ) {
                for( var i=1, length=hist.length; i < length; i++ ) {
                    if( '#' + hist[i].id === to ) {
                        numberOfPages = i;
                        break;
                    }
                }
            }

            // If still nothing, assume one
            if(isNaN(numberOfPages) || numberOfPages < 1) {
                numberOfPages = 1;
            };

            if (hist.length > 1) {
                // Remove all pages in front of the target page
                hist.splice(0, numberOfPages);
                animatePages(curPage.page, hist[0].page, curPage.animation, curPage.reverse === false);
            } else {
                location.hash = '#' + curPage.id;
            }

            return publicObj;
        }
        function goTo(toPage, animation, reverse) {
            var fromPage = hist[0].page;

            if (typeof(animation) === 'string') {
                for (var i = animations.length - 1; i >= 0; i--) {
                    if (animations[i].name === animation) {
                        animation = animations[i];
                        break;
                    }
                }
            }
            if (typeof(toPage) === 'string') {
                nextPage = $(toPage);
                if (nextPage.length < 1)
                {
                    showPageByHref(toPage, {
                        'animation': animation
                    });
                    return;
                }
                else
                {
                    toPage = nextPage;
                }
                
            }
            if (animatePages(fromPage, toPage, animation, reverse)) {
                addPageToHistory(toPage, animation, reverse);
                return publicObj;
            } else {
                console.error('Could not animate pages.');
                return false;
            }
        }
        function getOrientation() {
            return orientation;
        }

        // PRIVATE FUNCTIONS
        function liveTap(e){

            // Grab the clicked element
            var $el = $(e.target);

            if ($el.attr('nodeName')!=='A' && $el.attr('nodeName')!=='AREA') {
                $el = $el.closest('a, area');
            }

            var target = $el.attr('target'),
                hash = $el.attr('hash'),
                animation=null;

            if (tapReady == false || !$el.length) {
                console.warn('Not able to tap element.');
                return false;
            }

            if ($el.isExternalLink()) {
                $el.removeClass('active');
                return true;
            }

            // Figure out the animation to use
            for (var i = animations.length - 1; i >= 0; i--) {
                if ($el.is(animations[i].selector)) {
                    animation = animations[i];
                    break;
                }
            };

            // User clicked an internal link, fullscreen mode
            if (target == '_webapp') {
                window.location = $el.attr('href');
            }
            // User clicked a back button
            else if ($el.is(jQTSettings.backSelector)) {
                goBack(hash);
            }
            // Allow tap on item with no href
            else if ($el.attr('href') == '#') {
                $el.unselect();
                return true;
            }
            // Branch on internal or external href
            else if (hash && hash!='#') {
                $el.addClass('active');
                goTo($(hash).data('referrer', $el), animation, $(this).hasClass('reverse'));
            } else {
                $el.addClass('loading active');
                showPageByHref($el.attr('href'), {
                    animation: animation,
                    callback: function() {
                        $el.removeClass('loading'); setTimeout($.fn.unselect, 250, $el);
                    },
                    $referrer: $el
                });
            }
            return false;
        }
        function addPageToHistory(page, animation, reverse) {
            // Grab some info
            var pageId = page.attr('id');
            // Prepend info to page history
            hist.unshift({
                page: page,
                animation: animation,
                reverse: reverse || false,
                id: pageId
            });
        }
        function animatePages(fromPage, toPage, animation, backwards) {
            // Error check for target page
            if (toPage.length === 0) {
                $.fn.unselect();
                console.error('Target element is missing.');
                return false;
            }

            // Error check for fromPage=toPage
            if (toPage.hasClass('current')) {
                $.fn.unselect();
                console.error('Target element is the current page.');
                return false;
            }

            // Collapse the keyboard
            $(':focus').blur();

            // Make sure we are scrolled up to hide location bar
            toPage.css('top', window.pageYOffset);

            // Define callback to run after animation completes
            var callback = function animationEnd(event) {

                fromPage[0].removeEventListener('webkitTransitionEnd', callback);
                fromPage[0].removeEventListener('webkitAnimationEnd', callback);

                if (animation) {
                        toPage.removeClass('start in ' + animation.name);
                        fromPage.removeClass('start out current ' + animation.name);
                    if (backwards) {
                        toPage.toggleClass('reverse');
                        fromPage.toggleClass('reverse');
                    }
                    toPage.css('top', 0);
                } else {
                    fromPage.removeClass('current');
                }

                toPage.trigger('pageAnimationEnd', { direction: 'in', reverse: backwards });
                fromPage.trigger('pageAnimationEnd', { direction: 'out', reverse: backwards });

                clearInterval(hashCheckInterval);
                currentPage = toPage;
                location.hash = '#' + currentPage.attr('id');
                startHashCheck();

                var $originallink = toPage.data('referrer');
                if ($originallink) {
                    $originallink.unselect();
                }
                lastAnimationTime = (new Date()).getTime();
                tapReady = true;

            }

            fromPage.trigger('pageAnimationStart', { direction: 'out' });
            toPage.trigger('pageAnimationStart', { direction: 'in' });

            if ($.support.WebKitAnimationEvent && animation && jQTSettings.useAnimations) {
                tapReady = false;
                if (backwards) {
                    toPage.toggleClass('reverse');
                    fromPage.toggleClass('reverse');
                }

                // Support both transitions and animations
                fromPage[0].addEventListener('webkitTransitionEnd', callback);
                fromPage[0].addEventListener('webkitAnimationEnd', callback);

                toPage.addClass(animation.name + ' in current');
                fromPage.addClass(animation.name + ' out');
                
                setTimeout(function(){
                    toPage.addClass('start');
                    fromPage.addClass('start');
                }, 0);
                

            } else {
                toPage.addClass('current');
                callback();
            }

            return true;
        }
        function hashCheck() {
            var curid = currentPage.attr('id');
            if (location.hash != '#' + curid) {
                clearInterval(hashCheckInterval);
                goBack(location.hash);
            }
            else if (location.hash == '') {
                location.hash = '#' + curid;
            } 
        }
        function startHashCheck() {
            hashCheckInterval = setInterval(hashCheck, 100);
        }
        function insertPages(nodes, animation) {
            var targetPage = null;
            $(nodes).each(function(index, node) {
                var $node = $(this);
                if (!$node.attr('id')) {
                    $node.attr('id', 'page-' + (++newPageCount));
                }

		        $body.trigger('pageInserted', {page: $node.appendTo($body)});

                if ($node.hasClass('current') || !targetPage) {
                    targetPage = $node;
                }
            });
            if (targetPage !== null) {
                goTo(targetPage, animation);
                return targetPage;
            } else {
                return false;
            }
        }
        function showPageByHref(href, options) {
            var defaults = {
                data: null,
                method: 'GET',
                animation: null,
                callback: null,
                $referrer: null
            };

            var settings = $.extend({}, defaults, options);

            if (href != '#') {
                $.ajax({
                    url: href,
                    data: settings.data,
                    type: settings.method,
                    success: function (data, textStatus) {
                        var firstPage = insertPages(data, settings.animation);
                        if (firstPage) {
                            if (settings.method == 'GET' && jQTSettings.cacheGetRequests === true && settings.$referrer) {
                                settings.$referrer.attr('href', '#' + firstPage.attr('id'));
                            }
                            if (settings.callback) {
                                settings.callback(true);
                            }
                        }
                    },
                    error: function (data) {
                        if (settings.$referrer) {
                            settings.$referrer.unselect();
                        }
                        if (settings.callback) {
                            settings.callback(false);
                        }
                    }
                });
            }
            else if (settings.$referrer) {
                settings.$referrer.unselect();
            }
        }
        function submitForm(e, callback) {
            var $form = (typeof(e)==='string') ? $(e).eq(0) : (e.target ? $(e.target) : $(e));

            if ($form.length && $form.is(jQTSettings.formSelector)) {
                showPageByHref($form.attr('action'), {
                    data: $form.serialize(),
                    method: $form.attr('method') || "POST",
                    animation: animations[0] || null,
                    callback: callback
                });
                return false;
            }
            return true;
        }
        function submitParentForm(e) {
            var $form = $(this).closest('form');
            if ($form.length) {
                var evt = $.Event("submit");
                evt.preventDefault();
                $form.trigger(evt);
                return false;
            }
            return true;
        }
        function addAnimation(animation) {
            if (typeof(animation.selector) == 'string' && typeof(animation.name) == 'string') {
                animations.push(animation);
                $(animation.selector).tap(liveTap);
                touchSelectors.push(animation.selector);
            }
        }
        function updateOrientation() {
            orientation = Math.abs(window.orientation) == 90 ? 'landscape' : 'portrait';
            $body.removeClass('portrait landscape').addClass(orientation).trigger('turn', {orientation: orientation});
        }
        function handleTouch(e) {
            var $el = $(e.target);
            
            // Only handle touchSelectors
            if (!$(e.target).is(touchSelectors.join(', '))) {
                var $link = $(e.target).closest('a, area');
                
                if ($link.length && $link.is(touchSelectors.join(', '))) {
                    $el = $link;
                } else {
                    return;
                }
            }
            
            if (e) {
                var hoverTimeout = null,
                    startX = event.changedTouches[0].clientX,
                    startY = event.changedTouches[0].clientY,
                    startTime = (new Date).getTime(),
                    deltaX = 0,
                    deltaY = 0,
                    deltaT = 0;

                // Let's bind these after the fact, so we can keep some internal values
                $el.bind('touchmove', touchmove).bind('touchend', touchend);

                hoverTimeout = setTimeout(function() {
                    $el.makeActive();
                }, 100);

            }

            // Private touch functions (TODO: insert dirty joke)
            function touchmove(e) {

                updateChanges();
                var absX = Math.abs(deltaX);
                var absY = Math.abs(deltaY);

                // Check for swipe
                if (absX > absY && (absX > 35) && deltaT < 1000) {
                    $el.trigger('swipe', {direction: (deltaX < 0) ? 'left' : 'right', deltaX: deltaX, deltaY: deltaY }).unbind('touchmove',touchmove).unbind('touchend',touchend);
                } else if (absY > 1) {
                    $el.removeClass('active');
                }

                clearTimeout(hoverTimeout);
            } 

            function touchend() {
                updateChanges();

                if (deltaY === 0 && deltaX === 0) {
                    $el.makeActive();
                    $el.trigger('tap');
                } else {
                    $el.removeClass('active');
                }
                $el.unbind('touchmove',touchmove).unbind('touchend',touchend);
                clearTimeout(hoverTimeout);
            }

            function updateChanges() {
                var first = event.changedTouches[0] || null;
                deltaX = first.pageX - startX;
                deltaY = first.pageY - startY;
                deltaT = (new Date).getTime() - startTime;
            }

        } // End touch handler

        // Public jQuery Fns
        $.fn.unselect = function(obj) {
            if (obj) {
                obj.removeClass('active');
            } else {
                $('.active').removeClass('active');
            }
        }
        $.fn.makeActive = function() {
            return $(this).addClass('active');
        }
        $.fn.swipe = function(fn) {
            if ($.isFunction(fn)) {
                return $(this).live('swipe', fn);
            } else {
                return $(this).trigger('swipe');
            }
        }
        $.fn.tap = function(fn) {
            if ($.isFunction(fn)) {
                var tapEvent = (jQTSettings.useFastTouch && $.support.touch) ? 'tap' : 'click';
                return $(this).live(tapEvent, fn);
            } else {
                return $(this).trigger('tap');
            }
        }
        $.fn.isExternalLink = function() {
            var $el = $(this);
            return ($el.attr('target') == '_blank' || $el.attr('rel') == 'external' || $el.is('input[type="checkbox"], input[type="radio"], a[href^="http://maps.google.com"], a[href^="mailto:"], a[href^="tel:"], a[href^="javascript:"], a[href*="youtube.com/v"], a[href*="youtube.com/watch"]'));
        }

        publicObj = {
            getOrientation: getOrientation,
            goBack: goBack,
            goTo: goTo,
            addAnimation: addAnimation,
            submitForm: submitForm
        }

        return publicObj;
    }

    // Extensions directly manipulate the jQTouch object, before it's initialized.
    $.jQTouch.prototype.extensions = [];
    $.jQTouch.addExtension = function(extension) {
        $.jQTouch.prototype.extensions.push(extension);
    }

})(jQuery);

/*

            _/    _/_/    _/_/_/_/_/                              _/       
               _/    _/      _/      _/_/    _/    _/    _/_/_/  _/_/_/    
          _/  _/  _/_/      _/    _/    _/  _/    _/  _/        _/    _/   
         _/  _/    _/      _/    _/    _/  _/    _/  _/        _/    _/    
        _/    _/_/  _/    _/      _/_/      _/_/_/    _/_/_/  _/    _/     
       _/                                                                  
    _/

    Created by David Kaneda <http://www.davidkaneda.com>
    Documentation and issue tracking on Google Code <http://code.google.com/p/jqtouch/>
    
    Special thanks to Jonathan Stark <http://jonathanstark.com/>
    and pinch/zoom <http://www.pinchzoom.com/>
    
    (c) 2009 by jQTouch project members.
    See LICENSE.txt for license.

*/

(function($) {
    
    $.fn.transition = function(css, options) {
        return this.each(function(){
            var $el = $(this);
            var defaults = {
                speed : '300ms',
                callback: null,
                ease: 'ease-in-out'
            };
            var settings = $.extend({}, defaults, options);
            if(settings.speed === 0) {
                $el.css(css);
                window.setTimeout(settings.callback, 0);
            } else {
                if ($.browser.safari)
                {
                    var s = [];
                    for(var i in css) {
                        s.push(i);
                    }
                    $el.css({
                        webkitTransitionProperty: s.join(", "), 
                        webkitTransitionDuration: settings.speed, 
                        webkitTransitionTimingFunction: settings.ease
                    });
                    if (settings.callback) {
                        $el.one('webkitTransitionEnd', settings.callback);
                    }
                    setTimeout(function(el){ el.css(css) }, 0, $el);
                }
                else
                {
                    $el.animate(css, settings.speed, settings.callback);
                }
            }
        });
    }
})(jQuery);

/**
 * 
 * Find more about the Spinning Wheel function at
 * http://cubiq.org/spinning-wheel-on-webkit-for-iphone-ipod-touch/11
 *
 * Copyright (c) 2009 Matteo Spinelli, http://cubiq.org/
 * Released under MIT license
 * http://cubiq.org/dropbox/mit-license.txt
 * 
 * Version 1.4 - Last updated: 2009.07.09
 * 
 */

var SpinningWheel = {
	cellHeight: 44,
	friction: 0.003,
	slotData: [],


	/**
	 *
	 * Event handler
	 *
	 */

	handleEvent: function (e) {
		if (e.type == 'touchstart') {
			this.lockScreen(e);
			if (e.currentTarget.id == 'sw-cancel' || e.currentTarget.id == 'sw-done') {
				this.tapDown(e);
			} else if (e.currentTarget.id == 'sw-frame') {
				this.scrollStart(e);
			}
		} else if (e.type == 'touchmove') {
			this.lockScreen(e);
			
			if (e.currentTarget.id == 'sw-cancel' || e.currentTarget.id == 'sw-done') {
				this.tapCancel(e);
			} else if (e.currentTarget.id == 'sw-frame') {
				this.scrollMove(e);
			}
		} else if (e.type == 'touchend') {
			if (e.currentTarget.id == 'sw-cancel' || e.currentTarget.id == 'sw-done') {
				this.tapUp(e);
			} else if (e.currentTarget.id == 'sw-frame') {
				this.scrollEnd(e);
			}
		} else if (e.type == 'webkitTransitionEnd') {
			if (e.target.id == 'sw-wrapper') {
			//	this.destroy();
			} else {
				this.backWithinBoundaries(e);
			}
		} else if (e.type == 'orientationchange') {
			this.onOrientationChange(e);
		} else if (e.type == 'scroll') {
			this.onScroll(e);
		}
	},


	/**
	 *
	 * Global events
	 *
	 */

	onOrientationChange: function (e) {
		window.scrollTo(0, 0);
		this.swWrapper.style.top = window.innerHeight + window.pageYOffset + 'px';
		this.calculateSlotsWidth();
	},
	
	onScroll: function (e) {
		this.swWrapper.style.top = window.innerHeight + window.pageYOffset + 'px';
	},

	lockScreen: function (e) {
		e.preventDefault();
		e.stopPropagation();
	},


	/**
	 *
	 * Initialization
	 *
	 */

	reset: function () {
		this.slotEl = [];

		this.activeSlot = null;
		
		this.swWrapper = undefined;
		this.swSlotWrapper = undefined;
		this.swSlots = undefined;
		this.swFrame = undefined;
	},

	calculateSlotsWidth: function () {
		var div = this.swSlots.getElementsByTagName('div');
		for (var i = 0; i < div.length; i += 1) {
			this.slotEl[i].slotWidth = div[i].offsetWidth;
		}
	},

	create: function () {
		var i, l, out, ul, div;

		this.reset();	// Initialize object variables

		// Create the Spinning Wheel main wrapper
		div = document.createElement('div');
		div.id = 'sw-wrapper';
		div.style.top = window.innerHeight + window.pageYOffset + 'px';		// Place the SW down the actual viewing screen
		div.style.webkitTransitionProperty = '-webkit-transform';
//		div.innerHTML = '<div id="sw-header"><div id="sw-cancel">Cancel</' + 'div><div id="sw-done">Done</' + 'div></' + 'div><div id="sw-slots-wrapper"><div id="sw-slots"></' + 'div></' + 'div><div id="sw-frame"></' + 'div>';
		div.innerHTML = '<div id="sw-slots-wrapper"><div id="sw-slots"></' + 'div></' + 'div><div id="sw-frame"></' + 'div>';

		document.body.appendChild(div);

		this.swWrapper = div;													// The SW wrapper
		this.swSlotWrapper = document.getElementById('sw-slots-wrapper');		// Slots visible area
		this.swSlots = document.getElementById('sw-slots');						// Pseudo table element (inner wrapper)
		this.swFrame = document.getElementById('sw-frame');						// The scrolling controller

		// Create HTML slot elements
		for (l = 0; l < this.slotData.length; l += 1) {
			// Create the slot
			ul = document.createElement('ul');
			out = '';
			for (i in this.slotData[l].values) {
				out += '<li>' + this.slotData[l].values[i] + '<' + '/li>';
			}
			ul.innerHTML = out;

			div = document.createElement('div');		// Create slot container
			div.className = this.slotData[l].style;		// Add styles to the container
			div.appendChild(ul);
	
			// Append the slot to the wrapper
			this.swSlots.appendChild(div);
			
			ul.slotPosition = l;			// Save the slot position inside the wrapper
			ul.slotYPosition = 0;
			ul.slotWidth = 0;
			ul.slotMaxScroll = this.swSlotWrapper.clientHeight - ul.clientHeight - 86;
			ul.style.webkitTransitionTimingFunction = 'cubic-bezier(0, 0, 0.2, 1)';		// Add default transition
			
			this.slotEl.push(ul);			// Save the slot for later use
			
			// Place the slot to its default position (if other than 0)
			if (this.slotData[l].defaultValue) {
				this.scrollToValue(l, this.slotData[l].defaultValue);	
			}
		}
		
		this.calculateSlotsWidth();
		
		// Global events
//		document.addEventListener('touchstart', this, false);			// Prevent page scrolling
		document.addEventListener('touchmove', this, false);			// Prevent page scrolling
		window.addEventListener('orientationchange', this, true);		// Optimize SW on orientation change
		window.addEventListener('scroll', this, true);				// Reposition SW on page scroll

		// Cancel/Done buttons events
//		document.getElementById('sw-cancel').addEventListener('touchstart', this, false);
		document.getElementById('sw-done').addEventListener('touchstart', this, false);

		// Add scrolling to the slots
		this.swFrame.addEventListener('touchstart', this, false);
	},

	open: function () {
		this.create();

		this.swWrapper.style.webkitTransitionTimingFunction = 'ease-out';
		this.swWrapper.style.webkitTransitionDuration = '400ms';
		this.swWrapper.style.webkitTransform = 'translate3d(0, -210px, 0)';
	},
	
	
	/**
	 *
	 * Unload
	 *
	 */

	destroy: function () {
		this.swWrapper.removeEventListener('webkitTransitionEnd', this, false);

		this.swFrame.removeEventListener('touchstart', this, false);

//		document.getElementById('sw-cancel').removeEventListener('touchstart', this, false);
		document.getElementById('sw-done').removeEventListener('touchstart', this, false);

//		document.removeEventListener('touchstart', this, false);
		document.removeEventListener('touchmove', this, false);
		window.removeEventListener('orientationchange', this, true);
		window.removeEventListener('scroll', this, true);
		
		this.slotData = [];
		this.cancelAction = function () {
			return false;
		};
		
		this.cancelDone = function () {
			return true;
		};
		
		this.reset();
		
		document.body.removeChild(document.getElementById('sw-wrapper'));
	},
	
	close: function () {
		this.swWrapper.style.webkitTransitionTimingFunction = 'ease-in';
		this.swWrapper.style.webkitTransitionDuration = '400ms';
		this.swWrapper.style.webkitTransform = 'translate3d(0, 0, 0)';
		
		this.swWrapper.addEventListener('webkitTransitionEnd', this, false);
	},


	/**
	 *
	 * Generic methods
	 *
	 */

	addSlot: function (values, style, defaultValue) {
		if (!style) {
			style = '';
		}
		
		style = style.split(' ');

		for (var i = 0; i < style.length; i += 1) {
			style[i] = 'sw-' + style[i];
		}
		
		style = style.join(' ');

		var obj = { 'values': values, 'style': style, 'defaultValue': defaultValue };
		this.slotData.push(obj);
	},

	getSelectedValues: function () {
		var index, count,
		    i, l,
			keys = [], values = [];

		for (i in this.slotEl) {
			// Remove any residual animation
			this.slotEl[i].removeEventListener('webkitTransitionEnd', this, false);
			this.slotEl[i].style.webkitTransitionDuration = '0';

			if (this.slotEl[i].slotYPosition > 0) {
				this.setPosition(i, 0);
			} else if (this.slotEl[i].slotYPosition < this.slotEl[i].slotMaxScroll) {
				this.setPosition(i, this.slotEl[i].slotMaxScroll);
			}

			index = -Math.round(this.slotEl[i].slotYPosition / this.cellHeight);

			count = 0;
			for (l in this.slotData[i].values) {
				if (count == index) {
					keys.push(l);
					values.push(this.slotData[i].values[l]);
					break;
				}
				
				count += 1;
			}
		}

		return { 'keys': keys, 'values': values };
	},


	/**
	 *
	 * Rolling slots
	 *
	 */

	setPosition: function (slot, pos) {
		this.slotEl[slot].slotYPosition = pos;
		this.slotEl[slot].style.webkitTransform = 'translate3d(0, ' + pos + 'px, 0)';
	},
	
	scrollStart: function (e) {
		// Find the clicked slot
		var xPos = e.targetTouches[0].clientX - this.swSlots.offsetLeft;	// Clicked position minus left offset (should be 11px)

		// Find tapped slot
		var slot = 0;
		for (var i = 0; i < this.slotEl.length; i += 1) {
			slot += this.slotEl[i].slotWidth;
			
			if (xPos < slot) {
				this.activeSlot = i;
				break;
			}
		}

		// If slot is readonly do nothing
		if (this.slotData[this.activeSlot].style.match('readonly')) {
			this.swFrame.removeEventListener('touchmove', this, false);
			this.swFrame.removeEventListener('touchend', this, false);
			return false;
		}

		this.slotEl[this.activeSlot].removeEventListener('webkitTransitionEnd', this, false);	// Remove transition event (if any)
		this.slotEl[this.activeSlot].style.webkitTransitionDuration = '0';		// Remove any residual transition
		
		// Stop and hold slot position
		var theTransform = window.getComputedStyle(this.slotEl[this.activeSlot]).webkitTransform;
		theTransform = new WebKitCSSMatrix(theTransform).m42;
		if (theTransform != this.slotEl[this.activeSlot].slotYPosition) {
			this.setPosition(this.activeSlot, theTransform);
		}
		
		this.startY = e.targetTouches[0].clientY;
		this.scrollStartY = this.slotEl[this.activeSlot].slotYPosition;
		this.scrollStartTime = e.timeStamp;

		this.swFrame.addEventListener('touchmove', this, false);
		this.swFrame.addEventListener('touchend', this, false);
		
		return true;
	},

	scrollMove: function (e) {
		var topDelta = e.targetTouches[0].clientY - this.startY;

		if (this.slotEl[this.activeSlot].slotYPosition > 0 || this.slotEl[this.activeSlot].slotYPosition < this.slotEl[this.activeSlot].slotMaxScroll) {
			topDelta /= 2;
		}
		
		this.setPosition(this.activeSlot, this.slotEl[this.activeSlot].slotYPosition + topDelta);
		this.startY = e.targetTouches[0].clientY;

		// Prevent slingshot effect
		if (e.timeStamp - this.scrollStartTime > 80) {
			this.scrollStartY = this.slotEl[this.activeSlot].slotYPosition;
			this.scrollStartTime = e.timeStamp;
		}
	},
	
	scrollEnd: function (e) {
		this.swFrame.removeEventListener('touchmove', this, false);
		this.swFrame.removeEventListener('touchend', this, false);

		// If we are outside of the boundaries, let's go back to the sheepfold
		if (this.slotEl[this.activeSlot].slotYPosition > 0 || this.slotEl[this.activeSlot].slotYPosition < this.slotEl[this.activeSlot].slotMaxScroll) {
			this.scrollTo(this.activeSlot, this.slotEl[this.activeSlot].slotYPosition > 0 ? 0 : this.slotEl[this.activeSlot].slotMaxScroll);
			return false;
		}

		// Lame formula to calculate a fake deceleration
		var scrollDistance = this.slotEl[this.activeSlot].slotYPosition - this.scrollStartY;

		// The drag session was too short
		if (scrollDistance < this.cellHeight / 1.5 && scrollDistance > -this.cellHeight / 1.5) {
			if (this.slotEl[this.activeSlot].slotYPosition % this.cellHeight) {
				this.scrollTo(this.activeSlot, Math.round(this.slotEl[this.activeSlot].slotYPosition / this.cellHeight) * this.cellHeight, '100ms');
			}

			return false;
		}

		var scrollDuration = e.timeStamp - this.scrollStartTime;

		var newDuration = (2 * scrollDistance / scrollDuration) / this.friction;
		var newScrollDistance = (this.friction / 2) * (newDuration * newDuration);
		
		if (newDuration < 0) {
			newDuration = -newDuration;
			newScrollDistance = -newScrollDistance;
		}

		var newPosition = this.slotEl[this.activeSlot].slotYPosition + newScrollDistance;

		if (newPosition > 0) {
			// Prevent the slot to be dragged outside the visible area (top margin)
			newPosition /= 2;
			newDuration /= 3;

			if (newPosition > this.swSlotWrapper.clientHeight / 4) {
				newPosition = this.swSlotWrapper.clientHeight / 4;
			}
		} else if (newPosition < this.slotEl[this.activeSlot].slotMaxScroll) {
			// Prevent the slot to be dragged outside the visible area (bottom margin)
			newPosition = (newPosition - this.slotEl[this.activeSlot].slotMaxScroll) / 2 + this.slotEl[this.activeSlot].slotMaxScroll;
			newDuration /= 3;
			
			if (newPosition < this.slotEl[this.activeSlot].slotMaxScroll - this.swSlotWrapper.clientHeight / 4) {
				newPosition = this.slotEl[this.activeSlot].slotMaxScroll - this.swSlotWrapper.clientHeight / 4;
			}
		} else {
			newPosition = Math.round(newPosition / this.cellHeight) * this.cellHeight;
		}

		this.scrollTo(this.activeSlot, Math.round(newPosition), Math.round(newDuration) + 'ms');
 
		return true;
	},

	scrollTo: function (slotNum, dest, runtime) {
		this.slotEl[slotNum].style.webkitTransitionDuration = runtime ? runtime : '100ms';
		this.setPosition(slotNum, dest ? dest : 0);

		// If we are outside of the boundaries go back to the sheepfold
		if (this.slotEl[slotNum].slotYPosition > 0 || this.slotEl[slotNum].slotYPosition < this.slotEl[slotNum].slotMaxScroll) {
			this.slotEl[slotNum].addEventListener('webkitTransitionEnd', this, false);
		}
	},
	
	scrollToValue: function (slot, value) {
		var yPos, count, i;

		this.slotEl[slot].removeEventListener('webkitTransitionEnd', this, false);
		this.slotEl[slot].style.webkitTransitionDuration = '0';
		
		count = 0;
		for (i in this.slotData[slot].values) {
			if (i == value) {
				yPos = count * this.cellHeight;
				this.setPosition(slot, yPos);
				break;
			}
			
			count -= 1;
		}
	},
	
	backWithinBoundaries: function (e) {
		e.target.removeEventListener('webkitTransitionEnd', this, false);

		this.scrollTo(e.target.slotPosition, e.target.slotYPosition > 0 ? 0 : e.target.slotMaxScroll, '150ms');
		return false;
	},


	/**
	 *
	 * Buttons
	 *
	 */

	tapDown: function (e) {
		e.currentTarget.addEventListener('touchmove', this, false);
		e.currentTarget.addEventListener('touchend', this, false);
		e.currentTarget.className = 'sw-pressed';
	},

	tapCancel: function (e) {
		e.currentTarget.removeEventListener('touchmove', this, false);
		e.currentTarget.removeEventListener('touchend', this, false);
		e.currentTarget.className = '';
	},
	
	tapUp: function (e) {
		this.tapCancel(e);

		if (e.currentTarget.id == 'sw-cancel') {
			this.cancelAction();
		} else {
			this.doneAction();
		}
		
//		this.close(); //not needed because we control this via the feedback from the query
	},

	setCancelAction: function (action) {
		this.cancelAction = action;
	},

	setDoneAction: function (action) {
		this.doneAction = action;
	},
	
	cancelAction: function () {
		return false;
	},

	cancelDone: function () {
		return true;
	}
};

/*
    Copyright (C) 2008 Charles Ying. All Rights Reserved.
   
    This distribution is released under the BSD license.

    http://css-vfx.googlecode.com/
   
    See the README for documentation and license.
*/

(function () {  // Module pattern

var global = this;

// CREATE ARRAYS FOR LINKS AND CAPTIONS
var imagesArray = Array();

var captionsArray = Array();
//	["This is a caption lorem ipsum"],
//	["Here's one that we'll<br>make into two lines"], 
//	["&quot;Quotes&quot; and &copy;s and &trade;s, oh my!"], 
//	["Blah Blah Blooey"]);

/*
    Utilities (avoid jQuery dependencies)
*/

function utils_extend(obj, dict)
{
    for (var key in dict)
    {
        obj[key] = dict[key];
    }
}

function utils_setsize(elem, w, h)
{
    elem.style.width = w.toString() + "px";
    elem.style.height = h.toString() + "px";
}

function utils_setxy(elem, x, y)
{
    elem.style.left = Math.round(x).toString() + "px";
    elem.style.top = Math.round(y).toString() + "px";
}

/*
    TrayController is a horizontal touch event controller that tracks cumulative offsets and passes events to a delegate.
*/

TrayController = function ()
{
    return this;
}

TrayController.prototype.init = function (elem)
{
    this.currentX = 0;
    this.elem = elem;
}

TrayController.prototype.touchstart = function (event)
{
    this.startX = event.touches[0].pageX - this.currentX;
    this.touchMoved = false;

    window.addEventListener("touchmove", this, true);
    window.addEventListener("touchend", this, true);

    this.elem.style.webkitTransitionDuration = "0s";
}

TrayController.prototype.touchmove = function (e)
{
    this.touchMoved = true;
    this.lastX = this.currentX;
    this.lastMoveTime = new Date();
    this.currentX = event.touches[0].pageX - this.startX;
    this.delegate.update(this.currentX);
}

TrayController.prototype.touchend = function (e)
{
    window.removeEventListener("touchmove", this, true);
    window.removeEventListener("touchend", this, true);

    this.elem.style.webkitTransitionDuration = "0.4s";

    if (this.touchMoved)
    {
        /* Approximate some inertia -- the transition function takes care of the decay over 0.4s for us, but we need to amplify the last movement */
        var delta = this.currentX - this.lastX;
        var dt = (new Date()) - this.lastMoveTime + 1;
        /* dx * 400 / dt */

        this.currentX = this.currentX + delta * 200 / dt;
        this.delegate.updateTouchEnd(this);
    }
    else
    {
        this.delegate.clicked(this.currentX);
    }
}

TrayController.prototype.handleEvent = function (event)
{
    this[event.type](event);
    event.preventDefault();
}

/*
    These variables define how the zflow presentation is made.
*/

const CSIZE = 150;
const CGAP = CSIZE / 2;

const FLOW_ANGLE = 70;
const FLOW_THRESHOLD = CGAP / 2;
const FLOW_ZFOCUS = CSIZE;
const FLOW_XGAP = CSIZE / 3;

const T_NEG_ANGLE = "rotateY(" + (- FLOW_ANGLE) + "deg)";
const T_ANGLE = "rotateY(" + FLOW_ANGLE + "deg)";
const T_ZFOCUS = "translateZ(" + FLOW_ZFOCUS + "px)";

FlowDelegate = function ()
{
    this.cells = new Array();
    this.transforms = new Array();
}

FlowDelegate.prototype.init = function (elem)
{
    this.elem = elem;
}

FlowDelegate.prototype.updateTouchEnd = function (controller)
{
    this.lastFocus = undefined;

    // Snap to nearest position
    var i = this.getFocusedCell(controller.currentX);

    controller.currentX = - i * CGAP;
    this.update(controller.currentX);
}

FlowDelegate.prototype.clicked = function (currentX)
{
    var i = - Math.round(currentX / CGAP);
    var cell = this.cells[i];
	galleryCell = i; //save the key for use in show_image div
    // ADDED window.open() - "_self" CAN BE CHANGED TO "_blank" 0R AN EXPLICITLY NAMED WINDOW
	//window.open(imagesArray[i],"_blank");

}

FlowDelegate.prototype.getFocusedCell = function (currentX)
{
    // Snap to nearest position
    var i = - Math.round(currentX / CGAP);

    // Clamp to cells array boundary
    return Math.min(Math.max(i, 0), this.cells.length - 1);
}

FlowDelegate.prototype.transformForCell = function (cell, i, offset)
{
    /*
        This function needs to be fast, so we avoid function calls, divides, Math.round,
        and precalculate any invariants we can.
    */
    var x = (i * CGAP);
    var ix = x + offset;

    if ((ix < FLOW_THRESHOLD) && (ix >= -FLOW_THRESHOLD))
    {
        // yangle = 0, zpos = FLOW_ZFOCUS
        return T_ZFOCUS + " translateX(" + x + "px)";
    }
    else if (ix > 0)
    {
        // yangle = -FLOW_ANGLE, x + FLOW_XGAP
        return "translateX(" + (x + FLOW_XGAP) + "px) " + T_NEG_ANGLE;
    }
    else
    {
        // yangle = FLOW_ANGLE, x - FLOW_XGAP
        return "translateX(" + (x - FLOW_XGAP) + "px) " + T_ANGLE;
    }
}

FlowDelegate.prototype.setTransformForCell = function (cell, i, transform)
{
    if (this.transforms[i] != transform)
    {
        cell.style.webkitTransform = transform;
        this.transforms[i] = transform;
    }
}


FlowDelegate.prototype.update = function (currentX)
{
    this.elem.style.webkitTransform = "translateX(" + (currentX) + "px)";

    /*
        It would be nice if we only updated dirty cells... for now, we use a cache
    */
    for (var i in this.cells)
    {
        var cell = this.cells[i];
        this.setTransformForCell(cell, i, this.transformForCell(cell, i, currentX));
        i += 1;
    }
}
var controller = new TrayController();
var delegate = new FlowDelegate();

global.zflow = function (images, selector)
{
    var tray = document.querySelector(selector);
    controller.init(tray);
    delegate.init(tray);
    controller.delegate = delegate;

    // WE NO LONGER NEED THIS VARIABLE
    // var imagesLeft = images.length;
   
    var cellCSS = {
        top: Math.round(-CSIZE * 0.65) + "px",
        left: Math.round(-CSIZE / 2) + "px",
        width: CSIZE + "px",
        height: Math.round(CSIZE * 1.5) + "px",
        opacity: 0,
    }

    var i = 0;
	
	function makeCell()
	{

		var cell = document.createElement("div");
        var image = document.createElement("img");
		var canvas = document.createElement("canvas");
		var link = document.createElement("a");
        // CREATE caption element
        var caption = document.createElement("caption");

        cell.className = "cell";
		cell.appendChild(link);
        link.appendChild(image);
        cell.appendChild(canvas);
        
        // ADD caption to cell
        cell.appendChild(caption);

        // ASSIGN SRC DIRECTLY FROM THE IMAGES ARRAY SINCE IT'S NO LONGER PASSED AS A PARAMETER OF THE FUNCTION
        image.src = images[i];
		imagesArray[i] = images[i]; 
		link.href = "show_image?fName="+images[i];
		link.className = "slide-right";
        global.afnc = function () {
            var iwidth = image.width;
            var iheight = image.height;
           
            var ratio = Math.min(CSIZE / iheight, CSIZE / iwidth);

            iwidth *= ratio;
            iheight *= ratio;

            utils_setsize(image, iwidth, iheight);

            utils_extend(cell.style, cellCSS);

            utils_setxy(image, (CSIZE - iwidth) / 2, CSIZE - iheight);
            utils_setxy(canvas, (CSIZE - iwidth) / 2, CSIZE);
            
            // POSITION caption - this can be tweaked to place it where you like
            utils_setxy(caption, (CSIZE - iwidth) / 2, CSIZE + 10);

            reflect(image, iwidth, iheight, canvas);
            
            // CALL FUNCTION writeCaption()
			var $tCaption = images[i].match(/(.*)[\/\\]([^\/\\]+)\.\w+$/)[2];  //strip the path
			$tCaption = $tCaption.replace(/_/g, ' '); //replace the _ with blank
			$tCaption = $tCaption.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } ); //cap first word
			captionsArray[i] = $tCaption; //store the capation in the array
            writeCaption(caption, iwidth, i);

            delegate.setTransformForCell(cell, delegate.cells.length, delegate.transformForCell(cell, delegate.cells.length, controller.currentX));
            delegate.cells.push(cell);

            // Start at 0 opacity
            tray.appendChild(cell);
            // Set to 1 to fade element in.
            cell.style.opacity = 1.0;

            // THIS MAKES THE NEXT CELL IF NECESSARY
            if (i < (images.length - 1))
            {
            	i++;
            	makeCell();
            }
            else
            {
                window.setTimeout( function() { window.scrollTo(0, 0); }, 100 );
				galleryInit = 1;
            }
        } // end afnc

        image.addEventListener("load", afnc, true );

	};


	// INITIATE CELL CREATION
	makeCell();
    tray.addEventListener('touchstart', controller, false);		
}

global.zflowCleanup = function (selector)
{
    var tray = document.querySelector(selector);
	if (tray) {
		if (tray.childNodes.length > 0) {
			delegate.transforms.length = 0;
			delegate.cells.length = 0;
			while (tray.hasChildNodes())  {    
				var image = tray.childNodes[0].childNodes[0].childNodes[0];
				image.removeEventListener("load", afnc, true); //remove the listener first
				tray.removeChild(tray.childNodes[0]);
			}
			var div = document.getElementById('gallery');
			if (div) {
				div.parentNode.removeChild(div);  //take the gallery out so it will reload
				galleryInit = 0; //reset the init flag
				galleryCell = 0; //reset the image flag
			}
		}
	}
}

global.zflowGetImageSource = function (selector, index)
{
    var tray = document.querySelector(selector);
	var imageSrc= "";
	if (tray) {
		if (tray.childNodes.length > 0) {
			while (tray.hasChildNodes())  {    
				imageSrc = tray.childNodes[0].childNodes[0].childNodes[index].src;
			}
		}
	}
	return imageSrc;
}

// FUNCTION TO SET WIDTH AND WRITE CAPTION
function writeCaption(caption, iwidth, i) {
	caption.width = iwidth;
	caption.innerHTML = captionsArray[i];
}

function reflect(image, iwidth, iheight, canvas)
{
    canvas.width = iwidth;
    canvas.height = iheight / 2;

    var ctx = canvas.getContext("2d");

    ctx.save();

    ctx.translate(0, iheight - 1);
    ctx.scale(1, -1);
    ctx.drawImage(image, 0, 0, iwidth, iheight);

    ctx.restore();

    ctx.globalCompositeOperation = "destination-out";

    var gradient = ctx.createLinearGradient(0, 0, 0, iheight / 2);
    gradient.addColorStop(1, "rgba(255, 255, 255, 1.0)");
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.5)");
   
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, iwidth, iheight / 2);
}

})();



/*
	#####################################################################
	
	jQTouch iCal, 1.0 alpha
	@created by 
		Bruno Alexandre, 26.03.2010
		twitter.com/balexandre
		balexandre.com
		bruno.in.dk [at] gmail.com
	
	#####################################################################
	
	This is a iCal a-like interface to serve as a calendar/diary, use
		it at your own will.
	
	- To load calendar change the "month.php" to f.ex. "month.php" and
		create your own calendar, you have the expected markup on the
		htm file.
	- To load events change the "events.htm" to f.ex. "events.php"and
		create your own calendar, you have the expected markup on the
		htm file.
	- It handles automatically:
		Today's date
		Next and previous month's
		Loading of events if selected/jumped date contains events
	
	- Remember to remove the alert calls...
	
	######################################################################
*/

// Global variables
var now = new Date();
var url_month = 'month'
var url_event = 'events.htm'

// Loads the calendar for the passed Month and Year
function getCalendar(url1, url2, date) {
	url_month = url1;
	url_event = url2;
	var d = date.getDate();
	var m = date.getMonth() + 1; // zero index based
	var y = date.getFullYear();
				
	$.get(url_month, { month: m, year: y }, function(data) {
		// clear existing calendar
		$('#ical').empty();
		// append retrieved calendar markup
		$(data).appendTo('#ical');
		// set all clicks (don't use live or tap to avoid bugs)
		setBindings();
		// today if exists
		setToday();
		// verify if selected date has events, if it has, load them
		setSelectedAndLoadEvents(date);
		
		//alert('Calendar loaded with: ' + d + '.' + m + '.' + y);
	});
}

function getEvents(date) {
	var d = date.getDate();
	var m = date.getMonth() + 1; // zero index based
	var y = date.getFullYear();
	
	$.get(url_event, { day: d, month: m, year: y }, function(data) {
		// clear existing events
		$('#ical .events').empty();
		// append retrieved events markup
		$(data).appendTo('#ical .events');
	});
}

// no events
function getNoEvents() {
	var noEvents = "<li class='no-event'>No Events</li>";
	$('#ical .events').empty();
	$(noEvents).appendTo('#ical .events');
}

// Set's all clicks
function setBindings() {
	// calendar days
	$('#ical td').bind("click", function() {
		var btnClass = $(this).attr('class');
		var clickedDate = getClickedDate($(this));
		
		// where's the today? let's remove it first
		RemoveSelectedCell();
		
		setToday();
		
		if( btnClass.indexOf('date_has_event') != -1 || btnClass.indexOf('today_date_has_event') != -1 )
		{
			// Event Date
			$(this).attr('class', 'selected_date_has_event');
			getEvents(clickedDate);
		}
		if( btnClass == '' || btnClass.indexOf('today') != -1)
		{
			// Non Event Date
			$(this).attr('class', 'selected');
			getNoEvents();
		}
		
		if( btnClass.indexOf('prevmonth') != -1 || btnClass.indexOf('nextmonth') != -1 ) {
			getCalendar(url, clickedDate);
		}
	});
	// bottom bar - today
	$("#ical .bottom-bar .bottom-bar-today").bind("click", function(){
		getCalendar(url_month, url_event, now);
	});
	// load previous Month
	$("#ical .goto-prevmonth").bind("click", function() {
		loadPrevNextMonth(-1);
	});
	// load next Month
	$("#ical .goto-nextmonth").bind("click", function() {
		loadPrevNextMonth(1);
	});
}
// Resets today's/chosen day
function RemoveSelectedCell() {
	$('#ical .selected_date_has_event').removeClass('selected_date_has_event');
	$('#ical .selected').removeClass('selected');
}
// get clicked Date
function getClickedDate(cell) {
	var date = $(cell).find('input').val(); 

	var clickedDate = getDateFromHiddenField(date);
	return clickedDate;
}
// Load the previous
function loadPrevNextMonth(num) {
	var day = $('#ical .selected').text();
	if(day == "") day = $('#ical .selected_date_has_event').text();
	
	var mmm = parseInt($('#ical > #month').val());
	var yyy = $('#ical > #year').val();
	
	var currentDay = new Date(yyy, mmm - 1, day);
	if(num == 1)
		currentDay.nextMonth();
	else
		currentDay.prevMonth();
	
	getCalendar(url_month, url_event, currentDay);
}
// Set Today's date
function setToday() {
	$("#ical :hidden").each(function(index){
	    var dt = getDateFromHiddenField($(this).val());
	
		if(!isNaN(dt)) {
			  var no = now
			  var da = now.getDate()
				var db = dt.getDate()
			  var ma = now.getMonth()
				var mb = dt.getMonth()
			  var ya = now.getFullYear()
				var yb = dt.getFullYear()
				
		    if( now.getDate() == dt.getDate()
				&& now.getMonth() == dt.getMonth()
				&& now.getFullYear() == dt.getFullYear()) {
		        
		        var td = $(this).closest('td');
		        
		        if($(td).attr('class') == 'date_has_event')
		        	$(td).attr('class', 'today_date_has_event');
		        else
		        	$(td).attr('class', 'today');
			}
		}
	});
}

function getDateFromHiddenField(date) {
	var a = date.split('-');
	return new Date(a[0],a[1]-1,a[2]);
}
// Set Selected date and Load events if exists
function setSelectedAndLoadEvents(date) {
	RemoveSelectedCell();
	
	$('#ical td').each( function(index) {
		var css = $(this).attr('class');
		var clickedDate = getClickedDate($(this));		
		
		// set todays date
		if((css != "prevmonth" && css != "nextmonth") 
		    && date.getDate() == clickedDate.getDate()
		    && date.getMonth() == clickedDate.getMonth()
		    && date.getFullYear() == clickedDate.getFullYear()) {
			
			if( css == "date_has_event") {
				$(this).attr('class', 'selected_date_has_event');
				getEvents(date);
			}
			else {
				$(this).attr('class', 'selected');
				getNoEvents();
			}
		}
	});
	
	setToday();
}

/******************* Utilities *******************/

// http://www.webtoolkit.info/javascript-trim.html
function trim(str, chars) {
	return ltrim(rtrim(str, chars), chars);
}
 
function ltrim(str, chars) {
	chars = chars || "\\s";
	return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
}
 
function rtrim(str, chars) {
	chars = chars || "\\s";
	return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
}

// http://www.ozzu.com/programming-forum/javascript-dateadd-function-t47986.html
function dateAddExtention(p_Interval, p_Number){
    var thing = new String();
        
    //in the spirt of VB we'll make this function non-case sensitive
    //and convert the charcters for the coder.
    p_Interval = p_Interval.toLowerCase();
    
    if(isNaN(p_Number)){
        //Only accpets numbers 
        //throws an error so that the coder can see why he effed up    
        throw "The second parameter must be a number. \n You passed: " + p_Number;
        return false;
    }
    
    p_Number = new Number(p_Number);
    switch(p_Interval.toLowerCase()){
        case "yyyy": {// year
            this.setFullYear(this.getFullYear() + p_Number);
            break;
        }
        case "q": {        // quarter
            this.setMonth(this.getMonth() + (p_Number*3));
            break;
        }
        case "m": {        // month
            this.setMonth(this.getMonth() + p_Number);
            break;
        }
        case "y":        // day of year
        case "d":        // day
        case "w": {      // weekday
            this.setDate(this.getDate() + p_Number);
            break;
        }
        case "ww": {    // week of year
            this.setDate(this.getDate() + (p_Number*7));
            break;
        }
        case "h": {        // hour
            this.setHours(this.getHours() + p_Number);
            break;
        }
        case "n": {        // minute
            this.setMinutes(this.getMinutes() + p_Number);
            break;
        }
        case "s": {        // second
            this.setSeconds(this.getSeconds() + p_Number);
            break;
        }
        case "ms": {        // second
            this.setMilliseconds(this.getMilliseconds() + p_Number);
            break;
        }
        default: {
        
            //throws an error so that the coder can see why he effed up and
            //a list of elegible letters.
            throw    "The first parameter must be a string from this list: \n" +
                    "yyyy, q, m, y, d, w, ww, h, n, s, or ms. You passed: " + p_Interval;
            return false;
        }
    }
    return this;
}
Date.prototype.dateAdd = dateAddExtention;

// http://dansnetwork.com/2008/09/18/javascript-date-object-adding-and-subtracting-months/
function prevMonth() {
	var thisMonth = this.getMonth();
	this.setMonth(thisMonth-1);
	if(this.getMonth() != thisMonth-1 && (this.getMonth() != 11 || (thisMonth == 11 && this.getDate() == 1)))
	this.setDate(0);
}
function nextMonth() {
	var thisMonth = this.getMonth();
	this.setMonth(thisMonth+1);
	if(this.getMonth() != thisMonth+1 && this.getMonth() != 0)
	this.setDate(0);
}

Date.prototype.nextMonth = nextMonth;
Date.prototype.prevMonth = prevMonth;


;(function($){ // secure $ jQuery alias
/*******************************************************************************************/	
// jquery.event.drag.js - rev 10
// Copyright (c) 2008, Three Dub Media (http://threedubmedia.com)
// Liscensed under the MIT License (MIT-LICENSE.txt)
// http://www.opensource.org/licenses/mit-license.php
// Created: 2008-06-04 | Updated: 2008-08-05
/*******************************************************************************************/
// Events: drag, dragstart, dragend
/*******************************************************************************************/

// jquery method
$.fn.drag = function( fn1, fn2, fn3 ){
	if ( fn2 ) this.bind('dragstart', fn1 ); // 2+ args
	if ( fn3 ) this.bind('dragend', fn3 ); // 3 args
	return !fn1 ? this.trigger('mousedown',{ which:1 }) // 0 args
		: this.bind('drag', fn2 ? fn2 : fn1 ); // 1+ args
	};

// special event configuration
var drag = $.event.special.drag = {
	distance: 0, // default distance dragged before dragstart
	setup: function( data ){
		data = $.extend({ distance: drag.distance }, data || {});
		$.event.add( this, "mousedown", drag.handler, data );
		},
	teardown: function(){
		$.event.remove( this, "mousedown", drag.handler );
		if ( this == drag.dragging ) drag.dragging = drag.proxy = null; // deactivate element
		selectable( this, true ); // enable text selection
		},
	handler: function( event ){ 
		var returnValue;
		// mousedown has initialized
		if ( event.data.elem ){ 
			// update event properties...
			event.dragTarget = event.data.elem; // source element
			event.dragProxy = drag.proxy || event.dragTarget; // proxy element or source
			event.cursorOffsetX = event.data.x - event.data.left; // mousedown offset
			event.cursorOffsetY = event.data.y - event.data.top; // mousedown offset
			event.offsetX = event.pageX - event.cursorOffsetX; // element offset
			event.offsetY = event.pageY - event.cursorOffsetY; // element offset
			}
		// handle various events
		switch ( event.type ){
			// mousedown, left click
			case !drag.dragging && event.which==1 && 'mousedown': // initialize drag
				$.extend( event.data, $( this ).offset(), { 
					x: event.pageX, y: event.pageY, elem: this, 
					dist2: Math.pow( event.data.distance, 2 ) //  x² + y² = distance²
					}); // store some initial attributes
				$.event.add( document.body, "mousemove mouseup", drag.handler, event.data );
				selectable( this, false ); // disable text selection
				return false; // prevents text selection in safari 
			// mousemove, check distance, start dragging
			case !drag.dragging && 'mousemove': // DRAGSTART >>	
				if ( Math.pow( event.pageX-event.data.x, 2 ) 
					+ Math.pow( event.pageY-event.data.y, 2 ) //  x² + y² = distance²
					< event.data.dist2 ) break; // distance tolerance not reached
				drag.dragging = event.dragTarget; // activate element
				event.type = "dragstart"; // hijack event
				returnValue = $.event.handle.call( drag.dragging, event ); // trigger "dragstart", return proxy element
				drag.proxy = $( returnValue )[0] || drag.dragging; // set proxy
				if ( returnValue !== false ) break; // "dragstart" accepted, stop
				selectable( drag.dragging, true ); // enable text selection
				drag.dragging = drag.proxy = null; // deactivate element
			// mousemove, dragging
			case 'mousemove': // DRAG >> 
				if ( drag.dragging ){
					event.type = "drag"; // hijack event
					returnValue = $.event.handle.call( drag.dragging, event ); // trigger "drag"
					if ( $.event.special.drop ){ // manage drop events
						$.event.special.drop.allowed = ( returnValue !== false ); // prevent drop
						$.event.special.drop.handler( event ); // "dropstart", "dropend"
						}
					if ( returnValue !== false ) break; // "drag" not rejected, stop		
					event.type = "mouseup"; // hijack event
					}
			// mouseup, stop dragging
			case 'mouseup': // DRAGEND >> 
				$.event.remove( document.body, "mousemove mouseup", drag.handler ); // remove page events
				if ( drag.dragging ){
					if ( $.event.special.drop ) // manage drop events
						$.event.special.drop.handler( event ); // "drop"
					event.type = "dragend"; // hijack event
					$.event.handle.call( drag.dragging, event ); // trigger "dragend"	
					selectable( drag.dragging, true ); // enable text selection
					drag.dragging = drag.proxy = null; // deactivate element
					event.data = {};
					}
				break;
			} 
		} 
	};
	
// toggles text selection attributes	
function selectable( elem, bool ){ 
	if ( !elem ) return; // maybe element was removed ? 
	elem.unselectable = bool ? "off" : "on"; // IE
	elem.onselectstart = function(){ return bool; }; // IE
	if ( elem.style ) elem.style.MozUserSelect = bool ? "" : "none"; // FF
	};	
	
/*******************************************************************************************/
})( jQuery ); // confine scope

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

/**
 * touch for jQuery
 * 
 * Copyright (c) 2008 Peter Schmalfeldt (ManifestInteractive.com) <manifestinteractive@gmail.com>
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details. 
 *
 * @license http://www.gnu.org/licenses/gpl.html 
 * @project jquery.touch
 */

// DEFINE DEFAULT VARIABLES
var _target=null, _dragx=null, _dragy=null, _rotate=null, _resort=null;
var _dragging=false, _sizing=false, _animate=false;
var _rotating=0, _width=0, _height=0, _left=0, _top=0, _xspeed=0, _yspeed=0;
var _zindex=1000;

jQuery.fn.touch = function(settings) {

	// DEFINE DEFAULT TOUCH SETTINGS
	settings = jQuery.extend({
		animate: true,
		sticky: false,
		dragx: true,
		dragy: true,
		rotate: false,
		resort: true,
		scale: false
	}, settings);
	
	// BUILD SETTINGS OBJECT
	var opts = [];
	opts = $.extend({}, $.fn.touch.defaults, settings);
	
	// ADD METHODS TO OBJECT
	this.each(function(){
		this.opts = opts;
		this.ontouchstart = touchstart;
		this.ontouchend = touchend;
		this.ontouchmove = touchmove;
		this.ongesturestart = gesturestart;
		this.ongesturechange = gesturechange;
		this.ongestureend = gestureend;
	});
};
function touchstart(e){
	_target = this.id;
	_dragx = this.opts.dragx;
	_dragy = this.opts.dragy;
	_resort = this.opts.resort;
	_animate = this.opts.animate;
	_xspeed = 0;
	_yspeed = 0;

	$(e.changedTouches).each(function(){
									  
		var curLeft = ($('#'+_target).css("left") == 'auto') ? this.pageX : parseInt($('#'+_target).css("left"));
		var curTop = ($('#'+_target).css("top") == 'auto') ? this.pageY : parseInt($('#'+_target).css("top"));
		
		if(!_dragging && !_sizing){
			_left = (e.pageX - curLeft);
			_top = (e.pageY - curTop);
			_dragging = [_left,_top];
			if(_resort){
				_zindex = ($('#'+_target).css("z-index") == _zindex) ? _zindex : _zindex+1;
				$('#'+_target).css({ zIndex: _zindex });
			}
		}
	});
};
function touchmove(e){
	
	if(_dragging && !_sizing && _animate) {
		
		var _lastleft = (isNaN(parseInt($('#'+_target).css("left")))) ? 0:parseInt($('#'+_target).css("left"));
		var _lasttop = (isNaN(parseInt($('#'+_target).css("top")))) ? 0:parseInt($('#'+_target).css("top"));
	}
	
	$(e.changedTouches).each(function(){
		
		e.preventDefault();
		
		_left = (this.pageX-(parseInt($('#'+_target).css("width"))/2));
		_top = (this.pageY-(parseInt($('#'+_target).css("height"))/2));
		
		if(_dragging && !_sizing) {
			
			if(_animate){
				_xspeed = Math.round((_xspeed + Math.round( _left - _lastleft))/1.5);
				_yspeed = Math.round((_yspeed + Math.round( _top - _lasttop))/1.5);
			}
			
			if(_dragx || _dragy) $('#'+_target).css({ position: "absolute" });
			if(_dragx) $('#'+_target).css({ left: _left+"px" });
			if(_dragy) $('#'+_target).css({ top: _top+"px" });
			
			$('#'+_target).css({ backgroundColor: "#4B880B" });
			$('#'+_target+' b').text('WEEEEEEEE!!!!');
		}
	});
};
function touchend(e){
	$(e.changedTouches).each(function(){
		if(!e.targetTouches.length){
			_dragging = false;
			if(_animate){
				_left = ($('#'+_target).css("left") == 'auto') ? this.pageX : parseInt($('#'+_target).css("left"));
				_top = ($('#'+_target).css("top") == 'auto') ? this.pageY : parseInt($('#'+_target).css("top"));
				
				var animx = (_dragx) ? (_left+_xspeed)+"px" : _left+"px";
				var animy = (_dragy) ? (_top+_yspeed)+"px" : _top+"px";
				
				if(_dragx || _dragy) $('#'+_target).animate({ left: animx, top: animy }, "fast");
			}
		}
	});
	
	$('#'+_target+' b').text('I am sad :(');
	$('#'+_target).css({ backgroundColor: "#0B4188" });
	setTimeout(changeBack,5000,_target);
};
function gesturestart(e){
	_sizing = [$('#'+this.id).css("width"), $('#'+this.id).css("height")];
};
function gesturechange(e){
	if(_sizing){
		_width = (this.opts.scale) ? Math.min(parseInt(_sizing[0])*e.scale, 300) : _sizing[0];
		_height = (this.opts.scale) ? Math.min(parseInt(_sizing[1])*e.scale, 300) : _sizing[1];
		_rotate = (this.opts.rotate) ? "rotate(" + ((_rotating + e.rotation) % 360) + "deg)" : "0deg";		
		$('#'+this.id).css({ width: _width+"px", height: _height+"px", webkitTransform: _rotate });
		$('#'+this.id+' b').text('TRANSFORM!');
		$('#'+this.id).css({ backgroundColor: "#4B880B" });
	}
};
function gestureend(e){
	_sizing = false;
	_rotating = (_rotating + e.rotation) % 360;
};

function changeBack(target){
	$('#'+target+' b').text('Touch Me :)');
	$('#'+target).css({ backgroundColor: "#999" });
}

/**
 *	Use javascript to write in the CSS rules need for the scrolling extension
 *	making the CSS compatible with the dimensions of most (hopefully all) screens
 *
 *
 *	@author Sam Shull
 *	Copyright (c) 2009 Sam Shull <http://www.google.com/profiles/brickysam26>
 *	Released under MIT license
 *
 *
 */
(function($) {

var window = this, jqc = window.jQExtensionsCSS || {};

$(window).load(function()
{
	window.scrollTo(0,0);
	var o = window.innerWidth < window.innerHeight ? "profile" : "landscape",
		toolbarHeight = jqc.toolbarHeight || $("#jqt .toolbar").outerHeight() || 45,
		parts = {profile:null, landscape:null},
		css = $.extend({
			defaults: ".horizontal-scroll, \
					.horizontal-scroll .scroll-container, \
					.horizontal-slide, \
					.horizontal-slide .slide-container\
					{\
						width: {width}px;\
						height: 100%;\
						overflow: hidden;\
						padding: 0;\
					}\
					.vertical-scroll > div, \
					.vertical-slide > div\
					{\
						margin: 0 auto;\
						padding-bottom:{paddingBottom}px;\
					}\
					#jqt.fullscreen .vertical-scroll.use-bottom-toolbar > div, \
					#jqt.fullscreen .vertical-slide.use-bottom-toolbar > div\
					{\
						padding-bottom:0px;\
					}\
					.vertical-scroll, .vertical-slide\
					{\
						position: relative;\
						z-index: 1;\
						overflow: hidden;\
						height: {height}px;        \
					}\
					.vertical-scroll.use-bottom-toolbar, \
					.vertical-slide.use-bottom-toolbar\
					{\
						height: {bottomToolbarHeight}px !important;\
					}\n",
			profile: ".profile .horizontal-scroll, \
					.profile .horizontal-scroll .scroll-container, \
					.profile .horizontal-slide, \
					.profile .horizontal-slide .slide-container\
					{\
						width: {width}px;\
					}\
					.profile .vertical-scroll, .profile .vertical-slide\
					{\
						position: relative;\
						z-index: 1;\
						overflow: hidden;\
						height: {height}px;        \
					}\
					.profile .vertical-scroll.use-bottom-toolbar, \
					.profile .vertical-slide.use-bottom-toolbar\
					{\
						height: {bottomToolbarHeight}px !important;\
					}",
			landscape: ".landscape .horizontal-scroll, \
					.landscape .horizontal-scroll .scroll-container, \
					.landscape .horizontal-slide, \
					.landscape .horizontal-slide .slide-container\
					{\
						width: {width}px;\
						height: 100%;\
						overflow: hidden;\
						padding: 0;\
					}\
					.landscape .vertical-scroll, \
					.landscape .vertical-slide\
					{\
						position: relative;\
						z-index: 1;\
						overflow: hidden;\
						height: {height}px;\
					}\
					.landscape .vertical-scroll.use-bottom-toolbar, \
					.landscape .vertical-slide.use-bottom-toolbar\
					{\
						height: {bottomToolbarHeight}px !important;\
					}"
		}, jqc.css || {});
		
	parts[o] = $.extend({
					paddingBottom:5,
					width: window.innerWidth,
					height: window.innerHeight - toolbarHeight,
					bottomToolbarHeight: window.innerHeight - (toolbarHeight * 2)
				}, 
				jqc[o] || {});
	
	parts.defaults = $.extend({}, parts[o], jqc.defaults || {});
	
	$(document.createElement("style"))
		.attr("type","text/css")
		.html(
			  css.defaults.replace(/\{(\w+)\}/g, function (a, b) {return b in parts.defaults ? parts.defaults[b] : a;}) + 
			  css[o].replace(/\{(\w+)\}/g, function (a, b) {return b in parts[o] ? parts[o][b] : a;}))
		.appendTo("head");
	
	$(window).one("orientationchange", function()
	{
		var o = window.innerWidth < window.innerHeight ? "profile" : "landscape";
		parts[o] = $.extend({
					paddingBottom:5,
					width: window.innerWidth,
					height: window.innerHeight - toolbarHeight,
					bottomToolbarHeight: window.innerHeight - (toolbarHeight * 2)
				}, 
				jqc[o] || {});
		
		$(document.createElement("style"))
			.attr("type","text/css")
			.html(css[o].replace(/\{(\w+)\}/g, function (a, b) {return b in parts[o] ? parts[o][b] : a;}))
			.appendTo("head");
	});
});

})(jQuery);


/**
 * Chain.js
 * jQuery Plugin for Data Binding
 * 
 * Copyright (c) 2008 Rizqi Ahmad
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


/* core.js */
(function($){

/**
 * Chain Namespace
 * 
 * @alias jQuery.Chain
 * @namespace
 */ 	
$.Chain = 
{
	/**
	 * Version Number
	 * 
	 * @alias jQuery.Chain.version
	 * @property {String}
	 */ 
	version: '0.2',
	
	/**
	 * Tag for use in @jQuery.Chain.parse@ (which is used in CustomUpdater).
	 * It is can be altered.
	 * 
	 * @alias jQuery.Chain.tags
	 * 
	 * @property {Array}
	 * 
	 * @see jQuery.Chain.parse
	 */ 
	tag: ['{', '}'],
	
	/**
	 * Namespace containing all defined services.
	 * 
	 * @namespace
	 * 
	 * @alias jQuery.Chain.services
	 */ 
	services: {},
	
	/**
	 * Register a service to the service manager.
	 * 
	 * @alias jQuery.Chain.service
	 * 
	 * @param {String}	name	Service Name
	 * @param {Object}	proto 	Service Object Prototype
	 * 
	 * @example Create a Custom Service
	 * $.Chain.service('test', {
	 * 		// Default command handler
	 * 		handler: function(option)
	 * 		{
	 * 			// do something
	 * 		},
	 * 		// $(selector).test('what', somearg)
	 * 		$what: function(somearg)
	 * 		{
	 * 			// do something
	 * 		}
	 * });
	 * 
	 * $('#element').test();
	 * 
	 * @see jQuery.Chain.extend
	 */ 
	service: function(name, proto)
	{
		this.services[name] = proto;
		
		// Creating jQuery fn module with the service
		$.fn[name] = function(options)
		{
			if(!this.length)
				{return this;}
			
			// Create Chain instance
			var instance = this.data('chain-'+name);
			
			// Extract arguments
			var args = Array.prototype.slice.call(arguments, 1);
			
			// Create Instance if it doesn't already exist
			if(!instance)
			{
			  // Return immediately if destroyed is called before Instance is created
				if(options == 'destroy') 
					{return this;}
				// Create Instance
				instance = $.extend({element: this}, $.Chain.services[name]);
				this.data('chain-'+name, instance);
				// Initialize if possible
				if(instance.init)
					{instance.init();}
			}
			
			var result;
			
			// Check whether to execute a command
			if(typeof options == 'string' && instance['$'+options])
				{result = instance['$'+options].apply(instance, args);}
			
			// Otherwise try to execute default handler
			else if(instance['handler'])
				{result = instance['handler'].apply(instance, [options].concat(args));}
			
			// Otherwise do nothing
			else
				{result = this;}
			
			// Remove instance on destroy
			if(options == 'destroy')
				{this.removeData('chain-'+name);}
			
			return result;
		};
	},

	/**
	 * Extends service functionalities.
	 * 
	 * @alias jQuery.Chain.extend
	 * 
	 * @param {String}	name	Service Name
	 * @param {Object}	proto 	Service Object Prototype
	 * 
	 * @see jQuery.Chain.service
	 */ 
	extend: function(name, proto)
	{
		if(this.services[name])
			{this.services[name] = $.extend(this.services[name], proto);}
	},
	
	/**
	 * Check whether it is a jQuery Object
	 * 
	 * @alias jQuery.Chain.jobject
	 * 
	 * @param {Object} obj Object to be checked
	 * 
	 * @example Using @jobject@
	 * $.Chain.jobject($()) // returns true
	 * $.Chain.jobject("test") // returns false
	 * 
	 * @return {Boolean} True or False
	 * 
	 * @see jQuery.Chain.jindentic
	 */ 
	jobject: function(obj)
	{
		return obj && obj.init == $.fn.init;
	},
	
	/**
	 * Check whether two jQuery Collection identic
	 * 
	 * @alias jQuery.Chain.jidentic
	 * 
	 * @param {Object}	j1	jQuery Object
	 * @param {Object}	j2	jQuery Object
	 * 
	 * @example Using @jidentic@
	 * a = $('div');
	 * b = $('div');
	 * c = $('div.test');
	 * 
	 * (a == b) //returns false
	 * 
	 * $.Chain.jidentic(a, b) // returns true
	 * $.Chain.jidentic(a, c) // returns false
	 * 
	 * @return {Boolean} True or False
	 * 
	 * @see jQuery.Chain.jobject
	 */ 
	jidentic: function(j1, j2)
	{
		if(!j1 || !j2 || j1.length != j2.length)
			{return false;}
		
		var a1 = j1.get();
		var a2 = j2.get();
		
		for(var i=0; i<a1.length; i++)
		{
			if(a1[i] != a2[i])
				{return false;}
		}
		
		return true;
		
	},
	
	/**
	 * Parse string contained @{something}@ to a Function
	 * that when executed replace those with the data it refers to.
	 * You can change the @{}@ tag by modifying @jQuery.Chain.tag@
	 * 
	 * @param {String} text String
	 * 
	 * @example Using @
	 * var fn = $.Chain.parse("My name is {first} {last}");
	 * fn({first:'Rizqi', last:'Ahmad'}) // returns "My name is Rizqi Ahmad"
	 * 
	 * @return {Function} template string.
	 * 
	 * @see jQuery.Chain.tag
	 */ 
	parse: function()
	{
		var $this = {};
		// Function Closure
		$this.closure =
		[
			'function($data, $el){'
			+'var $text = [];\n'
			+'$text.print = function(text)'
			+'{this.push((typeof text == "number") ? text : ((typeof text != "undefined") ? text : ""));};\n'
			+'with($data){\n',
	
			'}\n'
			+'return $text.join("");'
			+'}'
		];
	
		// Print text template
		$this.textPrint = function(text)
		{
			return '$text.print("'
				+text.split('\\').join('\\\\').split("'").join("\\'").split('"').join('\\"')
				+'");';
		};
	
		// Print script template
		$this.scriptPrint = function(text)
		{
			return '$text.print('+text+');';
		};
		
		$this.parser = function(text){
			var tag = $.Chain.tag;
		
			var opener, closer, closer2 = null, result = [];
	
			while(text){
		
				// Check where the opener and closer tag
				// are located in the text.
				opener = text.indexOf(tag[0]);
				closer = opener + text.substring(opener).indexOf(tag[1]);
		
				// If opener tag exists, otherwise there are no tags anymore
				if(opener != -1)
				{
					// Handle escape. Tag can be escaped with '\\'.
					// If tag is escaped. it will be handled as a normal text
					// Otherwise it will be handled as a script
					if(text[opener-1] == '\\')
					{
						closer2 = opener+tag[0].length + text.substring(opener+tag[0].length).indexOf(tag[0]);
						if(closer2 != opener+tag[0].length-1 && text[closer2-1] == '\\')
							{closer2 = closer2-1;}
						else if(closer2 == opener+tag[0].length-1)
							{closer2 = text.length;}
				
						result.push($this.textPrint(text.substring(0, opener-1)));
						result.push($this.textPrint(text.substring(opener, closer2)));
					}
					else
					{
						closer2 = null;
						if(closer == opener-1)
							{closer = text.length;}
				
						result.push($this.textPrint(text.substring(0, opener)));
						result.push($this.scriptPrint(text.substring(opener+tag[0].length, closer)));
					}
					
					text = text.substring((closer2 === null) ? closer+tag[1].length : closer2);
				}
				// If there are still text, it will be pushed to array
				// So we won't stuck in an infinite loop
				else if(text)
				{
					result.push($this.textPrint(text));
					text = '';
				}
			}
	
			return result.join('\n');	
		};
	
	
		/*
		 * Real function begins here.
		 * We use closure for private variables and function.
		 */
		return function($text)
		{
			var $fn = function(){};
			try
			{
				eval('$fn = '+ $this.closure[0]+$this.parser($text)+$this.closure[1]);
			}
			catch(e)
			{
				throw "Parsing Error";
			}
			
			return $fn;
		};
	}()
};
	
})(jQuery);

/* update.js */
/**
 * Chain Update Service
 * 
 * @alias update
 * 
 * @syntax $(selector).update(parameters);
 */ 

(function($){

/**
 * Chain Update Service Object - Providing methods of @update@.
 * All method listed here can only be used internally
 * using @jQuery.Chain.service@ or @jQuery.Chain.extend@
 * 
 * @namespace
 * 
 * @alias jQuery.Chain.services.update
 * 
 * @see jQuery.Chain.service
 * @see jQuery.Chain.extend
 */ 

$.Chain.service('update', {
	/**
	 * Default Handler
	 * 
	 * @alias jQuery.Chain.services.update.handler
	 * 
	 * @see jQuery.Chain.service
	 * @see jQuery.Chain.services.update.bind
	 * @see jQuery.Chain.services.update.trigger
	 */ 
	handler: function(opt)
	{
		if(typeof opt == 'function')
			{return this.bind(opt);}
		else
			{return this.trigger(opt);}
	},
	
	/**
	 * If you pass a function to update, it will bind it to the update event.
	 * just like jQuerys @click()@ or @mouseover()@.
	 * 
	 * @alias update(fn)
	 * @alias jQuery.Chain.services.update.bind
	 * 
	 * @param {Function} fn Listener
	 * 
	 * @example
	 * // assuming #person is already chained
	 * $('#person').update(function{
	 * 		alert($(this).item().name);
	 * });
	 * 
	 * $('#person').item({name: 'Rizqi'})
	 * 
	 * @return {Object} jQuery Object
	 * 
	 * @see jQuery.Chain.services.update.handler
	 */ 
	bind: function(fn)
	{
		return this.element.bind('update', fn);
	},
	
	/**
	 * If no argument or "hard" is passed,
	 * it will update the element and trigger the update event.
	 * 
	 * @alias update(opt)
	 * @alias jQuery.Chain.services.update.trigger
	 * 
	 * @param {String} opt If 'hard', it will update each of items
	 * 
	 * @example
	 * $('#person').update();
	 * 
	 * @return {Object} jQuery Object
	 * 
	 * @see jQuery.Chain.services.update.handler
	 */ 
	trigger: function(opt)
	{
		this.element.items('update');
		this.element.item('update');
		
		this.element.triggerHandler('preupdate', this.element.item());
		
		if(opt == 'hard')
			{this.element.items(true).each(function(){$(this).update();});}
		
		this.element.triggerHandler('update', this.element.item());
		
		return this.element;
	}
});
	
})(jQuery);

/* chain.js */
/**
 * Chain Binding Service.
 * Method to activate the chaining / element rendering service.
 * 
 * @alias chain
 * 
 * @syntax $(selector).chain(parameters);
 */ 

(function($){

/**
 * Chain Binding Service Object - Providing methods of @chain@.
 * All method listed here can only be used internally
 * using @jQuery.Chain.service@ or @jQuery.Chain.extend@
 * 
 * @namespace
 * 
 * @alias jQuery.Chain.services.chain
 * 
 * @see jQuery.Chain.service
 * @see jQuery.Chain.extend
 */ 

$.Chain.service('chain', {
	/**
	 * Initializer. Executed once at the first time @chain@ invoked.
	 * 
	 * @alias jQuery.Chain.services.chain.init
	 * 
	 * @see jQuery.Chain.service
	 */ 
	init: function()
	{
		this.anchor = this.element;
		this.template = this.anchor.html();
		this.tplNumber = 0; // At Default it uses the first template.
		this.builder = this.createBuilder();
		this.plugins = {};
		this.isActive = false;
		this.destroyers = [];
		
		// Add class 'chain-element' as identifier
		this.element.addClass('chain-element');
	},
	
	/**
	 * Default handler.
	 * 
	 * @alias jQuery.Chain.services.chain.handler
	 * 
	 * @param {Object} obj Object to be handled
	 * 
	 * @return {Object} jQuery Object
	 * 
	 * @see jQuery.Chain.service
	 * @see jQuery.Chain.services.chain.handleUpdater
	 * @see jQuery.Chain.services.chain.handleBuilder
	 */ 
	handler: function(obj)
	{
		// Backup items and item, all items will be stored in Buffer
		this.element.items('backup');
		this.element.item('backup');
		
		if(typeof obj == 'object')
			{this.handleUpdater(obj);}
		else if(typeof obj == 'function')
			{this.handleBuilder(obj);}
		
		// Empty element, if @item@ it will filled again later
		this.anchor.empty();
		
		this.isActive = true;
		this.element.update();
		
		return this.element;
	},
	
	/**
	 * Updater Handler.
	 * If you pass an object to @chain@, it will treated as a updater object.
	 * The updater is a hash of selector and value string:
	 * like @chain({'my css selector': 'My Content String'})@
	 * or @chain({'my css selector': {attributes}})@
	 * 
	 * @alias chain(updater)
	 * @alias jQuery.Chain.services.chain.handleUpdater
	 * 
	 * @param {Object} rules Updater rules to be parsed
	 * 
	 * @example Usage
	 * $(selector)
	 * 		.chain({
	 * 			// Items anchor, where the Item iteration should be placed
	 * 			anchor: anchor,
	 * 			// If true, the default updater is overridden
	 * 			override: false, 
	 * 			// Use custom builder
	 * 			builder: function(){},
	 * 			// Update the element self
	 * 			self: "This is my {data}",
	 * 			// Use css selector to update child element
	 * 			'.element.selector': "Using String Updater",
	 * 			// Use Function as updater
	 * 			'.element.selector': function(data, el){},
	 * 			// Updating Attributes
	 * 			'.element.selector': {
	 * 				attribute1: "{attribute}",
	 * 				className: "{className}",
	 * 				content: "This is the {content}",
	 * 				value: "This is the {value}"
	 * 			}
	 * 		});
	 * 
	 * @example Using Default Updater
	 * $('<div><span class="name">Name</span></div>')
	 * 		.item({name: 'Steve Jobs'})
	 * 		.chain()
	 * 		.appendTo(document.body);
	 * 
	 * @example Using Custom Updater
	 * $('<div><div class="name"><span class="first">First</span> <span class="last">Last</span></div></div>')
	 * 		.item({first:'Steve', last:'Jobs'})
	 * 		.chain({
	 * 			'.name .first': {
	 * 				style: 'color: blue;',
	 * 				content: 'First Name: {first}'
	 * 			},
	 * 			'.name .last': 'Family Name: {last}'
	 * 		})
	 * 		.appendTo(document.body);
	 * 
	 * @example Attach Builder Inside Updater
	 * $('<div><div class="name">Name</div><div class="address">Address</div></div>')
	 * 		.item({name:'Steve Jobs', address:'Cupertino'})
	 * 		.chain({
	 * 			builder: function(){
	 * 				var data = this.item();
	 * 				this.find('.name').click(function(){alert(data.name)});
	 * 				this.find('.address').mouseout(function(){alert(data.address)});
	 * 			},
	 * 			'.name': '{name}',
	 * 			'.address': '{address}'
	 * 		})
	 * 		.appendTo(document.body);
	 */ 
	handleUpdater: function(rules)
	{
		// Extract Builder
		var builder = rules.builder;
		delete rules.builder;
		
		// Extract Anchor
		if(rules.anchor)
			{this.setAnchor(rules.anchor);}
		delete rules.anchor;
		
		// Extract Override
		var override = rules.override;
		delete rules.override;
	
		for(var i in rules)
		{
			// Parse String to Function
			if(typeof rules[i] == 'string')
			{
				rules[i] = $.Chain.parse(rules[i]);
			}
			// Parse Attributes Object to Functions
			else if(typeof rules[i] == 'object')
			{
				for(var j in rules[i])
				{
					if(typeof rules[i][j] == 'string')
						{rules[i][j] = $.Chain.parse(rules[i][j]);}
				}
			}
		}
	
		// Create Updater
		var fn = function(event, data)
		{
			var el, val;
			var self = $(this);
			for(var i in rules)
			{
				// If self, update the element itself
				if(i == 'self')
					{el = self;}
				// Otherwise find element inside self
				else
					{el = $(i, self);}
				
				// Executing
				// If no attributes, put the result to html (value if input)
				if (typeof rules[i] == 'function')
				{
					val = rules[i].apply(self, [data, el]);
					if(typeof val == 'string')
						{el.not(':input').html(val).end().filter(':input').val(val);}
				}
				// If attributes, then execute the function for each attr.
				else if(typeof rules[i] == 'object')
				{
					for(var j in rules[i])
					{
						if (typeof rules[i][j] == 'function')
						{
							val = rules[i][j].apply(self, [data, el]);
							if(typeof val == 'string')
							{
								// Some special attributes
								if(j == 'content')
									{el.html(val);}
								else if(j == 'text')
									{el.text(val);}
								else if(j == 'value')
									{el.val(val);}
								else if(j == 'class' || j == 'className')
									{el.addClass(val);}
								// Otherwise fill attribute as normal
								else
									{el.attr(j, val);}
							}
							
						}
					}
				}
			}
		};
		
		var defBuilder = this.defaultBuilder;
		
		// Define Builder
		this.builder = function(root)
		{
			if(builder)
				{builder.apply(this, [root]);}
			
			if(!override)
				{defBuilder.apply(this);}
			
			// Here goes the updater
			this.update(fn);
			
			// This prevent infinite recursion
			// see: jQuery.Chain.services.item.build
			return false;
		};
	},
	
	/**
	 * Builder Handler.
	 * If you pass a function to @chain@, it will be handled 
	 * as @{builder: function}@, enabling you to use the default
	 * updater while customizing the events etc.
	 * 
	 * @alias chain(fn)
	 * @alias jQuery.Chain.services.chain.handleBuilder
	 * 
	 * @param {Function} fn Builder Function
	 * 
	 * @example
	 * $('<div><div class="name">Name</div><div class="address">Address</div></div>')
	 * 		.item({name:'Steve Jobs', address:'Cupertino'})
	 * 		.chain(function(){
	 * 			this.bind('click', function(){
	 * 				var data = this.item();
	 * 				alert('name:'+data.name+', address:'+data.address);
	 * 			});
	 * 			
	 * 			// if you return false, default builder wont be executed
	 * 			// You don't have to return true;
	 * 			return true;
	 * 		})
	 * 		.appendTo(document.body);
	 * 
	 * @see jQuery.Chain.services.chain.handleUpdater
	 * @see jQuery.Chain.services.chain.createBuilder
	 */ 
	handleBuilder: function(fn)
	{
		this.builder = this.createBuilder(fn);
	},
	
	
	/**
	 * Default Builder - Automatic Data filler
	 * 
	 * @alias jQuery.Chain.services.chain.defaultBuilder
	 * 
	 * @param {Function} 	builder 	Builder Function
	 * @param {Object}		root		Root Element Object
	 * 
	 * @see jQuery.Chain.services.chain.createBuilder
	 */ 
	defaultBuilder: function(builder, root)
	{
		// Caution:
		// @this@ is in this function @this.element@
		
		// if builder return false, res will be false
		// Otherwise true
		// Using this, the default updater can be disabled
		var res = builder ? (builder.apply(this, [root]) !== false) : true;
		
		// Default Updater
		if(res)
		{
			this.bind('update', function(event, data){
				var self = $(this);
				// Iterate through data
				// Find element with the same class as data property
				// Insert data depending of elemen type
				for(var i in data)
				{	
					if(typeof data[i] != 'object' && typeof data[i] != 'function')
					{
						// This prevents selector to select inside nested chain-element
						// Important to support recursion & nested element
						// NEED OPTIMIZATION
						self.find('> .'+i+', *:not(.chain-element) .'+i)
							.each(function(){
								var match = $(this);
								if(match.filter(':input').length)
									{match.val(data[i]);}
								else if(match.filter('img').length)
									{match.attr('src', data[i]);}
								else
									{match.html(data[i]);}
							});
					}
				}
			});
		}
	},
	
	/**
	 * Builder Generator (Wrapper).
	 * 
	 * @alias jQuery.Chain.services.chain.createBuilder
	 * 
	 * @param {Function} builder Builder
	 * 
	 * @return {Function} Wrapped Builder
	 * 
	 * @see jQuery.Chain.services.chain.defaultBuilder;
	 */ 
	createBuilder: function(builder)
	{
		var defBuilder = this.defaultBuilder;
		return function(root){
			defBuilder.apply(this, [builder, root]);
			return false;
		};
	},
	
	/**
	 * Set Anchor (Container for @items@ to be populated, default: @this.element@)
	 * 
	 * @alias jQuery.Chain.services.chain.setAnchor
	 * 
	 * @param {Object} anchor Anchor element
	 * 
	 * @see jQuery.Chain.services.chain.$anchor
	 */ 
	setAnchor: function(anchor)
	{
		this.anchor.html(this.template);
		this.anchor = anchor == this.element ? anchor : this.element.find(anchor).eq(0);
		this.template = this.anchor.html();
		this.anchor.empty();
	},
	
	/**
	 * Set new Anchor and rerender if new anchor passed.
	 * Otherwise return current anchor.
	 * 
	 * If you use @items()@ with @chain()@,
	 * you can use @chain('anchor', selector)@ to move the element,
	 * where the items will be generated.
	 * 
	 * @alias chain('anchor')
	 * @alias jQuery.Chain.services.chain.$anchor
	 * 
	 * @param {Object} anchor Anchor element or selector
	 * 
	 * @return {Object} current element (if new Anchor passed), otherwise current anchor
	 * 
	 * @example
	 * $('#persons').chain('anchor', '.wrapper');
	 * 
	 * // Define Anchor directly while building
	 * $('#persons').items([...]).chain({anchor:'.wrapper', builder: ...});
	 */ 
	$anchor: function(anchor)
	{
		if(anchor)
		{
			this.element.items('backup');
			this.element.item('backup');
			
			this.setAnchor(anchor);
			this.element.update();
			
			return this.element;
		}
		else
		{
			return this.anchor;
		}
	},
	
	/**
	 * Getting/Switching Template.
	 * 
	 * @alias chain('template')
	 * @alias jQuery.Chain.services.chain.$template
	 * 
	 * @param {Number, String} arg Argument
	 * 
	 * @return {Object} jQuery Object
	 * 
	 * @example
	 * $(selector).chain('template') // Returns current Template (jQuery Object)
	 * $(selector).chain('template', 'raw') // Returns raw HTML Templates (all)
	 * $(selector).chain('template', nr) // Switch to template nr (read: Number)
	 * $(selector).chain('template', '.tree-column') // Switch by selector
	 */ 
	$template: function(arg)
	{
		// Returns current Template (jQuery Object)
		if(!arguments.length)
			{return $('<div>').html(this.template).children().eq(this.tplNumber);}
		
		// Returns raw HTML Template
		if(arg == 'raw')
			{return this.template;}
		
		// Switch template by Number
		if(typeof arg == 'number')
		{
			this.tplNumber = arg;
		}
		// Switch template by selector
		else
		{
			var tpl = $('<div>').html(this.template).children();
			var node = tpl.filter(arg).eq(0);
			
			if(node.length)
				{this.tplNumber = tpl.index(node);}
			else
				{return this.element;} // If not found do nothing
		}
		
		this.element.items('backup');
		this.element.item('backup');
		this.element.update();
		
		return this.element;
	},
	
	/**
	 * Get/Change Builder.
	 * If you don't pass any argument, it will return the created builder.
	 * 
	 * @alias chain('builder')
	 * @alias jQuery.Chain.services.chain.$builder
	 * 
	 * @param {Function, Object} builder (Optional)
	 * 
	 * @return {Function, Object} returns builder function, or jQuery Object depends on arg
	 * 
	 * @example
	 * $('#el').chain('builder') // returns builder function
	 * $('#el').chain('builder', newBuilder) // Replace Builder
	 */ 
	$builder: function(builder)
	{
		if(builder)
			{return this.handler(builder);}
		else
			{return this.builder;}
	},
	
	/**
	 * Check status
	 * 
	 * @alias chain('active')
	 * @alias jQuery.Chain.services.chain.$active
	 * 
	 * @return {Boolean} true if active
	 */ 
	$active: function()
	{
		return this.isActive;
	},
	
	/**
	 * Add/Remove Plugins that extend builder
	 * 
	 * @alias chain('plugin')
	 * @alias jQuery.Chain.services.chain.$plugin
	 * 
	 * @param {String} 				name 	Plugin Name
	 * @param {Function, Boolean} 	fn 		Plugin Function / False to remove
	 * 
	 * @return {Object} jQuery Object
	 */ 
	$plugin: function(name, fn)
	{
		if(fn === null)
			{delete this.plugins[name];}
		else if(typeof fn == 'function')
			{this.plugins[name] = fn;}
		else if(name && !fn)
			{return this.plugins[name];}
		else
			{return this.plugins;}
		
		if(typeof fn == 'function')
		{
			this.element.items(true).each(function(){
				var self = $(this);
				fn.call(self, self.item('root'));
			});
		}
		
		this.element.update();
		
		return this.element;
	},
	
	/**
	 * Clone Element unchained, with ID removed.
	 * 
	 * @alias chain('clone')
	 * @alias jQuery.Chain.services.chain.$clone
	 * 
	 * @return {Object} jQuery Object containing cloned Element
	 */ 
	$clone: function()
	{
		var id = this.element.attr('id');
		this.element.attr('id', '');
		
		var clone = this.element.clone().empty().html(this.template);
		this.element.attr('id', id);
		
		return clone;
	},
	
	/**
	 * Destroy Chain, restore Element to previous condition.
	 * 
	 * @alias chain('destroy')
	 * @alias jQuery.Chain.services.chain.$destroy
	 * 
	 * @param {Boolean} nofollow If true, it won't destroy nested chain elements
	 * 
	 * @return {Object} jQuery Object
	 */ 
	$destroy: function(nofollow)
	{
		this.element.removeClass('chain-element');
		
		if(!nofollow)
		{
			// Backup to buffer
			this.element.items('backup');
			this.element.item('backup');
			
			// Destroy nested elements
			this.element.find('.chain-element').each(function(){
				$(this).chain('destroy', true);
			});
		}
		
		// Trigger destroy event
		this.element.triggerHandler('destroy');
	
		this.isActive = false;
	
		// Restore HTML
		this.anchor.html(this.template);
		
		return this.element;
	}
});
	
})(jQuery);

/* item.js */
/**
 * Chain Item Service.
 * Method to bind item to object.
 * 
 * @alias item
 * 
 * @syntax $(selector).item(parameters);
 */ 

(function($){

/**
 * Chain Item Manager - Providing methods of @item@.
 * All method listed here can only be used internally
 * using @jQuery.Chain.service@ or @jQuery.Chain.extend@
 * 
 * @namespace
 * 
 * @alias jQuery.Chain.services.item
 * 
 * @see jQuery.Chain.service
 * @see jQuery.Chain.extend
 */ 

$.Chain.service('item', {
	/**
	 * Initializer. Executed once at the first time @item@ invoked.
	 * 
	 * @alias jQuery.Chain.services.item.init
	 * 
	 * @see jQuery.Chain.service
	 */ 
	init: function()
	{
		this.isActive = false;
		this.isBuilt = false;
		this.root = this.element;
		this.data = false;
		this.datafn = this.dataHandler;
	},
	
	/**
	 * Default handler.
	 * 
	 * @alias jQuery.Chain.services.item.handler
	 * 
	 * @param {Object} obj Object to be handled
	 * 
	 * @return {Object} jQuery Object
	 * 
	 * @see jQuery.Chain.service
	 * @see jQuery.Chain.services.item.handleObject
	 * @see jQuery.Chain.services.item.handleFunction
	 * @see jQuery.Chain.services.item.handleDefault
	 */ 
	handler: function(obj)
	{
		if(typeof obj == 'object')
			{return this.handleObject(obj);}
		else if(typeof obj == 'function')
			{return this.handleFunction(obj);}
		else
			{return this.handleDefault();}
	},
	
	/**
	 * Edit/Bind Item.
	 * If no Object defined, it will bind the object to the Item, otherwise
	 * it will alter the object using the provided object.
	 * 
	 * @alias item(object)
	 * @alias jQuery.Chain.services.item.handleObject
	 * 
	 * @param {Object} obj Object to be inserted
	 * 
	 * @return {Object} jQuery Object
	 * 
	 * @example
	 * $('#element').item({name:'Rizqi', country:'Germany'});
	 * $('#element').item({country:'Indonesia'});
	 * $('#element').item(); // Returns {name:'Rizqi', country:'Indonesia'}
	 * 
	 * @see jQuery.Chain.services.item.handler
	 */ 
	handleObject: function(obj)
	{
		this.setData(obj);
		this.isActive = true;
		this.update();
		
		return this.element;
	},
	
	/**
	 * Add setter and getter to item.
	 * This function will change the way @item(object)@ and @item()@ works.
	 * 
	 * @alias item(fn)
	 * @alias jQuery.Chain.services.item.handleFunction
	 * 
	 * @param {Function} fn Getter&Setter Function
	 * 
	 * @return {Object} jQuery Object
	 * 
	 * @example
	 * $(element).item(function(oldval, newval){
	 * 		//setter
	 * 		if(newval)
	 * 			return $.extend(oldval, newval);
	 * 		//getter
	 *		else
	 * 			return oldval;
	 * })
	 */ 
	handleFunction: function(fn)
	{
		// datafn stores the getter/setter function
		this.datafn = fn;
		
		return this.element;
	},
	
	/**
	 * Get Data if no argument passed.
	 * 
	 * @alias item()
	 * @alias jQuery.Chain.services.item.handleDefault
	 * 
	 * @return {Object, Boolean} Returns Data Object if exist, otherwise false
	 */ 
	handleDefault: function()
	{
		if(this.isActive)
			{return this.getData();}
		else
			{return false;}
	},
	
	/**
	 * Data Getter Wrapper Function
	 * 
	 * @alias jQuery.Chain.services.item.getData
	 * 
	 * @return {Object} data
	 */ 
	getData: function()
	{
		// Call Getter
		this.data = this.datafn.call(this.element, this.data);
		
		return this.data;
	},
	
	/**
	 * Data Setter Wrapper Function
	 * 
	 * @alias jQuery.Chain.services.item.setData
	 */ 
	setData: function(obj)
	{
		var data;
		
		// Determine whether object is a jQuery object or a data object
		if($.Chain.jobject(obj) && obj.item())
			{data = $.extend({}, obj.item());}
		else if($.Chain.jobject(obj))
			{data = {};}
		else
			{data = obj;}
		
		// Call Setter
		this.data = this.datafn.call(this.element, this.data || data, data);
		
		// Handle Linked Element
		if(this.linkElement && this.linkElement[0] != obj[0])
		{
			var el = this.linkFunction();
			if($.Chain.jobject(el) && el.length && el.item())
				{el.item(this.data);}
		}
	},
	
	/**
	 * Default Getter/Setter
	 * 
	 * @alias jQuery.Chain.services.item.dataHandler
	 * 
	 * @param {Object} oldval Old value
	 * @param {Object} newval New Value
	 * 
	 * @return {Object} returns data value
	 */ 
	dataHandler: function(oldval, newval)
	{
		if(arguments.length == 2)
			{return $.extend(oldval, newval);}
		else
			{return oldval;}
	},
	
	/**
	 * Update element. Wrapper for @jQuery.Chain.services.item.element.update@
	 * 
	 * @alias jQuery.Chain.services.item.update
	 * 
	 * @return {Object} jQuery Object
	 */ 
	update: function()
	{
		return this.element.update();
	},
	
	/**
	 * Build item, apply builder and plugins
	 * 
	 * @alias jQuery.Chain.services.item.build
	 * 
	 * @see jQuery.Chain.services.item.$update
	 */ 
	build: function()
	{
		// IE Fix
		var fix = this.element.chain('template', 'raw').replace(/jQuery\d+\=\"null\"/gi, "");
		this.element.chain('anchor').html(fix);
		
		// If item has root (items)
		if(!$.Chain.jidentic(this.root, this.element))
		{
			// Get plugin from root and apply them
			var plugins = this.root.chain('plugin');
			for(var i in plugins)
			{
				plugins[i].apply(this.element, [this.root]);
			}
			
		}
		
		// Apply builder
		this.element.chain('builder').apply(this.element, [this.root]);
		this.isBuilt = true;
	},
	
	/**
	 * Item Updater, called within @$(element).update()@
	 * 
	 * @alias item('update')
	 * @alias jQuery.Chain.services.item.$update
	 * 
	 * @return {Object} jQuery Object
	 */ 
	$update: function()
	{
		if(this.element.chain('active') && this.isActive && !this.isBuilt && this.getData())
			{this.build();}
		
		return this.element;
	},
	
	/**
	 * Replace Data with new data
	 * 
	 * @alias item('replace')
	 * @alias jQuery.Chain.services.item.$replace
	 * 
	 * @param {Object} obj Data Object
	 * 
	 * @return {Object} jQuery Object
	 * 
	 * @example
	 * $(element).item('replace', data);
	 */ 
	$replace: function(obj)
	{
		this.data = {};
		this.setData(obj);
		this.isActive = true;
		this.update();
		return this.element;
	},
	
	/**
	 * Remove Item And destroy it.
	 * 
	 * @alias item('remove')
	 * @alias jQuery.Chain.services.item.$remove
	 * 
	 * @param {Boolean} noupdate If true it won't update the root element
	 */ 
	$remove: function(noupdate)
	{
		// Destroy And Remove
		this.element.chain('destroy');
		this.element.remove();
		this.element.item('link', null);
		this.element.item('destroy');
		
		// Update root under certain circumtances
		if(!$.Chain.jidentic(this.root, this.element) && !noupdate)
			{this.root.update();}
	},
	
	/**
	 * Check Status of @item@
	 * 
	 * @alias item('active')
	 * @alias jQuery.Chain.services.item.$active
	 * 
	 * @return {Boolean} Status
	 */ 
	$active: function()
	{
		return this.isActive;
	},
	
	/**
	 * Get/Set Root element.
	 * 
	 * @alias item('root');
	 * @alias jQuery.Chain.services.item.$root
	 * 
	 * @param {Object} root New Root element
	 * 
	 * @return {Object} If a new root passed, it will be item Element. Otherwise current root.
	 */ 
	$root: function(root)
	{
		if(arguments.length)
		{
			this.root = root;
			this.update();
			return this.element;
		}
		else
		{
			return this.root;
		}
	},
	
	/**
	 * Backup Item to the state before being built.
	 * 
	 * @alias item('backup')
	 * @alias jQuery.Chain.services.item.$backup
	 * 
	 * @return {Object} jQuery Object
	 */ 
	$backup: function()
	{
		this.isBuilt = false;
		
		return this.element;
	},
	
	/**
	 * Bind Item to other (chained) element. If one of them is updated,
	 * the linked element will be updated.
	 * 
	 * @alias item('link')
	 * @alias jQuery.Chain.services.item.$link
	 * 
	 * @param {Object} element element/selector to be linked with
	 * @param {String} collection Collection to be linked with (has to be @"self"@ if linked to item)
	 * 
	 * @return {Object} jQuery Element
	 * 
	 * @see jQuery.Chain.services.items.collection
	 */ 
	$link: function(element, collection)
	{
		// If there are previous linkElement
		if(this.linkElement)
		{
			this.linkElement.unbind('update', this.linkUpdater);
			this.linkElement = null;
		}
		
		element = $(element);
		if(element.length)
		{
			var self = this;
			this.isActive = true;
			this.linkElement = element;
			// Function that get the linked item.
			this.linkFunction = function()
			{
				if(typeof collection == 'function')
				{
					try{
						return collection.call(self.element, self.linkElement);
					}catch(e){
						return $().eq(-1);
					}
				}
				else if(typeof collection == 'string')
				{
					return self.linkElement.items('collection', collection);
				}
				else
				{
					return $().eq(-1);
				}
			};
			
			// Watch linked element for update, and trigger update in self
			this.linkUpdater = function()
			{
				var res = self.linkFunction();
				if(res && res.length)
					{self.element.item(res);}
			};
			
			this.linkElement.bind('update', this.linkUpdater);
			this.linkUpdater();
		}
		
		return this.element;
	},
	
	/**
	 * Destroy item service.
	 * 
	 * @alias item('destroy')
	 * @alias jQuery.Chain.services.item.$destroy
	 * 
	 * @return {Object} jQuery Element
	 */ 
	$destroy: function()
	{
		return this.element;
	}
});

})(jQuery);

/* items.js */
/**
 * Chain Items Service.
 * Method to bind items to object.
 * 
 * @alias items
 * 
 * @syntax $(selector).items(parameters);
 */ 

(function($){

/**
 * Chain Items Manager - Providing methods of @items@.
 * All method listed here can only be used internally
 * using @jQuery.Chain.service@ or @jQuery.Chain.extend@
 * 
 * @namespace
 * 
 * @alias jQuery.Chain.services.items
 * 
 * @see jQuery.Chain.service
 * @see jQuery.Chain.extend
 */ 

$.Chain.service('items', {
	/**
	 * Collection of Function for getting items
	 * 
	 * @namespace
	 * @alias jQuery.Chain.services.items.collections
	 * 
	 * @see jQuery.Chain.services.items.collection
	 */ 
	collections: 
	{
		/**
		 * Get all items, including hidden
		 * 
		 * @alias jQuery.Chain.services.items.collections.all
		 * 
		 * @return {Object} jQuery Object containing items
		 */ 
		all: function()
		{
			return this.element.chain('anchor').children('.chain-item');
		},
		
		/**
		 * Get all visible items
		 * 
		 * @alias jQuery.Chain.services.items.collections.visible
		 * 
		 * @return {Object} jQuery Object containing items
		 */ 
		visible: function()
		{
			return this.element.chain('anchor').children('.chain-item:visible');
		},
		
		/**
		 * Get all hidden items
		 * 
		 * @alias jQuery.Chain.services.items.collections.hidden
		 * 
		 * @return {Object} jQuery Object containing items
		 */ 
		hidden: function()
		{
			return this.element.chain('anchor').children('.chain-item:hidden');
		},
		
		/**
		 * Get self
		 * 
		 * @alias jQuery.Chain.services.items.collections.self
		 * 
		 * @return {Object} jQuery Object of the element
		 */ 
		self: function()
		{
			return this.element;
		}
	},
	
	/**
	 * Initializer. Executed once at the first time @items@ invoked.
	 * 
	 * @alias jQuery.Chain.services.items.init
	 * 
	 * @see jQuery.Chain.service
	 */ 
	init: function()
	{
		this.isActive = false;
		this.pushBuffer = [];
		this.shiftBuffer = [];
		this.collections = $.extend({}, this.collections);
	},
	
	/**
	 * Default handler.
	 * 
	 * @alias jQuery.Chain.services.items.handler
	 * 
	 * @param {Object} obj Object to be handled
	 * 
	 * @return {Object} jQuery Object
	 * 
	 * @see jQuery.Chain.service
	 * @see jQuery.Chain.services.items.handleObject
	 * @see jQuery.Chain.services.items.handleElement
	 * @see jQuery.Chain.services.items.handleArray
	 * @see jQuery.Chain.services.items.handleNumber
	 * @see jQuery.Chain.services.items.handleTrue
	 * @see jQuery.Chain.services.items.handleDefault
	 */ 
	handler: function(obj)
	{
		// Array
		if(obj instanceof Array)
			{return this.handleArray(obj);}
		// Inactive
		else if(!this.isActive)
			{return $().eq(-1);}
		// jQuery Object
		else if($.Chain.jobject(obj))
			{return this.handleElement(obj);}
		// Normal Object
		else if(typeof obj == 'object')
			{return this.handleObject(obj);}
		// Number
		else if(typeof obj == 'number')
			{return this.handleNumber(obj);}
		// True
		else if(obj === true)
			{return this.handleTrue();}
		// Default
		else
			{return this.handleDefault();}
	},
	
	/**
	 * If a Data Object is given, it will return the item element
	 * containing the object if it exists, otherwise empty.
	 * 
	 * @alias items(object)
	 * @alias jQuery.Chain.services.items.handleObject
	 * 
	 * @param {Object} obj Data Object
	 * 
	 * @return {Object} jQuery Object
	 */ 
	handleObject: function(obj)
	{
		// Get Element By Data
		return this.collection('all').filter(function(){return $(this).item() == obj;});
	},
	
	/**
	 * If a jQuery Element is given, it will return itself if it is part of the items,
	 * otherwise empty jQuery object.
	 * 
	 * @alias items(element)
	 * @alias jQuery.Chain.services.items.handleElement
	 * 
	 * @param {Object} obj jQuery Object
	 * 
	 * @return {Object} jQuery Object
	 */ 
	handleElement: function(obj)
	{
		// Check element whether it is part of items or not.
		if(!$.Chain.jidentic(obj, obj.item('root')) && $.Chain.jidentic(this.element, obj.item('root')))
			{return obj;}
		else
			{return $().eq(-1);}
	},
	
	/**
	 * If array is given, it will merge it to current items
	 * 
	 * @alias items(array)
	 * @alias jQuery.Chain.services.items.handleArray
	 * 
	 * @param {Array} array Array of Data
	 * 
	 * @return {Object} jQuery Object
	 */ 
	handleArray: function(array)
	{
		// Array will be merged in
		return this.$merge(array);
	},
	
	/**
	 * If number is given, it will get the object with the current number. Use -1 to get the last number.
	 * 
	 * @alias items(number)
	 * @alias jQuery.Chain.services.items.handleNumber
	 * 
	 * @param {Number} number Index
	 * 
	 * @return {Object} jQuery Object
	 */ 
	handleNumber: function(number)
	{
		// if -1, it will get the last.
		if(number == -1)
			{return this.collection('visible').filter(':last');}
		else
			{return this.collection('visible').eq(number);}
	},
	
	/**
	 * If @true@ is given, it will get all items including the hidden one.
	 * 
	 * @alias items(true)
	 * @alias jQuery.Chain.services.items.handleTrue
	 * 
	 * @return {Object} jQuery Object
	 * 
	 * @see jQuery.Chain.services.items.collections.all
	 */ 
	handleTrue: function()
	{
		return this.collection('all');
	},
	
	/**
	 * If nothing is given, it will get all visible items.
	 * 
	 * @alias items(true)
	 * @alias jQuery.Chain.services.items.handleTrue
	 * 
	 * @return {Object} jQuery Object
	 * 
	 * @see jQuery.Chain.services.items.collections.visible
	 */ 
	handleDefault: function()
	{
		return this.collection('visible');
	},
	
	/**
	 * Update element
	 * 
	 * @alias jQuery.Chain.services.items.update
	 */ 
	update: function()
	{
		this.element.update();
	},
	
	/**
	 * Clear all items
	 * 
	 * @alias jQuery.Chain.services.items.empty
	 */ 
	empty: function()
	{
		var all = this.collection('all');
		
		// Remove items
		// Make it run in the background. for responsiveness.
		setTimeout(function(){all.each(function(){$(this).item('remove', true);});}, 1);
		
		// Empty anchor container
		this.element.chain('anchor').empty();
	},
	
	/**
	 * Get collection of items. Define a collection by adding a function argument
	 * 
	 * @alias jQuery.Chain.services.items.collection
	 * 
	 * @param {String} col Collection name
	 * @param {Function} fn Create a collection function
	 * 
	 * @return {Object} jQuery Object
	 */ 
	collection: function(col, fn)
	{
		if(arguments.length > 1)
		{
			if(typeof fn == 'function')
				{this.collections[col] = fn;}
			
			return this.element;
		}
		else
		{
			if(this.collections[col])
				{return this.collections[col].apply(this);}
			else
				{return $().eq(-1);}
		}
		
	},
	
	/**
	 * Items Updater, called by @$(element).update()@
	 * 
	 * @alias items('update')
	 * @alias jQuery.Chain.services.items.$update
	 * 
	 * @return {Object} jQuery Element
	 */ 
	$update: function()
	{
		if(!this.element.chain('active') || !this.isActive)
			{return this.element;}
		
		var self = this;
		var builder = this.element.chain('builder');
		var template = this.element.chain('template');
		var push;
		
		var iterator = function(){
			var clone = template
				.clone()[push ? 'appendTo' :'prependTo'](self.element.chain('anchor'))
				.addClass('chain-item')
				.item('root', self.element);
			
			if(self.linkElement && $.Chain.jobject(this) && this.item())
				{clone.item('link', this, 'self');}
			else
				{clone.item(this);}
			
			clone.chain(builder);
		};
		
		push = false;
		$.each(this.shiftBuffer, iterator);
		push = true;
		$.each(this.pushBuffer, iterator);
		
		
		this.shiftBuffer = [];
		this.pushBuffer = [];
		
		return this.element;
	},
	
	/**
	 * Add item(s). use @items('add', 'shift', item)@ to add item at the top
	 * 
	 * @alias items('add')
	 * @alias jQuery.Chain.services.items.$add
	 * 
	 * @param {Object} item
	 * 
	 * @return {Object} jQuery Object
	 */ 
	$add: function()
	{
		if(this.linkElement)
			{return this.element;}
		
		var cmd;
		var args = Array.prototype.slice.call(arguments);
		// Extract command
		if(typeof args[0] == 'string')
			{cmd = args.shift();}
		
		var buffer = (cmd == 'shift') ? 'shiftBuffer' : 'pushBuffer';
		
		this.isActive = true;
		this[buffer] = this[buffer].concat(args);
		this.update();
		
		return this.element;
	},
	
	/**
	 * Merge items with array of item data
	 * 
	 * @alias items('merge')
	 * @alias jQuery.Chain.services.items.$merge
	 * 
	 * @param {String} cmd Switch for push/shift
	 * @param {Array} items Item Data
	 * 
	 * @return {Object} jQuery Element
	 */ 
	$merge: function(cmd, items)
	{
		if(this.linkElement)
			{return this.element;}
		
		if(typeof cmd != 'string')
			{items = cmd;}
		var buffer = (cmd == 'shift') ? 'shiftBuffer' : 'pushBuffer';
		
		this.isActive = true;
		if($.Chain.jobject(items))
			{this[buffer] = this[buffer].concat(items.map(function(){return $(this);}).get());}
		else if(items instanceof Array)
			{this[buffer] = this[buffer].concat(items);}
		this.update();
		
		return this.element;
	},
	
	/**
	 * Replace items with new items array
	 * 
	 * @alias items('replace')
	 * @alias jQuery.Chain.services.items.$replace
	 * 
	 * @param {String} cmd Switch for push/shift
	 * @param {Array} items Item Data
	 * 
	 * @return {Object} jQuery Element
	 */ 
	$replace: function(cmd, items)
	{
		if(this.linkElement && arguments.callee.caller != this.linkUpdater)
			{return this.element;}
		
		if(typeof cmd != 'string')
			{items = cmd;}
		var buffer = (cmd == 'shift') ? 'shiftBuffer' : 'pushBuffer';
		
		this.isActive = true;
		this.empty();
		
		if($.Chain.jobject(items))
			{this[buffer] = items.map(function(){return $(this);}).get();}
		else if(items instanceof Array)
			{this[buffer] = items;}
		
		this.update();
		
		return this.element;
	},
	
	/**
	 * Remove item
	 * 
	 * @alias items('remove')
	 * @alias jQuery.Chain.services.items.$remove
	 * 
	 * @param {Object, Number} item
	 * 
	 * @return {Object} jQuery Object
	 */ 
	$remove: function()
	{
		if(this.linkElement)
			{return this.element;}
		
		for(var i=0; i<arguments.length; i++)
			{this.handler(arguments[i]).item('remove', true);}
		this.update();
		
		return this.element;
	},
	
	/**
	 * Reorder Item
	 * 
	 * @alias items('reorder')
	 * @alias jQuery.Chain.services.items.$reorder
	 * 
	 * @param {Object} item1 Item 1
	 * @param {Object} item2 Item 2
	 * 
	 * @return {Object} jQuery object
	 */ 
	$reorder: function(item1, item2)
	{
		if(item2)
			{this.handler(item1).before(this.handler(item2));}
		else
			{this.handler(item1).appendTo(this.element.chain('anchor'));}
		this.update();
		
		return this.element;
	},
	
	/**
	 * Clear all items
	 * 
	 * @alias items('empty')
	 * @alias jQuery.Chain.services.items.$empty
	 * 
	 * @return {Object} jQuery object
	 */ 
	$empty: function()
	{
		if(this.linkElement)
			{return this.element;}
		
		this.empty();
		this.shiftBuffer = [];
		this.pushBuffer = [];
		this.update();
		
		return this.element;
	},
	
	/**
	 * Like @items()@ but returns array of data instead of the jQuery object.
	 * 
	 * @alias items('data')
	 * @alias jQuery.Chain.services.items.$data
	 * 
	 * @return {Array} list of data
	 */ 
	$data: function(x)
	{
		return this.handler(x).map(function(){return $(this).item();}).get();
	},
	
	/**
	 * Bind Items to other (chained) element. If one of them is updated,
	 * the linked element will be updated.
	 * 
	 * @alias items('link')
	 * @alias jQuery.Chain.services.items.$link
	 * 
	 * @param {Object} element element/selector to be linked with
	 * @param {String} collection Collection to be linked with (has to be @"self"@ if linked to item)
	 * 
	 * @return {Object} jQuery Element
	 * 
	 * @see jQuery.Chain.services.items.collection
	 */ 
	$link: function(element, collection)
	{
		// Remove linked element if it already exist
		if(this.linkElement)
		{
			this.linkElement.unbind('update', this.linkUpdater);
			this.linkElement = null;
		}
		
		element = $(element);
		// If element exists
		if(element.length)
		{
			var self = this;
			this.linkElement = element;
			// Create Collector Function
			this.linkFunction = function()
			{
				if(typeof collection == 'function')
				{
					try{
						return collection.call(self.element, self.linkElement);
					}catch(e){
						return $().eq(-1);
					}
				}
				else if(typeof collection == 'string')
				{
					return self.linkElement.items('collection', collection);
				}
				else
				{
					return $().eq(-1);
				}
			};
			
			// Create Updater Function
			this.linkUpdater = function()
			{
				self.$replace(self.linkFunction());
			};
			
			// Bind updater to linked element
			this.linkElement.bind('update', this.linkUpdater);
			this.linkUpdater();
		}
		
		return this.element;
	},
	
	/**
	 * Get index of an Item
	 * 
	 * @alias items('index')
	 * @alias jQuery.Chain.services.items.$index
	 * 
	 * @param {Object} item
	 * 
	 * @return {Number} index
	 */ 
	$index: function(item)
	{
		return this.collection('all').index(this.handler(item));
	},
	
	/**
	 * Get collection of items. Define a collection by adding a function argument
	 * 
	 * @alias items('collection')
	 * @alias jQuery.Chain.services.items.$collection
	 * 
	 * @param {String} col Collection name
	 * @param {Function} fn Create a collection function
	 * 
	 * @return {Object} jQuery Object
	 */ 
	$collection: function()
	{
		return this.collection.apply(this, Array.prototype.slice.call(arguments));
	},
	
	/**
	 * Check Status of @items@
	 * 
	 * @alias items('active')
	 * @alias jQuery.Chain.services.items.$active
	 * 
	 * @return {Boolean} Status
	 */ 
	$active: function()
	{
		return this.isActive;
	},
	
	/**
	 * Backup Item to the state before being built.
	 * 
	 * @alias items('backup')
	 * @alias jQuery.Chain.services.items.$backup
	 * 
	 * @return {Object} jQuery Object
	 */ 
	$backup: function()
	{
		if(!this.element.chain('active') || !this.isActive)
			{return this.element;}
		
		var buffer = [];
		this.collection('all').each(function(){
			var item = $(this).item();
			if(item)
				{buffer.push(item);}
		});
		
		this.pushBuffer = buffer.concat(this.pushBuffer);
		
		this.empty();
		
		return this.element;
	},
	
	/**
	 * Destroy items service.
	 * 
	 * @alias items('destroy')
	 * @alias jQuery.Chain.services.items.$destroy
	 * 
	 * @return {Object} jQuery Element
	 */ 
	$destroy: function()
	{
		this.empty();
		return this.element;
	}
});

// Filtering extension
$.Chain.extend('items', {
	/**
	 * Filtering subroutine
	 * 
	 * @alias jQuery.Chain.services.items.doFilter
	 */ 
	doFilter: function()
	{
		var props = this.searchProperties;
		var text = this.searchText;
		
		if(text)
		{
			// Make text lowerCase if it is a string
			if(typeof text == 'string')
				{text = text.toLowerCase();}
			
			// Filter items
			var items = this.element.items(true).filter(function(){
				var data = $(this).item();
				// If search properties is defined, search for text in those properties
				if(props)
				{
					for(var i=0; i<props.length; i++)
					{
						if(typeof data[props[i]] == 'string'
							&& !!(typeof text == 'string' ? data[props[i]].toLowerCase() : data[props[i]]).match(text))
							{return true;}
					}
				}
				// Otherwise search in all properties
				else
				{
					for(var prop in data)
					{
						if(typeof data[prop] == 'string'
							&& !!(typeof text == 'string' ? data[prop].toLowerCase() : data[prop]).match(text))
							{return true;}
					}
				}
			});
			this.element.items(true).not(items).hide();
			items.show();
		}
		else
		{
			this.element.items(true).show();
			this.element.unbind('preupdate', this.searchBinding);
			this.searchBinding = null;
		}
	},
	
	/**
	 * Filter items by criteria. Filtered items will be hidden.
	 * 
	 * @alias items('filter')
	 * @alias jQuery.Chain.services.items.$filter
	 * 
	 * @param {String, RegExp} text Search keyword
	 * @param {String, Array} properties Search properties
	 * 
	 * @return {Object} jQuery Object
	 */ 
	$filter: function(text, properties)
	{
		// If no argument, just refilter
		if(!arguments.length)
			{return this.update();}
		
		this.searchText = text;
		
		if(typeof properties == 'string')
			{this.searchProperties = [properties];}
		else if(properties instanceof Array)
			{this.searchProperties = properties;}
		else
			{this.searchProperties = null;}
		
		// Bind to preupdate
		if(!this.searchBinding)
		{
			var self = this;
			this.searchBinding = function(event, item){self.doFilter();};
			this.element.bind('preupdate', this.searchBinding);
		}
		
		return this.update();
	}
});

// Sorting extension
$.Chain.extend('items', {
	/**
	 * Sorting subroutine
	 * 
	 * @alias jQuery.Chain.services.items.doSort
	 */ 
	doSort: function()
	{
		var name = this.sortName;
		var opt = this.sortOpt;
		
		var sorter = 
		{
			'number': function(a, b){
				return parseFloat(($(a).item()[name]+'').match(/\d+/gi)[0])
					- parseFloat(($(b).item()[name]+'').match(/\d+/gi)[0]);
			},
		
			'default': function(a, b){
				return $(a).item()[name] > $(b).item()[name] ? 1 : -1;
			}
		};
		
		if(name)
		{
			var sortfn = opt.fn || sorter[opt.type] || sorter['default'];
				
			var array = this.element.items(true).get().sort(sortfn);
			
			array = opt.desc ? array.reverse() : array;
			
			for(var i=0; i<array.length; i++)
				{this.element.chain('anchor').append(array[i]);}
			
			opt.desc = opt.toggle ? !opt.desc : opt.desc;
		}
		else
		{
			this.element.unbind('preupdate', this.sortBinding);
			this.sortBinding = null;
		}
	},
	
	/**
	 * Sort items by property.
	 * 
	 * @alias items('sort')
	 * @alias jQuery.Chain.services.items.$sort
	 * 
	 * @param {String} name sorting property
	 * @param {Object} opt {toggle:true/false, desc:true/false, type:'number/default'}
	 * 
	 * @return {Object} jQuery Object
	 */ 
	$sort: function(name, opt)
	{
		if(!name && name !== null && name !== false)
			{return this.update();}
		
		if(this.sortName != name)
			{this.sortOpt = $.extend({desc:false, type:'default', toggle:false}, opt);}
		else
			{$.extend(this.sortOpt, opt);}
		
		this.sortName = name;
		
		if(!this.sortBinding)
		{
			var self = this;
			this.sortBinding = function(event, item){self.doSort();};
			this.element.bind('preupdate', this.sortBinding);
		}
		
		return this.update();
	}
});
	
})(jQuery);

/*

            _/    _/_/    _/_/_/_/_/                              _/       
               _/    _/      _/      _/_/    _/    _/    _/_/_/  _/_/_/    
          _/  _/  _/_/      _/    _/    _/  _/    _/  _/        _/    _/   
         _/  _/    _/      _/    _/    _/  _/    _/  _/        _/    _/    
        _/    _/_/  _/    _/      _/_/      _/_/_/    _/_/_/  _/    _/     
       _/                                                                  
    _/

    Created by David Kaneda <http://www.davidkaneda.com>
    Documentation and issue tracking on Google Code <http://code.google.com/p/jqtouch/>
    
    Special thanks to Jonathan Stark <http://jonathanstark.com/>
    and pinch/zoom <http://www.pinchzoom.com/>
    
    (c) 2009 by jQTouch project members.
    See LICENSE.txt for license.

*/

(function($) {
    if ($.jQTouch)
    {
        $.jQTouch.addExtension(function AutoTitles(jQT){
            
            var titleSelector='.toolbar h1';

            $(function(){
                $('#jqt').bind('pageAnimationStart', function(e, data){
                    if (data.direction === 'in'){
                        var $title = $(titleSelector, $(e.target));
                        var $ref = $(e.target).data('referrer');
                        if ($title.length && $ref){
                            $title.html($ref.text());
                        }
                    }
                });
            });
            
            function setTitleSelector(ts){
                titleSelector=ts;
            }
            
            return {
                setTitleSelector: setTitleSelector
            }

        });
    }
})(jQuery);

/*

            _/    _/_/    _/_/_/_/_/                              _/       
               _/    _/      _/      _/_/    _/    _/    _/_/_/  _/_/_/    
          _/  _/  _/_/      _/    _/    _/  _/    _/  _/        _/    _/   
         _/  _/    _/      _/    _/    _/  _/    _/  _/        _/    _/    
        _/    _/_/  _/    _/      _/_/      _/_/_/    _/_/_/  _/    _/     
       _/                                                                  
    _/

    Created by David Kaneda <http://www.davidkaneda.com>
    HTML5 database extension by Cedric Dugas <http://www.position-absolute.com>
    Documentation and issue tracking on Google Code <http://code.google.com/p/jqtouch/>
    
    Special thanks to Jonathan Stark <http://jonathanstark.com/>
    and pinch/zoom <http://www.pinchzoom.com/>
    
    (c) 2009 by jQTouch project members.
    See LICENSE.txt for license.

*/

(function($) {
    if ($.jQTouch)
    {
        $.jQTouch.addExtension(function Counter(jQTouch){
            var db,dbName;
            var debugging = false;	// Debugging Window
            
            function dbOpen(name,version,desc,size) {	// Open database
            	dbName = name
          	 	if (window.openDatabase) {
            	 	 db = openDatabase(name, version, desc, size);
				        if (!db){
				            debugTxt= ("Failed to open the database on disk.  This is probably because the version was bad or there is not enough space left in this domain's quota");
				            if(debugging){ debug(debugTxt)}
				        }    
				 } else{
				      debugTxt= ("Couldn't open the database.  Please try with a WebKit nightly with this feature enabled");
				      if(debugging){ debug(debugTxt)}
				}
            }
            function dbCreateTables(tbJson) {
            	
            	for(x=0;x<tbJson.createTables.length;x++){	// Loop in the json for every table
            		createQuery(tbJson.createTables[x]);
            	} 	
	            	function createQuery(tbNode){			// Create the SQL that will create the tables
	            		debugTxt = "create table "+ tbNode.table;
	            		var stringQuery = "CREATE TABLE " + tbNode.table + " (";
	            		nodeSize = tbNode.property.length -1;
	            		for(y=0;y<=nodeSize;y++){
	            			stringQuery += tbNode.property[y].name +" "+ tbNode.property[y].type;
	            			if(y != nodeSize) {stringQuery +=", "}
	            		}
	            		stringQuery +=")";
	            		dbExecuteQuery(stringQuery,debugTxt);
	            	}
            }
           	function dbDeleteRow(table,key,value) {		// Simple Delete row
         		stringQuery = "DELETE FROM " + table + " WHERE " + key +" = " + value;
           		debugTxt = "delete row" + key + " " + value;
           		dbExecuteQuery(stringQuery,debugTxt);
			}
			function dbSelectAll(table,fn) {
         		stringQuery = "SELECT * FROM " + table;
          		debugTxt = "selecting everything in table " + table;
               	dbExecuteQuery(stringQuery,debugTxt,fn);
			}
			function dbDropTable(table) {
         		stringQuery = "DROP TABLE " + table;
         		debugTxt = "delete table " + table;
           		dbExecuteQuery(stringQuery,debugTxt);
			}
            function dbInsertRows(tbJson) {		// Insert Row
            	for(x=0;x<tbJson.addRow.length;x++){ 		// loop in every row from JSON
            		createQueryRow(tbJson.addRow[x]);
            	}
            	function createQueryRow(tbNode){		// Create every row SQL
            		debugTxt = "create row " + tbNode.table;
            		
	         		stringQuery = "INSERT INTO " + tbNode.table + " ("
	     			nodeSize = tbNode.property.length -1;
	        		for(y=0;y<=nodeSize;y++){
	        			stringQuery += tbNode.property[y].name;
	        			if(y != nodeSize) {stringQuery +=", "}
	        		}
	        		stringQuery +=") VALUES (";
	        		for(y=0;y<=nodeSize;y++){
	        			stringQuery += '"'+ tbNode.property[y].value +'"';
	        			if(y != nodeSize) {stringQuery +=", "}
	        		}
	        		stringQuery +=")";
	           		dbExecuteQuery(stringQuery,debugTxt);
           		}
			}
			
            function dbExecuteQuery(stringQuery,debugTxtRaw,fn ) {		// Execute all query, can be called in website script
             	debugTxtRaw += "<br> SQL: " + stringQuery;
            	callback = fn;											// Callback
            	 
        		db.transaction(function(tx) {			
			        tx.executeSql(stringQuery, [], function(tx,result) { 	// Execute SQL
			        	if (callback) {callback(result);}					// Execute callback
		               	if(debugging){
				         	debugTxtRaw += "<br><span style='color:green'>success</span> ";
				         	debug(debugTxtRaw);	
		         		}
			        }, function(tx, error) {
			        	debugTxtRaw += "<br><span style='color:red'>"+error.message+"</span> "; 
			        	if(debugging){
				        	debug(debugTxtRaw);	
		         		}
		            });
		        });
        	}
        	function debug(error) {											// Create debug mode window
				if(!$("#debugMode")[0]){
					$("body").append("<div style='position:abolute;top:0 !important;left:0 !important;width:100% !important;min-height:100px !important; height:300px; overflow:scroll;z-index:1000; display:block; opacity:0.8; background:#000;-webkit-backface-visibility:visible ' id='debugMode'></div>");
				}
				$("#debugMode").append("<div class='debugerror'>"+error+"</div>");
			}			
            return {
                dbOpen: dbOpen,
                dbDeleteRow: dbDeleteRow,
                dbDropTable: dbDropTable,
                dbInsertRows: dbInsertRows,
                dbSelectAll: dbSelectAll,
                dbExecuteQuery: dbExecuteQuery,
                dbCreateTables: dbCreateTables
            }
        });
    }
})(jQuery);

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

/*

            _/    _/_/    _/_/_/_/_/                              _/       
               _/    _/      _/      _/_/    _/    _/    _/_/_/  _/_/_/    
          _/  _/  _/_/      _/    _/    _/  _/    _/  _/        _/    _/   
         _/  _/    _/      _/    _/    _/  _/    _/  _/        _/    _/    
        _/    _/_/  _/    _/      _/_/      _/_/_/    _/_/_/  _/    _/     
       _/                                                                  
    _/

    Created by David Kaneda <http://www.davidkaneda.com>
    Documentation and issue tracking on Google Code <http://code.google.com/p/jqtouch/>
    
    Special thanks to Jonathan Stark <http://jonathanstark.com/>
    and pinch/zoom <http://www.pinchzoom.com/>
    
    (c) 2009 by jQTouch project members.
    See LICENSE.txt for license.

*/

(function($) {
    if ($.jQTouch)
    {
        $.jQTouch.addExtension(function Floaty(jQT){
            
            $.fn.makeFloaty = function(options){
                var defaults = {
                    align: 'top',
                    spacing: 20,
                    time: '.3s'
                }
                var settings = $.extend({}, defaults, options);
                settings.align = (settings.align == 'top') ? 'top' : 'bottom';
                
                return this.each(function(){
                    var $el = $(this);
                    
                    $el.css({
                        '-webkit-transition': 'top ' + settings.time + ' ease-in-out',
                        'display': 'block',
                        'min-height': '0 !important'
                    }).data('settings', settings);
                    
                    $(document).bind('scroll', function(){
                        if ($el.data('floatyVisible') === true)
                        {
                            $el.scrollFloaty();
                        }
                    });
                    $el.scrollFloaty();
                });
            }

            $.fn.scrollFloaty = function(){
                return this.each(function(){
                    var $el = $(this);
                    var settings = $el.data('settings');
                    var wHeight = $('html').attr('clientHeight'); // WRONG
                    
                    var newY = window.pageYOffset +
                        ((settings.align == 'top') ? 
                            settings.spacing : wHeight - settings.spacing - $el.get(0).offsetHeight);
                    
                    $el.css('top', newY).data('floatyVisible', true);
                });
            }

            $.fn.hideFloaty = function(){
                return this.each(function(){
                    var $el = $(this);
                    var oh = $el.get(0).offsetHeight;
                    
                    $el.css('top', -oh-10).data('floatyVisible', false);
                });
            }
            
            $.fn.toggleFloaty = function(){
                return this.each(function(){
                    var $el = $(this);
                    if ($el.data('floatyVisible') === true){
                        $el.hideFloaty();
                    }
                    else
                    {
                        $el.scrollFloaty();
                    }
                });
            }
        });
    }
})(jQuery);

/*
 * jQTouch Gestures extension
 *
 * Built and maintaned by Tudor M.
 * email: tudor@grokprojects.com
 * stalk me: twitter.com/tudorizer
 *
 */
(function($) {
	if ($.jQTouch)
	{

		function bindGesture(options){
			var end_scale, end_rotation, settings, end_scale, rotation = 0;
			settings = { 
				element: $('#gesture_test'),
				onGestureStart: null,
				onGestureChange: null,
				onGestureEnd: null,
			};
			settings = $.extend({}, settings, options);

			settings.element
			.bind('gesturestart', function(e){
					e.originalEvent.preventDefault();
					if(settings.onGestureStart)
						settings.onGestureStart(getScale(e, end_scale), getRotation(e, rotation), e, settings.element);
				})
			.bind('gesturechange', function(e){
							if(settings.onGestureChange)
								settings.onGestureChange(getScale(e, end_scale), getRotation(e, rotation), e, settings.element);
						})
			.bind('gestureend', function(e){
					end_scale = e.originalEvent.scale;
					rotation = (e.originalEvent.rotation + rotation) % 360;
					if(settings.onGestureEnd)
						settings.onGestureEnd(getScale(e, end_scale), getRotation(e, rotation), e, settings.element);
				});
		}

		function getRotation(event, current_rotation){
			return event.originalEvent.rotation + current_rotation;
		}

		function getScale(event, current_scale){
			return event.originalEvent.scale + current_scale;
		}

		// PUBLIC methods
		$.fn.bindGestures = function(obj){
			obj.element = this;
			bindGesture(obj);
		};
	}
})(jQuery);


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

/*

            _/    _/_/    _/_/_/_/_/                              _/       
               _/    _/      _/      _/_/    _/    _/    _/_/_/  _/_/_/    
          _/  _/  _/_/      _/    _/    _/  _/    _/  _/        _/    _/   
         _/  _/    _/      _/    _/    _/  _/    _/  _/        _/    _/    
        _/    _/_/  _/    _/      _/_/      _/_/_/    _/_/_/  _/    _/     
       _/                                                                  
    _/

    Created by David Kaneda <http://www.davidkaneda.com>
    Documentation and issue tracking on Google Code <http://code.google.com/p/jqtouch/>
    
    Special thanks to Jonathan Stark <http://jonathanstark.com/>
    and pinch/zoom <http://www.pinchzoom.com/>
    
    (c) 2009 by jQTouch project members.
    See LICENSE.txt for license.

*/

(function($) {
    if ($.jQTouch)
    {
        $.jQTouch.addExtension(function Location(){
            
            var latitude, longitude, callback;
            
            function checkGeoLocation() {
                return navigator.geolocation;
            }
            function updateLocation(fn) {
                if (checkGeoLocation())
                {
                    callback = fn;
                    navigator.geolocation.getCurrentPosition(savePosition);
                    return true;
                } else {
                    console.log('Device not capable of geo-location.');
                    fn(false);
                    return false;
                }                
            }
            function savePosition(position) {
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
                if (callback) {
                    callback(getLocation());
                }
            }
            function getLocation() {
                if (latitude && longitude) {
                    return {
                        latitude: latitude,
                        longitude: longitude
                    }
                } else {
                    console.log('No location available. Try calling updateLocation() first.');
                    return false;
                }
            }
            return {
                updateLocation: updateLocation,
                getLocation: getLocation
            }
        });
    }
})(jQuery);

/*

            _/    _/_/    _/_/_/_/_/                              _/       
               _/    _/      _/      _/_/    _/    _/    _/_/_/  _/_/_/    
          _/  _/  _/_/      _/    _/    _/  _/    _/  _/        _/    _/   
         _/  _/    _/      _/    _/    _/  _/    _/  _/        _/    _/    
        _/    _/_/  _/    _/      _/_/      _/_/_/    _/_/_/  _/    _/     
       _/                                                                  
    _/

    Created by David Kaneda <http://www.davidkaneda.com>
    Documentation and issue tracking on Google Code <http://code.google.com/p/jqtouch/>
    
    Special thanks to Jonathan Stark <http://jonathanstark.com/>

    Lots of this code is specifically derived from Jonathan's book,
    "Building iPhone Apps with HTML, CSS, and JavaScript"
    
    (c) 2009 by jQTouch project members.
    See LICENSE.txt for license.

*/

(function($) {
    if ($.jQTouch)
    {
        $.jQTouch.addExtension(function Offline(){
            
            // Convenience array of status values
            var cacheStatusValues = [];
            cacheStatusValues[0] = 'uncached';
            cacheStatusValues[1] = 'idle';
            cacheStatusValues[2] = 'checking';
            cacheStatusValues[3] = 'downloading';
            cacheStatusValues[4] = 'updateready';
            cacheStatusValues[5] = 'obsolete';

            // Listeners for all possible events
            var cache = window.applicationCache;
            //cache.addEventListener('cached', logEvent, false);
            //cache.addEventListener('checking', logEvent, false);
            //cache.addEventListener('downloading', logEvent, false);
            //cache.addEventListener('error', logEvent, false);
            //cache.addEventListener('noupdate', logEvent, false);
            //cache.addEventListener('obsolete', logEvent, false);
            //cache.addEventListener('progress', logEvent, false);
            //cache.addEventListener('updateready', logEvent, false); 
			window.addEventListener('cached', logEvent, false);
            window.addEventListener('checking', logEvent, false);
            window.addEventListener('downloading', logEvent, false);
            window.addEventListener('error', logEvent, false);
            window.addEventListener('noupdate', logEvent, false);
            window.addEventListener('obsolete', logEvent, false);
            window.addEventListener('progress', logEvent, false);
            window.addEventListener('updateready', logEvent, false);

            // Log every event to the console
            function logEvent(e) {
                var online, status, type, message;
                online = (isOnline()) ? 'yes' : 'no';
                status = cacheStatusValues[cache.status];
                type = e.type;
                message = 'online: ' + online;
                message+= ', event: ' + type;
                message+= ', status: ' + status;
                if (type == 'error' && navigator.onLine) {
                    message+= ' There was an unknown error, check your Cache Manifest.';
                }
                console.log(message);
            }
            
            function isOnline() {
                return navigator.onLine;
            }
            
            if (!$('html').attr('manifest')) {
                console.log('No Cache Manifest listed on the <html> tag.')
            }

            // Swap in newly download files when update is ready
            //cache.addEventListener('updateready', function(e){
            window.addEventListener('updateready', function(e){
                    // Don't perform "swap" if this is the first cache
                    if (cacheStatusValues[cache.status] != 'idle') {
                        cache.swapCache();
                        console.log('Swapped/updated the Cache Manifest.');
                    }
                }
            , false);

            // These two functions check for updates to the manifest file
            function checkForUpdates(){
                cache.update();
            }
            function autoCheckForUpdates(){
                setInterval(function(){cache.update()}, 10000);
            }

            return {
                isOnline: isOnline,
                checkForUpdates: checkForUpdates,
                autoCheckForUpdates: autoCheckForUpdates
            }
        });
    }
})(jQuery);

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


/**
 * 
 * Add support for scrolling horizontally and vertically using jQTouch in Safari Mobile
 *
 * Copyright (c) 2009 Sam Shull <http://www.google.com/profiles/brickysam26>
 * Released under MIT license
 *
 * <code>
 *		<div id="vertical-scrolling-example">
 *			<div class="toolbar">
 *				<h1>Vertical Scroll Example</h1>
 *			</div>
 *			<div class="vertical-scroll">
 *				<div>
 *					This is where you insert scollable text
 *				</div>
 *			</div>
 *		</div>
 *
 *		<div id="horizontal-scrolling-example">
 *			<div class="toolbar">
 *				<h1>Horizontal Scroll Example</h1>
 *			</div>
 *			<div class="horizontal-scroll">
 *				<table>
 *					<tr>
 *						<td><div class="scroll-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="scroll-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="scroll-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="scroll-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="scroll-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="scroll-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *						<td><div class="scroll-container"><img src="http://rlv.zcache.com/css_is_awesome_mug-p1687164350719819282objs_210.jpg" alt="CSS Is Awesome"/></div></td>
 *					</tr>
 *				</table>
 *			</div>
 *		</div>
 * </code>
 *
 * Known issues:
 *		- <strike>horizontal scroll flickers without a button above it</strike>
 *		- must define a class selector for slideSelector to operate properly within the slide box - depending on version
 *
 *	Changes:
 *		- Updated horizontal scroll to use translate3d instead of translateX
 *		- Added "preventdefault" attribute detection as a means for allowing the event to bubble.
 * 
 * $Revision$
 * $Date$
 * $LastChangedBy$
 * 
 */

(function($)
{
		  
    $.fn.scrollVertically = function (options)
	{
		return this.each(function ()
		{
			new iScroll( this, options );
		});
	};
	
	$.fn.scrollHorizontally = function (options)
	{
		return this.each(function ()
		{
			new iScrollHorizontal( this, options );
		});
	};

			
    if ($.jQTouch)
    {
        $.jQTouch.addExtension(function (jQT){
            
			function binder (e, info)
			{
				var horizontal = info.page.find('.horizontal-scroll > table'),
					vertical = info.page.find('.vertical-scroll > div');
				
				horizontal.scrollHorizontally({
					acceleration: Number(horizontal.attr("slidespeed")|| 500) || null,
					preventdefault: horizontal.attr("preventdefault") !== "false",
					startposition: Number(horizontal.attr("position")|| 0) || 0
				});
				vertical.scrollVertically({
					acceleration: Number(vertical.attr("slidespeed") || 500),
					preventdefault: vertical.attr("preventdefault") !== "false",
					startposition: Number(horizontal.attr("position")|| 0) || 0
				});
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
		 * Find more about the scrolling function at
		 * http://cubiq.org/scrolling-div-on-iphone-ipod-touch/5
		 *
		 * Copyright (c) 2009 Matteo Spinelli, http://cubiq.org/
		 * Released under MIT license
		 * http://cubiq.org/dropbox/mit-license.txt
		 * 
		 * Version 2.3 - Last updated: 2009.07.09
		 * Changes - 10/22/09 - cleaned up a little by Sam Shull
		 * 
		 */
		
		function iScroll(el, options)
		{
			var that = this;
			
			this.numberOfTouches = 1;
			this.preventdefault = true;
			this.element = el;
			this.position(options.startposition || 0);
			this.refresh();
			el.style.webkitTransitionTimingFunction = 'cubic-bezier(0, 0, 0.2, 1)';
			this.acceleration = 0.009;
		
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
		
		iScroll.prototype = {
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
					this.maxScroll = 0;
				else		
					this.maxScroll = this.element.parentNode.clientHeight - this.element.offsetHeight;
			},
			
			onTouchStart: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
				
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				
				this.refresh();
				
				var theTransform = window.getComputedStyle(this.element).webkitTransform;
				theTransform = new WebKitCSSMatrix(theTransform).m42;
				if( theTransform!=this.position() )
					this.position(theTransform);
				
				this.startY = e.targetTouches[0].clientY;
				this.scrollStartY = this.position();
				this.scrollStartTime = e.timeStamp;
				this.moved = false;
				
				//moved
				this.element.addEventListener('touchmove', this, false);
				this.element.addEventListener('touchend', this, false);
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTouchMove: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
				
				
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				var topDelta = e.targetTouches[0].clientY - this.startY;
				if( this.position() > 0 || this.position() < this.maxScroll ) topDelta/=2;
				this.position(this.position() + topDelta);
				this.startY = e.targetTouches[0].clientY;
				this.moved = true;
		
				// Prevent slingshot effect
				if( e.timeStamp-this.scrollStartTime>100 ) {
					this.scrollStartY = this.position();
					this.scrollStartTime = e.timeStamp;
				}
		
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTouchEnd: function(e) {
				//moved
				this.element.removeEventListener('touchmove', this, false);
				this.element.removeEventListener('touchend', this, false);
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				var newPosition,theTarget,theEvent,scrollDistance,scrollDuration,newDuration,newScrollDistance;
		
				// If we are outside of the boundaries, let's go back to the sheepfold
				if( this.position() > 0 || this.position() < this.maxScroll ) {
					this.scrollTo(this.position() > 0 ? 0 : this.maxScroll);
					return;
				}
		
				if( !this.moved ) {
					theTarget  = e.target;
					if(theTarget.nodeType == 3) theTarget = theTarget.parentNode;
					theEvent = document.createEvent("MouseEvents");
					theEvent.initEvent('click', true, true);
					theTarget.dispatchEvent(theEvent);
					if (this.preventdefault)
					{
						return false;
					}
				}
		

				// Lame formula to calculate a fake deceleration
				scrollDistance = this.position() - this.scrollStartY;
				scrollDuration = e.timeStamp - this.scrollStartTime;
				
				newDuration = (2 * scrollDistance / scrollDuration) / this.acceleration;
				newScrollDistance = (this.acceleration / 2) * (newDuration * newDuration);
				
				if( newDuration<0 ) {
					newDuration = -newDuration;
					newScrollDistance = -newScrollDistance;
				}
		
				newPosition = this.position() + newScrollDistance;
				
				if( newPosition>this.element.parentNode.clientHeight/2 )
					newPosition = this.element.parentNode.clientHeight/2;
				else if( newPosition>0 )
					newPosition/= 1.5;
				else if( newPosition<this.maxScroll-this.element.parentNode.clientHeight/2 )
					newPosition = this.maxScroll-this.element.parentNode.clientHeight/2;
				else if( newPosition<this.maxScroll )
					newPosition = (newPosition - this.maxScroll) / 1.5 + this.maxScroll;
				else
					newDuration*= 6;
		
				this.scrollTo(newPosition, Math.round(newDuration) + 'ms');
				
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTransitionEnd: function() {
				this.element.removeEventListener('webkitTransitionEnd', this, false);
				
				this.scrollTo( this.position() > 0 ? 0 : this.maxScroll );
			},
			
			scrollTo: function(dest, runtime) {
				this.element.style.webkitTransitionDuration = runtime ? runtime : '300ms';
				this.position(dest ? dest : 0);
				
				// If we are outside of the boundaries at the end of the transition go back to the sheepfold
				if( this.position() > 0 || this.position() < this.maxScroll )
					this.element.addEventListener('webkitTransitionEnd', this, false);
			}
		};
		
		/**
		 * 
		 * A horizontal revision of iScroll by Matteo Spinelli, http://cubiq.org/
		 *
		 * Copyright (c) 2009 Sam Shull <http://www.google.com/profiles/brickysam26>
		 * Released under MIT license
		 * 
		 * Version 0.1
		 * 
		 */
		function iScrollHorizontal(el, options)
		{
			var that = this;
			
			this.numberOfTouches = 1;
			this.preventdefault = true;
			this.element = el;
			this.position(options.startposition || 0);
			this.refresh();
			el.style.webkitTransitionTimingFunction = 'cubic-bezier(0, 0, 0.2, 1)';
			this.acceleration = 0.009;
		
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
		
		iScrollHorizontal.prototype = {
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
					this.element.style.webkitTransform = 'translate3d(' + pos + 'px, 0, 0)';
					return;
				}
				
				return this._position;
			},
			
			refresh: function() {
				this.element.style.webkitTransitionDuration = '0';
		
				if( this.element.offsetWidth<this.element.parentNode.clientWidth )
					this.maxScroll = 0;
				else		
					this.maxScroll = this.element.parentNode.clientWidth - this.element.offsetWidth;
			},
			
			onTouchStart: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
					
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				
				this.refresh();
				
				this.startX = e.targetTouches[0].clientX;
				this.scrollStartX = this.position();
				this.scrollStartTime = e.timeStamp;
				this.moved = false;
				
				this.element.addEventListener('touchmove', this, false);
				this.element.addEventListener('touchend', this, false);
				
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTouchMove: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
				
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				var topDelta = e.targetTouches[0].clientX - this.startX;
				if( this.position()>0 || this.position()<this.maxScroll ) topDelta/=2;
				this.position(this.position() + topDelta);
				this.startX = e.targetTouches[0].clientX;
				this.moved = true;
		
				// Prevent slingshot effect
				if( e.timeStamp-this.scrollStartTime>100 ) {
					this.scrollStartX = this.position();
					this.scrollStartTime = e.timeStamp;
				}
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTouchEnd: function(e) {
				this.element.removeEventListener('touchmove', this, false);
				this.element.removeEventListener('touchend', this, false);
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				var newPosition,theTarget,theEvent,scrollDistance,scrollDuration,newDuration,newScrollDistance;
		
				if( !this.moved ) {
					theTarget  = e.target;
					if(theTarget.nodeType == 3) theTarget = theTarget.parentNode;
					theEvent = document.createEvent("MouseEvents");
					theEvent.initEvent('click', true, true);
					theTarget.dispatchEvent(theEvent);
					if (this.preventdefault)
					{
						return false;
					}
				}
		
				// Lame formula to calculate a fake deceleration
				scrollDistance = this.position() - this.scrollStartX;
				scrollDuration = e.timeStamp - this.scrollStartTime;
				
				newDuration = (2 * scrollDistance / scrollDuration) / this.acceleration;
				newScrollDistance = (this.acceleration / 2) * (newDuration * newDuration);
				
				if( newDuration<0 ) {
					newDuration = -newDuration;
					newScrollDistance = -newScrollDistance;
				}
		
				newPosition = this.position() + newScrollDistance;
				
				if( newPosition>this.element.parentNode.clientWidth/2 )
				{
					newPosition = this.element.parentNode.clientWidth/2;
				}
				else if( newPosition<this.maxScroll-this.element.parentNode.clientWidth/2 )
				{
					newPosition = this.maxScroll-this.element.parentNode.clientWidth/2;
				}
				else if( newPosition<this.maxScroll )
				{
					newPosition = (newPosition - this.maxScroll) / 1.5 + this.maxScroll;
				}
				else
				{
					newDuration*= 6;
				}
				
				this.scrollTo(newPosition, Math.round(newDuration) + 'ms');
		
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTransitionEnd: function() {
				this.element.removeEventListener('webkitTransitionEnd', this, false);
				this.scrollTo( this.position()>0 ? 0 : this.maxScroll );
			},
			
			scrollTo: function(dest, runtime) {
				this.element.style.webkitTransitionDuration = runtime ? runtime : '300ms';
				this.position(dest ? dest : 0);
		
				// If we are outside of the boundaries at the end of the transition go back to the sheepfold
				if( this.position()>0 || this.position()<this.maxScroll )
					this.element.addEventListener('webkitTransitionEnd', this, false);
			}
		};
    }
})(jQuery);

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
 *		- <strike>horizontal scroll flickers without a button above it</strike>
 *		- must define a class selector for slideSelector to operate properly within the slide box - depending on version
 *
 *	Changes:
 *		- Updated horizontal scroll to use translate3d instead of translateX
 *		- Added "preventdefault" attribute detection as a means for allowing the event to bubble.
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
				
				horizontal.slideHorizontally({
					acceleration: Number(horizontal.attr("slidespeed")|| 500) || null,
					preventdefault: horizontal.attr("preventdefault") !== "false",
					startposition: Number(horizontal.attr("position")|| 0) || 0
				});
				vertical.slideVertically({
					acceleration: Number(vertical.attr("slidespeed") || 500),
					preventdefault: vertical.attr("preventdefault") !== "false",
					startposition: Number(horizontal.attr("position")|| 0) || 0
				});
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
			
			this.preventdefault = true;
			
			this.element = el;
			this.position(options.startposition || 0);
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
				
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				
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
		
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTouchMove: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
				
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				var topDelta = e.targetTouches[0].clientY - this.startY;
				if( this.position()>0 || this.position()<this.maxSlide ) topDelta/=2;
				this.position(this.position() + topDelta);
				this.startY = e.targetTouches[0].clientY;
				this.moved = true;
		
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTouchEnd: function(e) {
				if (this.preventdefault)
				{
					e.preventDefault();
				}
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
					if (this.preventdefault)
					{
						return false;
					}
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
				
				if (this.preventdefault)
				{
					return false;
				}
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
			
			this.preventdefault = true;
			
			this.element = el;
			this.position(options.startposition || 0);
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
					this.element.style.webkitTransform = 'translate3d(' + pos + 'px, 0, 0)';
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
					return;
					
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				this.refresh();
				
				this.slideStartX = this.startX = e.targetTouches[0].clientX;
				this.slideStartTime = e.timeStamp;
				this.moved = false;
				
				this.element.addEventListener('touchmove', this, false);
				this.element.addEventListener('touchend', this, false);
		
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTouchMove: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
					
				if (this.preventdefault)
				{
					e.preventDefault();
				}
				var topDelta = e.targetTouches[0].clientX - this.startX;
				this.position(this.position() + topDelta);
				this.startX = e.targetTouches[0].clientX;
				this.moved = true;
		
				if (this.preventdefault)
				{
					return false;
				}
			},
			
			onTouchEnd: function(e) {
				if (this.preventdefault)
				{
					e.preventDefault();
				}
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
					if (this.preventdefault)
					{
						return false;
					}
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
		
				if (this.preventdefault)
				{
					return false;
				}
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
