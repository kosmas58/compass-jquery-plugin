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
