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
    $Date: 2010-04-24 23:00:00 +0200 (Sa, 24. Apr 2010) $
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
 *			<a href="#home" class="grayButton swap">Gotta have something here or you get a flicker</a>
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
 *
 * Known issues:
 *		- slideSelector must be explicitly set to a class like .slideRight in order for the slide selector to work
 *		- horizontal scroll flickers without a button above it
 *		- must define a class selector for slideSelector to operate properly within the scroll box
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
				
				horizontal.scrollHorizontally({acceleration: Number(horizontal.attr("scrollspeed")|| 0.009)});
				vertical.scrollVertically({acceleration: Number(vertical.attr("scrollspeed") || 0.009)});
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
			
			this.element = el;
			this.position(0);
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
				
				e.preventDefault();
				
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
				//return false;
			},
			
			onTouchMove: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
				
				e.preventDefault();
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
		
				//return false;
			},
			
			onTouchEnd: function(e) {
				//moved
				this.element.removeEventListener('touchmove', this, false);
				this.element.removeEventListener('touchend', this, false);
				e.preventDefault();
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
					return false
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
		
				//return false;
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
			
			this.element = el;
			this.position(0);
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
					this.element.style.webkitTransform = 'translateX(' + pos + 'px)';
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
					
				e.preventDefault();
				
				this.refresh();
				
				this.startX = e.targetTouches[0].clientX;
				this.scrollStartX = this.position();
				this.scrollStartTime = e.timeStamp;
				this.moved = false;
				
				this.element.addEventListener('touchmove', this, false);
				this.element.addEventListener('touchend', this, false);
			},
			
			onTouchMove: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
				
				e.preventDefault();
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
			},
			
			onTouchEnd: function(e) {
				this.element.removeEventListener('touchmove', this, false);
				this.element.removeEventListener('touchend', this, false);
				e.preventDefault();
				var newPosition,theTarget,theEvent,scrollDistance,scrollDuration,newDuration,newScrollDistance;
		
				if( !this.moved ) {
					theTarget  = e.target;
					if(theTarget.nodeType == 3) theTarget = theTarget.parentNode;
					theEvent = document.createEvent("MouseEvents");
					theEvent.initEvent('click', true, true);
					theTarget.dispatchEvent(theEvent);
					return false
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
		
				//return false;
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
 *			<a href="#home" class="grayButton swap">Gotta have something here or you get a flicker</a>
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
 *		- horizontal scroll flickers without a button above it
 *		- must define a class selector for slideSelector to operate properly within the slide box
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
				
				horizontal.slideHorizontally({acceleration: Number(horizontal.attr("slidespeed")|| 500) || null});
				vertical.slideVertically({acceleration: Number(vertical.attr("slidespeed") || 500)});
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
			
			this.element = el;
			this.position(0);
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
				
				e.preventDefault();
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
		
				return false;
			},
			
			onTouchMove: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return;
				
				e.preventDefault();
				var topDelta = e.targetTouches[0].clientY - this.startY;
				if( this.position()>0 || this.position()<this.maxSlide ) topDelta/=2;
				this.position(this.position() + topDelta);
				this.startY = e.targetTouches[0].clientY;
				this.moved = true;
		
				return false;
			},
			
			onTouchEnd: function(e) {
				e.preventDefault();
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
					return false
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
				
					return;
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
			
			this.element = el;
			this.position(0);
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
					this.element.style.webkitTransform = 'translateX(' + pos + 'px)';
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
					return false;
					
				e.preventDefault();
				this.refresh();
				
				this.slideStartX = this.startX = e.targetTouches[0].clientX;
				this.slideStartTime = e.timeStamp;
				this.moved = false;
				
				this.element.addEventListener('touchmove', this, false);
				this.element.addEventListener('touchend', this, false);
		
				return false;
			},
			
			onTouchMove: function(e) {
				if( e.targetTouches.length != this.numberOfTouches )
					return false;
					
				e.preventDefault();
				var topDelta = e.targetTouches[0].clientX - this.startX;
				this.position(this.position() + topDelta);
				this.startX = e.targetTouches[0].clientX;
				this.moved = true;
		
				return false;
			},
			
			onTouchEnd: function(e) {
				e.preventDefault();
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
					return false
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
		
				return false;
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