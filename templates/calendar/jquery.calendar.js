/*!
 * FullCalendar v1.4.5
 * http://arshaw.com/fullcalendar/
 *
 * Use fullcalendar.css for basic styling.
 * For event drag & drop, required jQuery UI draggable.
 * For event resizing, requires jQuery UI resizable.
 *
 * Copyright (c) 2009 Adam Shaw
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Date: Sun Feb 21 20:30:11 2010 -0800
 *
 */
 
(function($) {


var fc = $.fullCalendar = {};
var views = fc.views = {};


/* Defaults
-----------------------------------------------------------------------------*/

var defaults = {

	// display
	defaultView: 'month',
	aspectRatio: 1.35,
	header: {
		left: 'title',
		center: '',
		right: 'today prev,next'
	},
	weekends: true,
	
	// editing
	//editable: false,
	//disableDragging: false,
	//disableResizing: false,
	
	allDayDefault: true,
	
	// event ajax
	lazyFetching: true,
	startParam: 'start',
	endParam: 'end',
	
	// time formats
	titleFormat: {
		month: 'MMMM yyyy',
		week: "MMM d[ yyyy]{ '&#8212;'[ MMM] d yyyy}",
		day: 'dddd, MMM d, yyyy'
	},
	columnFormat: {
		month: 'ddd',
		week: 'ddd M/d',
		day: 'dddd M/d'
	},
	timeFormat: { // for event elements
		'': 'h(:mm)t' // default
	},
	
	// locale
	isRTL: false,
	firstDay: 0,
	monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
	monthNamesShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
	dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
	dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
	buttonText: {
		prev: '&nbsp;&#9668;&nbsp;',
		next: '&nbsp;&#9658;&nbsp;',
		prevYear: '&nbsp;&lt;&lt;&nbsp;',
		nextYear: '&nbsp;&gt;&gt;&nbsp;',
		today: 'today',
		month: 'month',
		week: 'week',
		day: 'day'
	},
	
	// jquery-ui theming
	theme: false,
	buttonIcons: {
		prev: 'circle-triangle-w',
		next: 'circle-triangle-e'
	}
	
};

// right-to-left defaults
var rtlDefaults = {
	header: {
		left: 'next,prev today',
		center: '',
		right: 'title'
	},
	buttonText: {
		prev: '&nbsp;&#9658;&nbsp;',
		next: '&nbsp;&#9668;&nbsp;',
		prevYear: '&nbsp;&gt;&gt;&nbsp;',
		nextYear: '&nbsp;&lt;&lt;&nbsp;'
	},
	buttonIcons: {
		prev: 'circle-triangle-e',
		next: 'circle-triangle-w'
	}
};

// function for adding/overriding defaults
var setDefaults = fc.setDefaults = function(d) {
	$.extend(true, defaults, d);
}



/* .fullCalendar jQuery function
-----------------------------------------------------------------------------*/

$.fn.fullCalendar = function(options) {

	// method calling
	if (typeof options == 'string') {
		var args = Array.prototype.slice.call(arguments, 1),
			res;
		this.each(function() {
			var data = $.data(this, 'fullCalendar');
			if (data) {
				var r = data[options].apply(this, args);
				if (res == undefined) {
					res = r;
				}
			}
		});
		if (res != undefined) {
			return res;
		}
		return this;
	}

	// pluck the 'events' and 'eventSources' options
	var eventSources = options.eventSources || [];
	delete options.eventSources;
	if (options.events) {
		eventSources.push(options.events);
		delete options.events;
	}
	
	// first event source reserved for 'sticky' events
	eventSources.unshift([]);
	
	// initialize options
	options = $.extend(true, {},
		defaults,
		(options.isRTL || options.isRTL==undefined && defaults.isRTL) ? rtlDefaults : {},
		options
	);
	var tm = options.theme ? 'ui' : 'fc'; // for making theme classes
	
	
	this.each(function() {
	
	
		/* Instance Initialization
		-----------------------------------------------------------------------------*/
		
		// element
		var _element = this,
			element = $(_element).addClass('fc'),
			elementOuterWidth,
			content = $("<div class='fc-content " + tm + "-widget-content' style='position:relative'/>").prependTo(_element),
			suggestedViewHeight,
			resizeUID = 0,
			ignoreWindowResize = 0,
			date = new Date(),
			viewName,  // the current view name (TODO: look into getting rid of)
			view,      // the current view
			viewInstances = {},
			absoluteViewElement;
			
			
			
		if (options.isRTL) {
			element.addClass('fc-rtl');
		}
		if (options.theme) {
			element.addClass('ui-widget');
		}
			
		if (options.year != undefined && options.year != date.getFullYear()) {
			date.setDate(1);
			date.setMonth(0);
			date.setFullYear(options.year);
		}
		if (options.month != undefined && options.month != date.getMonth()) {
			date.setDate(1);
			date.setMonth(options.month);
		}
		if (options.date != undefined) {
			date.setDate(options.date);
		}
		
		
		
		/* View Rendering
		-----------------------------------------------------------------------------*/
		
		function changeView(v) {
			if (v != viewName) {
				ignoreWindowResize++; // because setMinHeight might change the height before render (and subsequently setSize) is reached
				
				var oldView = view,
					newViewElement;
					
				if (oldView) {
					if (oldView.eventsChanged) {
						eventsDirty();
						oldView.eventDirty = oldView.eventsChanged = false;
					}
					if (oldView.beforeHide) {
						oldView.beforeHide(); // called before changing min-height. if called after, scroll state is reset (in Opera)
					}
					setMinHeight(content, content.height());
					oldView.element.hide();
				}else{
					setMinHeight(content, 1); // needs to be 1 (not 0) for IE7, or else view dimensions miscalculated
				}
				content.css('overflow', 'hidden');
				
				if (viewInstances[v]) {
					(view = viewInstances[v]).element.show();
				}else{
					view = viewInstances[v] = $.fullCalendar.views[v](
						newViewElement = absoluteViewElement =
							$("<div class='fc-view fc-view-" + v + "' style='position:absolute'/>")
								.appendTo(content),
						options
					);
				}
				
				if (header) {
					// update 'active' view button
					header.find('div.fc-button-' + viewName).removeClass(tm + '-state-active');
					header.find('div.fc-button-' + v).addClass(tm + '-state-active');
				}
				
				view.name = viewName = v;
				render(); // after height has been set, will make absoluteViewElement's position=relative, then set to null
				content.css('overflow', '');
				if (oldView) {
					setMinHeight(content, 1);
				}
				if (!newViewElement && view.afterShow) {
					view.afterShow(); // called after setting min-height/overflow, so in final scroll state (for Opera)
				}
				
				ignoreWindowResize--;
			}
		}
		
		
		function render(inc) {
			if (elementVisible()) {
				ignoreWindowResize++; // because view.renderEvents might temporarily change the height before setSize is reached
				
				if (suggestedViewHeight == undefined) {
					calcSize();
				}
				
				if (!view.start || inc || date < view.start || date >= view.end) {
					view.render(date, inc || 0); // responsible for clearing events
					setSize(true);
					if (!eventStart || !options.lazyFetching || view.visStart < eventStart || view.visEnd > eventEnd) {
						fetchAndRenderEvents();
					}else{
						view.renderEvents(events); // don't refetch
					}
				}
				else if (view.sizeDirty || view.eventsDirty || !options.lazyFetching) {
					view.clearEvents();
					if (view.sizeDirty) {
						setSize();
					}
					if (options.lazyFetching) {
						view.renderEvents(events); // don't refetch
					}else{
						fetchAndRenderEvents();
					}
				}
				elementOuterWidth = element.outerWidth();
				view.sizeDirty = false;
				view.eventsDirty = false;
				
				if (header) {
					// update title text
					header.find('h2.fc-header-title').html(view.title);
					// enable/disable 'today' button
					var today = new Date();
					if (today >= view.start && today < view.end) {
						header.find('div.fc-button-today').addClass(tm + '-state-disabled');
					}else{
						header.find('div.fc-button-today').removeClass(tm + '-state-disabled');
					}
				}
				
				ignoreWindowResize--;
				view.trigger('viewDisplay', _element);
			}
		}
		
		
		function elementVisible() {
			return _element.offsetWidth !== 0;
		}
		
		function bodyVisible() {
			return $('body')[0].offsetWidth !== 0;
		}
		
		
		// called when any event objects have been added/removed/changed, rerenders
		function eventsChanged() {
			eventsDirty();
			if (elementVisible()) {
				view.clearEvents();
				view.renderEvents(events);
				view.eventsDirty = false;
			}
		}
		
		// marks other views' events as dirty
		function eventsDirty() {
			$.each(viewInstances, function() {
				this.eventsDirty = true;
			});
		}
		
		// called when we know the element size has changed
		function sizeChanged() {
			sizesDirty();
			if (elementVisible()) {
				calcSize();
				setSize();
				view.rerenderEvents();
				view.sizeDirty = false;
			}
		}
		
		// marks other views' sizes as dirty
		function sizesDirty() {
			$.each(viewInstances, function() {
				this.sizeDirty = true;
			});
		}
		
		
		
		
		/* Event Sources and Fetching
		-----------------------------------------------------------------------------*/
		
		var events = [],
			eventStart, eventEnd;
		
		// Fetch from ALL sources. Clear 'events' array and populate
		function fetchEvents(callback) {
			events = [];
			eventStart = cloneDate(view.visStart);
			eventEnd = cloneDate(view.visEnd);
			var queued = eventSources.length,
				sourceDone = function() {
					if (--queued == 0) {
						if (callback) {
							callback(events);
						}
					}
				}, i=0;
			for (; i<eventSources.length; i++) {
				fetchEventSource(eventSources[i], sourceDone);
			}
		}
		
		// Fetch from a particular source. Append to the 'events' array
		function fetchEventSource(src, callback) {
			var prevViewName = view.name,
				prevDate = cloneDate(date),
				reportEvents = function(a) {
					if (prevViewName == view.name && +prevDate == +date && // protects from fast switching
						$.inArray(src, eventSources) != -1) {              // makes sure source hasn't been removed
							for (var i=0; i<a.length; i++) {
								normalizeEvent(a[i], options);
								a[i].source = src;
							}
							events = events.concat(a);
							if (callback) {
								callback(a);
							}
						}
				},
				reportEventsAndPop = function(a) {
					reportEvents(a);
					popLoading();
				};
			if (typeof src == 'string') {
				var params = {};
				params[options.startParam] = Math.round(eventStart.getTime() / 1000);
				params[options.endParam] = Math.round(eventEnd.getTime() / 1000);
				if (options.cacheParam) {
					params[options.cacheParam] = (new Date()).getTime(); // TODO: deprecate cacheParam
				}
				pushLoading();
				$.ajax({
					url: src,
					dataType: 'json',
					data: params,
					cache: options.cacheParam || false, // don't let jquery prevent caching if cacheParam is being used
					success: reportEventsAndPop
				});
			}
			else if ($.isFunction(src)) {
				pushLoading();
				src(cloneDate(eventStart), cloneDate(eventEnd), reportEventsAndPop);
			}
			else {
				reportEvents(src); // src is an array
			}
		}
		
		
		// for convenience
		function fetchAndRenderEvents() {
			fetchEvents(function(events) {
				view.renderEvents(events); // maintain `this` in view
			});
		}
		
		
		
		/* Loading State
		-----------------------------------------------------------------------------*/
		
		var loadingLevel = 0;
		
		function pushLoading() {
			if (!loadingLevel++) {
				view.trigger('loading', _element, true);
			}
		}
		
		function popLoading() {
			if (!--loadingLevel) {
				view.trigger('loading', _element, false);
			}
		}
		
		
		
		/* Public Methods
		-----------------------------------------------------------------------------*/
		
		var publicMethods = {
		
			render: function() {
				calcSize();
				sizesDirty();
				eventsDirty();
				render();
			},
			
			changeView: changeView,
			
			getView: function() {
				return view;
			},
			
			getDate: function() {
				return date;
			},
			
			option: function(name, value) {
				if (value == undefined) {
					return options[name];
				}
				if (name == 'height' || name == 'contentHeight' || name == 'aspectRatio') {
					options[name] = value;
					sizeChanged();
				}
			},
			
			destroy: function() {
				$(window).unbind('resize', windowResize);
				if (header) {
					header.remove();
				}
				content.remove();
				$.removeData(_element, 'fullCalendar');
			},
			
			//
			// Navigation
			//
			
			prev: function() {
				render(-1);
			},
			
			next: function() {
				render(1);
			},
			
			prevYear: function() {
				addYears(date, -1);
				render();
			},
			
			nextYear: function() {
				addYears(date, 1);
				render();
			},
			
			today: function() {
				date = new Date();
				render();
			},
			
			gotoDate: function(year, month, dateNum) {
				if (typeof year == 'object') {
					date = cloneDate(year); // provided 1 argument, a Date
				}else{
					if (year != undefined) {
						date.setFullYear(year);
					}
					if (month != undefined) {
						date.setMonth(month);
					}
					if (dateNum != undefined) {
						date.setDate(dateNum);
					}
				}
				render();
			},
			
			incrementDate: function(years, months, days) {
				if (years != undefined) {
					addYears(date, years);
				}
				if (months != undefined) {
					addMonths(date, months);
				}
				if (days != undefined) {
					addDays(date, days);
				}
				render();
			},
			
			//
			// Event Manipulation
			//
			
			updateEvent: function(event) { // update an existing event
				var i, len = events.length, e,
					startDelta = event.start - event._start,
					endDelta = event.end ?
						(event.end - (event._end || view.defaultEventEnd(event))) // event._end would be null if event.end
						: 0;                                                      // was null and event was just resized
				for (i=0; i<len; i++) {
					e = events[i];
					if (e._id == event._id && e != event) {
						e.start = new Date(+e.start + startDelta);
						if (event.end) {
							if (e.end) {
								e.end = new Date(+e.end + endDelta);
							}else{
								e.end = new Date(+view.defaultEventEnd(e) + endDelta);
							}
						}else{
							e.end = null;
						}
						e.title = event.title;
						e.url = event.url;
						e.allDay = event.allDay;
						e.className = event.className;
						e.editable = event.editable;
						normalizeEvent(e, options);
					}
				}
				normalizeEvent(event, options);
				eventsChanged();
			},
			
			renderEvent: function(event, stick) { // render a new event
				normalizeEvent(event, options);
				if (!event.source) {
					if (stick) {
						(event.source = eventSources[0]).push(event);
					}
					events.push(event);
				}
				eventsChanged();
			},
			
			removeEvents: function(filter) {
				if (!filter) { // remove all
					events = [];
					// clear all array sources
					for (var i=0; i<eventSources.length; i++) {
						if (typeof eventSources[i] == 'object') {
							eventSources[i] = [];
						}
					}
				}else{
					if (!$.isFunction(filter)) { // an event ID
						var id = filter + '';
						filter = function(e) {
							return e._id == id;
						};
					}
					events = $.grep(events, filter, true);
					// remove events from array sources
					for (var i=0; i<eventSources.length; i++) {
						if (typeof eventSources[i] == 'object') {
							eventSources[i] = $.grep(eventSources[i], filter, true);
						}
					}
				}
				eventsChanged();
			},
			
			clientEvents: function(filter) {
				if ($.isFunction(filter)) {
					return $.grep(events, filter);
				}
				else if (filter) { // an event ID
					filter += '';
					return $.grep(events, function(e) {
						return e._id == filter;
					});
				}
				return events; // else, return all
			},
			
			rerenderEvents: eventsChanged, // TODO: think of renaming eventsChanged
			
			//
			// Event Source
			//
		
			addEventSource: function(source) {
				eventSources.push(source);
				fetchEventSource(source, eventsChanged);
			},
		
			removeEventSource: function(source) {
				eventSources = $.grep(eventSources, function(src) {
					return src != source;
				});
				// remove all client events from that source
				events = $.grep(events, function(e) {
					return e.source != source;
				});
				eventsChanged();
			},
			
			refetchEvents: function() {
				fetchEvents(eventsChanged);
			}
			
		};
		
		$.data(this, 'fullCalendar', publicMethods);
		
		
		
		/* Header
		-----------------------------------------------------------------------------*/
		
		var header,
			sections = options.header;
		if (sections) {
			header = $("<table class='fc-header'/>")
				.append($("<tr/>")
					.append($("<td class='fc-header-left'/>").append(buildSection(sections.left)))
					.append($("<td class='fc-header-center'/>").append(buildSection(sections.center)))
					.append($("<td class='fc-header-right'/>").append(buildSection(sections.right))))
				.prependTo(element);
		}
		function buildSection(buttonStr) {
			if (buttonStr) {
				var tr = $("<tr/>");
				$.each(buttonStr.split(' '), function(i) {
					if (i > 0) {
						tr.append("<td><span class='fc-header-space'/></td>");
					}
					var prevButton;
					$.each(this.split(','), function(j, buttonName) {
						if (buttonName == 'title') {
							tr.append("<td><h2 class='fc-header-title'>&nbsp;</h2></td>");
							if (prevButton) {
								prevButton.addClass(tm + '-corner-right');
							}
							prevButton = null;
						}else{
							var buttonClick;
							if (publicMethods[buttonName]) {
								buttonClick = publicMethods[buttonName];
							}
							else if (views[buttonName]) {
								buttonClick = function() {
									button.removeClass(tm + '-state-hover');
									changeView(buttonName)
								};
							}
							if (buttonClick) {
								if (prevButton) {
									prevButton.addClass(tm + '-no-right');
								}
								var button,
									icon = options.theme ? smartProperty(options.buttonIcons, buttonName) : null,
									text = smartProperty(options.buttonText, buttonName);
								if (icon) {
									button = $("<div class='fc-button-" + buttonName + " ui-state-default'>" +
										"<a><span class='ui-icon ui-icon-" + icon + "'/></a></div>");
								}
								else if (text) {
									button = $("<div class='fc-button-" + buttonName + " " + tm + "-state-default'>" +
										"<a><span>" + text + "</span></a></div>");
								}
								if (button) {
									button
										.click(function() {
											if (!button.hasClass(tm + '-state-disabled')) {
												buttonClick();
											}
										})
										.mousedown(function() {
											button
												.not('.' + tm + '-state-active')
												.not('.' + tm + '-state-disabled')
												.addClass(tm + '-state-down');
										})
										.mouseup(function() {
											button.removeClass(tm + '-state-down');
										})
										.hover(
											function() {
												button
													.not('.' + tm + '-state-active')
													.not('.' + tm + '-state-disabled')
													.addClass(tm + '-state-hover');
											},
											function() {
												button
													.removeClass(tm + '-state-hover')
													.removeClass(tm + '-state-down');
											}
										)
										.appendTo($("<td/>").appendTo(tr));
									if (prevButton) {
										prevButton.addClass(tm + '-no-right');
									}else{
										button.addClass(tm + '-corner-left');
									}
									prevButton = button;
								}
							}
						}
					});
					if (prevButton) {
						prevButton.addClass(tm + '-corner-right');
					}
				});
				return $("<table/>").append(tr);
			}
		}
		
		
		
		/* Resizing
		-----------------------------------------------------------------------------*/
		
		
		function calcSize() {
			if (options.contentHeight) {
				suggestedViewHeight = options.contentHeight;
			}
			else if (options.height) {
				suggestedViewHeight = options.height - (header ? header.height() : 0) - vsides(content[0]);
			}
			else {
				suggestedViewHeight = Math.round(content.width() / Math.max(options.aspectRatio, .5));
			}
		}
		
		
		function setSize(dateChanged) {
			ignoreWindowResize++;
			view.setHeight(suggestedViewHeight, dateChanged);
			if (absoluteViewElement) {
				absoluteViewElement.css('position', 'relative');
				absoluteViewElement = null;
			}
			view.setWidth(content.width(), dateChanged);
			ignoreWindowResize--;
		}
		
		
		function windowResize() {
			if (!ignoreWindowResize) {
				if (view.start) { // view has already been rendered
					var uid = ++resizeUID;
					setTimeout(function() { // add a delay
						if (uid == resizeUID && !ignoreWindowResize && elementVisible()) {
							if (elementOuterWidth != (elementOuterWidth = element.outerWidth())) {
								ignoreWindowResize++; // in case the windowResize callback changes the height
								sizeChanged();
								view.trigger('windowResize', _element);
								ignoreWindowResize--;
							}
						}
					}, 200);
				}else{
					// calendar must have been initialized in a 0x0 iframe that has just been resized
					lateRender();
				}
			}
		};
		$(window).resize(windowResize);
		
		
		// let's begin...
		changeView(options.defaultView);
		
		
		// needed for IE in a 0x0 iframe, b/c when it is resized, never triggers a windowResize
		if (!bodyVisible()) {
			lateRender();
		}
		
		
		// called when we know the calendar couldn't be rendered when it was initialized,
		// but we think it's ready now
		function lateRender() {
			setTimeout(function() { // IE7 needs this so dimensions are calculated correctly
				if (!view.start && bodyVisible()) { // !view.start makes sure this never happens more than once
					render();
				}
			},0);
		}

	
	});
	
	return this;
	
};



/* Important Event Utilities
-----------------------------------------------------------------------------*/

var fakeID = 0;

function normalizeEvent(event, options) {
	event._id = event._id || (event.id == undefined ? '_fc' + fakeID++ : event.id + '');
	if (event.date) {
		if (!event.start) {
			event.start = event.date;
		}
		delete event.date;
	}
	event._start = cloneDate(event.start = parseDate(event.start));
	event.end = parseDate(event.end);
	if (event.end && event.end <= event.start) {
		event.end = null;
	}
	event._end = event.end ? cloneDate(event.end) : null;
	if (event.allDay == undefined) {
		event.allDay = options.allDayDefault;
	}
	if (event.className) {
		if (typeof event.className == 'string') {
			event.className = event.className.split(/\s+/);
		}
	}else{
		event.className = [];
	}
}
// TODO: if there is no title or start date, return false to indicate an invalid event


/* Grid-based Views: month, basicWeek, basicDay
-----------------------------------------------------------------------------*/

setDefaults({
	weekMode: 'fixed'
});

views.month = function(element, options) {
	return new Grid(element, options, {
		render: function(date, delta) {
			if (delta) {
				addMonths(date, delta);
				date.setDate(1);
			}
			// start/end
			var start = this.start = cloneDate(date, true);
			start.setDate(1);
			this.end = addMonths(cloneDate(start), 1);
			// visStart/visEnd
			var visStart = this.visStart = cloneDate(start),
				visEnd = this.visEnd = cloneDate(this.end),
				nwe = options.weekends ? 0 : 1;
			if (nwe) {
				skipWeekend(visStart);
				skipWeekend(visEnd, -1, true);
			}
			addDays(visStart, -((visStart.getDay() - Math.max(options.firstDay, nwe) + 7) % 7));
			addDays(visEnd, (7 - visEnd.getDay() + Math.max(options.firstDay, nwe)) % 7);
			// row count
			var rowCnt = Math.round((visEnd - visStart) / (DAY_MS * 7));
			if (options.weekMode == 'fixed') {
				addDays(visEnd, (6 - rowCnt) * 7);
				rowCnt = 6;
			}
			// title
			this.title = formatDate(
				start,
				this.option('titleFormat'),
				options
			);
			// render
			this.renderGrid(
				rowCnt, options.weekends ? 7 : 5,
				this.option('columnFormat'),
				true
			);
		}
	});
}

views.basicWeek = function(element, options) {
	return new Grid(element, options, {
		render: function(date, delta) {
			if (delta) {
				addDays(date, delta * 7);
			}
			var visStart = this.visStart = cloneDate(
					this.start = addDays(cloneDate(date), -((date.getDay() - options.firstDay + 7) % 7))
				),
				visEnd = this.visEnd = cloneDate(
					this.end = addDays(cloneDate(visStart), 7)
				);
			if (!options.weekends) {
				skipWeekend(visStart);
				skipWeekend(visEnd, -1, true);
			}
			this.title = formatDates(
				visStart,
				addDays(cloneDate(visEnd), -1),
				this.option('titleFormat'),
				options
			);
			this.renderGrid(
				1, options.weekends ? 7 : 5,
				this.option('columnFormat'),
				false
			);
		}
	});
};

views.basicDay = function(element, options) {
	return new Grid(element, options, {
		render: function(date, delta) {
			if (delta) {
				addDays(date, delta);
				if (!options.weekends) {
					skipWeekend(date, delta < 0 ? -1 : 1);
				}
			}
			this.title = formatDate(date, this.option('titleFormat'), options);
			this.start = this.visStart = cloneDate(date, true);
			this.end = this.visEnd = addDays(cloneDate(this.start), 1);
			this.renderGrid(
				1, 1,
				this.option('columnFormat'),
				false
			);
		}
	});
}


// rendering bugs

var tdHeightBug;


function Grid(element, options, methods) {
	
	var tm, firstDay,
		nwe,            // no weekends (int)
		rtl, dis, dit,  // day index sign / translate
		viewWidth, viewHeight,
		rowCnt, colCnt,
		colWidth,
		thead, tbody,
		cachedEvents=[],
		segmentContainer,
		dayContentPositions = new HorizontalPositionCache(function(dayOfWeek) {
			return tbody.find('td:eq(' + ((dayOfWeek - Math.max(firstDay,nwe)+colCnt) % colCnt) + ') div div')
		}),
		// ...
		
	// initialize superclass
	view = $.extend(this, viewMethods, methods, {
		renderGrid: renderGrid,
		renderEvents: renderEvents,
		rerenderEvents: rerenderEvents,
		clearEvents: clearEvents,
		setHeight: setHeight,
		setWidth: setWidth,
		defaultEventEnd: function(event) { // calculates an end if event doesnt have one, mostly for resizing
			return cloneDate(event.start);
		}
	});
	view.init(element, options);
	
	
	
	/* Grid Rendering
	-----------------------------------------------------------------------------*/
	
	
	element.addClass('fc-grid');
	if (element.disableSelection) {
		element.disableSelection();
	}

	function renderGrid(r, c, colFormat, showNumbers) {
		rowCnt = r;
		colCnt = c;
		
		// update option-derived variables
		tm = options.theme ? 'ui' : 'fc';
		nwe = options.weekends ? 0 : 1;
		firstDay = options.firstDay;
		if (rtl = options.isRTL) {
			dis = -1;
			dit = colCnt - 1;
		}else{
			dis = 1;
			dit = 0;
		}
		
		var month = view.start.getMonth(),
			today = clearTime(new Date()),
			s, i, j, d = cloneDate(view.visStart);
		
		if (!tbody) { // first time, build all cells from scratch
		
			var table = $("<table/>").appendTo(element);
			
			s = "<thead><tr>";
			for (i=0; i<colCnt; i++) {
				s += "<th class='fc-" +
					dayIDs[d.getDay()] + ' ' + // needs to be first
					tm + '-state-default' +
					(i==dit ? ' fc-leftmost' : '') +
					"'>" + formatDate(d, colFormat, options) + "</th>";
				addDays(d, 1);
				if (nwe) {
					skipWeekend(d);
				}
			}
			thead = $(s + "</tr></thead>").appendTo(table);
			
			s = "<tbody>";
			d = cloneDate(view.visStart);
			for (i=0; i<rowCnt; i++) {
				s += "<tr class='fc-week" + i + "'>";
				for (j=0; j<colCnt; j++) {
					s += "<td class='fc-" +
						dayIDs[d.getDay()] + ' ' + // needs to be first
						tm + '-state-default fc-day' + (i*colCnt+j) +
						(j==dit ? ' fc-leftmost' : '') +
						(rowCnt>1 && d.getMonth() != month ? ' fc-other-month' : '') +
						(+d == +today ?
						' fc-today '+tm+'-state-highlight' :
						' fc-not-today') + "'>" +
						(showNumbers ? "<div class='fc-day-number'>" + d.getDate() + "</div>" : '') +
						"<div class='fc-day-content'><div style='position:relative'>&nbsp;</div></div></td>";
					addDays(d, 1);
					if (nwe) {
						skipWeekend(d);
					}
				}
				s += "</tr>";
			}
			tbody = $(s + "</tbody>").appendTo(table);
			tbody.find('td').click(dayClick);
			
			segmentContainer = $("<div style='position:absolute;z-index:8;top:0;left:0'/>").appendTo(element);
		
		}else{ // NOT first time, reuse as many cells as possible
		
			clearEvents();
		
			var prevRowCnt = tbody.find('tr').length;
			if (rowCnt < prevRowCnt) {
				tbody.find('tr:gt(' + (rowCnt-1) + ')').remove(); // remove extra rows
			}
			else if (rowCnt > prevRowCnt) { // needs to create new rows...
				s = '';
				for (i=prevRowCnt; i<rowCnt; i++) {
					s += "<tr class='fc-week" + i + "'>";
					for (j=0; j<colCnt; j++) {
						s += "<td class='fc-" +
							dayIDs[d.getDay()] + ' ' + // needs to be first
							tm + '-state-default fc-new fc-day' + (i*colCnt+j) +
							(j==dit ? ' fc-leftmost' : '') + "'>" +
							(showNumbers ? "<div class='fc-day-number'></div>" : '') +
							"<div class='fc-day-content'><div style='position:relative'>&nbsp;</div></div>" +
							"</td>";
						addDays(d, 1);
						if (nwe) {
							skipWeekend(d);
						}
					}
					s += "</tr>";
				}
				tbody.append(s);
			}
			tbody.find('td.fc-new').removeClass('fc-new').click(dayClick);
			
			// re-label and re-class existing cells
			d = cloneDate(view.visStart);
			tbody.find('td').each(function() {
				var td = $(this);
				if (rowCnt > 1) {
					if (d.getMonth() == month) {
						td.removeClass('fc-other-month');
					}else{
						td.addClass('fc-other-month');
					}
				}
				if (+d == +today) {
					td.removeClass('fc-not-today')
						.addClass('fc-today')
						.addClass(tm + '-state-highlight');
				}else{
					td.addClass('fc-not-today')
						.removeClass('fc-today')
						.removeClass(tm + '-state-highlight');
				}
				td.find('div.fc-day-number').text(d.getDate());
				addDays(d, 1);
				if (nwe) {
					skipWeekend(d);
				}
			});
			
			if (rowCnt == 1) { // more changes likely (week or day view)
			
				// redo column header text and class
				d = cloneDate(view.visStart);
				thead.find('th').each(function() {
					$(this).text(formatDate(d, colFormat, options));
					this.className = this.className.replace(/^fc-\w+(?= )/, 'fc-' + dayIDs[d.getDay()]);
					addDays(d, 1);
					if (nwe) {
						skipWeekend(d);
					}
				});
				
				// redo cell day-of-weeks
				d = cloneDate(view.visStart);
				tbody.find('td').each(function() {
					this.className = this.className.replace(/^fc-\w+(?= )/, 'fc-' + dayIDs[d.getDay()]);
					addDays(d, 1);
					if (nwe) {
						skipWeekend(d);
					}
				});
				
			}
		
		}
	
	};
	
	
	function dayClick(ev) {
		var n = parseInt(this.className.match(/fc\-day(\d+)/)[1]),
			date = addDays(
				cloneDate(view.visStart),
				Math.floor(n/colCnt) * 7 + n % colCnt
			);
		view.trigger('dayClick', this, date, true, ev);
	}
	
	
	
	function setHeight(height) {
		viewHeight = height;
		var leftTDs = tbody.find('tr td:first-child'),
			tbodyHeight = viewHeight - thead.height(),
			rowHeight1, rowHeight2;
		if (options.weekMode == 'variable') {
			rowHeight1 = rowHeight2 = Math.floor(tbodyHeight / (rowCnt==1 ? 2 : 6));
		}else{
			rowHeight1 = Math.floor(tbodyHeight / rowCnt);
			rowHeight2 = tbodyHeight - rowHeight1*(rowCnt-1);
		}
		if (tdHeightBug == undefined) {
			// bug in firefox where cell height includes padding
			var tr = tbody.find('tr:first'),
				td = tr.find('td:first');
			td.height(rowHeight1);
			tdHeightBug = rowHeight1 != td.height();
		}
		if (tdHeightBug) {
			leftTDs.slice(0, -1).height(rowHeight1);
			leftTDs.slice(-1).height(rowHeight2);
		}else{
			setOuterHeight(leftTDs.slice(0, -1), rowHeight1);
			setOuterHeight(leftTDs.slice(-1), rowHeight2);
		}
	}
	
	
	function setWidth(width) {
		viewWidth = width;
		dayContentPositions.clear();
		setOuterWidth(
			thead.find('th').slice(0, -1),
			colWidth = Math.floor(viewWidth / colCnt)
		);
	}

	
	
	/* Event Rendering
	-----------------------------------------------------------------------------*/
	
	
	function renderEvents(events) {
		view.reportEvents(cachedEvents = events);
		renderSegs(compileSegs(events));
	}
	
	
	function rerenderEvents(modifiedEventId) {
		clearEvents();
		renderSegs(compileSegs(cachedEvents), modifiedEventId);
	}
	
	
	function clearEvents() {
		view._clearEvents(); // only clears the hashes
		segmentContainer.empty();
	}
	
	
	function compileSegs(events) {
		var d1 = cloneDate(view.visStart),
			d2 = addDays(cloneDate(d1), colCnt),
			visEventsEnds = $.map(events, visEventEnd),
			i, row,
			j, level,
			k, seg,
			segs=[];
		for (i=0; i<rowCnt; i++) {
			row = stackSegs(view.sliceSegs(events, visEventsEnds, d1, d2));
			for (j=0; j<row.length; j++) {
				level = row[j];
				for (k=0; k<level.length; k++) {
					seg = level[k];
					seg.row = i;
					seg.level = j;
					segs.push(seg);
				}
			}
			addDays(d1, 7);
			addDays(d2, 7);
		}
		return segs;
	}
	
	
	
	function renderSegs(segs, modifiedEventId) {
		_renderDaySegs(
			segs,
			rowCnt,
			view,
			0,
			viewWidth,
			function(i) { return tbody.find('tr:eq('+i+')') },
			dayContentPositions.left,
			dayContentPositions.right,
			segmentContainer,
			bindSegHandlers,
			modifiedEventId
		);
	}
	
	
	
	function visEventEnd(event) { // returns exclusive 'visible' end, for rendering
		if (event.end) {
			var end = cloneDate(event.end);
			return (event.allDay || end.getHours() || end.getMinutes()) ? addDays(end, 1) : end;
		}else{
			return addDays(cloneDate(event.start), 1);
		}
	}
	
	
	
	function bindSegHandlers(event, eventElement, seg) {
		view.eventElementHandlers(event, eventElement);
		if (event.editable || event.editable == undefined && options.editable) {
			draggableEvent(event, eventElement);
			if (seg.isEnd) {
				view.resizableDayEvent(event, eventElement, colWidth);
			}
		}
	}
	
	
	
	/* Event Dragging
	-----------------------------------------------------------------------------*/
	
	
	function draggableEvent(event, eventElement) {
		if (!options.disableDragging && eventElement.draggable) {
			var matrix;
			eventElement.draggable({
				zIndex: 9,
				delay: 50,
				opacity: view.option('dragOpacity'),
				revertDuration: options.dragRevertDuration,
				start: function(ev, ui) {
					view.hideEvents(event, eventElement);
					view.trigger('eventDragStart', eventElement, event, ev, ui);
					matrix = new HoverMatrix(function(cell) {
						eventElement.draggable('option', 'revert', !cell || !cell.rowDelta && !cell.colDelta);
						if (cell) {
							view.showOverlay(cell);
						}else{
							view.hideOverlay();
						}
					});
					tbody.find('tr').each(function() {
						matrix.row(this);
					});
					var tds = tbody.find('tr:first td');
					if (rtl) {
						tds = $(tds.get().reverse());
					}
					tds.each(function() {
						matrix.col(this);
					});
					matrix.mouse(ev.pageX, ev.pageY);
				},
				drag: function(ev) {
					matrix.mouse(ev.pageX, ev.pageY);
				},
				stop: function(ev, ui) {
					view.hideOverlay();
					view.trigger('eventDragStop', eventElement, event, ev, ui);
					var cell = matrix.cell;
					if (!cell || !cell.rowDelta && !cell.colDelta) {
						if ($.browser.msie) {
							eventElement.css('filter', ''); // clear IE opacity side-effects
						}
						view.showEvents(event, eventElement);
					}else{
						eventElement.find('a').removeAttr('href'); // prevents safari from visiting the link
						view.eventDrop(this, event, cell.rowDelta*7+cell.colDelta*dis, 0, event.allDay, ev, ui);
					}
				}
			});
		}
	}
	
	
	// event resizing w/ 'view' methods...

};


function _renderDaySegs(segs, rowCnt, view, minLeft, maxLeft, getRow, dayContentLeft, dayContentRight, segmentContainer, bindSegHandlers, modifiedEventId) {

	var options=view.options,
		rtl=options.isRTL,
		i, segCnt=segs.length, seg,
		event,
		className,
		left, right,
		html='',
		eventElements,
		eventElement,
		triggerRes,
		hsideCache={},
		vmarginCache={},
		key, val,
		rowI, top, levelI, levelHeight,
		rowDivs=[],
		rowDivTops=[];
		
	// calculate desired position/dimensions, create html
	for (i=0; i<segCnt; i++) {
		seg = segs[i];
		event = seg.event;
		className = 'fc-event fc-event-hori ';
		if (rtl) {
			if (seg.isStart) {
				className += 'fc-corner-right ';
			}
			if (seg.isEnd) {
				className += 'fc-corner-left ';
			}
			left = seg.isEnd ? dayContentLeft(seg.end.getDay()-1) : minLeft;
			right = seg.isStart ? dayContentRight(seg.start.getDay()) : maxLeft;
		}else{
			if (seg.isStart) {
				className += 'fc-corner-left ';
			}
			if (seg.isEnd) {
				className += 'fc-corner-right ';
			}
			left = seg.isStart ? dayContentLeft(seg.start.getDay()) : minLeft;
			right = seg.isEnd ? dayContentRight(seg.end.getDay()-1) : maxLeft;
		}
		html +=
			"<div class='" + className + event.className.join(' ') + "' style='position:absolute;z-index:8;left:"+left+"px'>" +
				"<a" + (event.url ? " href='" + htmlEscape(event.url) + "'" : '') + ">" +
					(!event.allDay && seg.isStart ?
						"<span class='fc-event-time'>" +
							htmlEscape(formatDates(event.start, event.end, view.option('timeFormat'), options)) +
						"</span>"
					:'') +
					"<span class='fc-event-title'>" + htmlEscape(event.title) + "</span>" +
				"</a>" +
				((event.editable || event.editable == undefined && options.editable) && !options.disableResizing && $.fn.resizable ?
					"<div class='ui-resizable-handle ui-resizable-" + (rtl ? 'w' : 'e') + "'></div>"
					: '') +
			"</div>";
		seg.left = left;
		seg.outerWidth = right - left;
	}
	segmentContainer[0].innerHTML = html; // faster than html()
	eventElements = segmentContainer.children();
	
	// retrieve elements, run through eventRender callback, bind handlers
	for (i=0; i<segCnt; i++) {
		seg = segs[i];
		eventElement = $(eventElements[i]); // faster than eq()
		event = seg.event;
		triggerRes = view.trigger('eventRender', event, event, eventElement);
		if (triggerRes === false) {
			eventElement.remove();
		}else{
			if (triggerRes && triggerRes !== true) {
				eventElement.remove();
				eventElement = $(triggerRes)
					.css({
						position: 'absolute',
						left: seg.left
					})
					.appendTo(segmentContainer);
			}
			seg.element = eventElement;
			if (event._id === modifiedEventId) {
				bindSegHandlers(event, eventElement, seg);
			}else{
				eventElement[0]._fci = i; // for lazySegBind
			}
			view.reportEventElement(event, eventElement);
		}
	}
	
	lazySegBind(segmentContainer, segs, bindSegHandlers);
	
	// record event horizontal sides
	for (i=0; i<segCnt; i++) {
		seg = segs[i];
		if (eventElement = seg.element) {
			val = hsideCache[key = seg.key = cssKey(eventElement[0])];
			seg.hsides = val == undefined ? (hsideCache[key] = hsides(eventElement[0], true)) : val;
		}
	}
	
	// set event widths
	for (i=0; i<segCnt; i++) {
		seg = segs[i];
		if (eventElement = seg.element) {
			eventElement[0].style.width = seg.outerWidth - seg.hsides + 'px';
		}
	}
	
	// record event heights
	for (i=0; i<segCnt; i++) {
		seg = segs[i];
		if (eventElement = seg.element) {
			val = vmarginCache[key = seg.key];
			seg.outerHeight = eventElement[0].offsetHeight + (
				val == undefined ? (vmarginCache[key] = vmargins(eventElement[0])) : val
			);
		}
	}
	
	// set row heights, calculate event tops (in relation to row top)
	for (i=0, rowI=0; rowI<rowCnt; rowI++) {
		top = levelI = levelHeight = 0;
		while (i<segCnt && (seg = segs[i]).row == rowI) {
			if (seg.level != levelI) {
				top += levelHeight;
				levelHeight = 0;
				levelI++;
			}
			levelHeight = Math.max(levelHeight, seg.outerHeight||0);
			seg.top = top;
			i++;
		}
		rowDivs[rowI] = getRow(rowI).find('td:first div.fc-day-content > div') // optimal selector?
			.height(top + levelHeight);
	}
	
	// calculate row tops
	for (rowI=0; rowI<rowCnt; rowI++) {
		rowDivTops[rowI] = rowDivs[rowI][0].offsetTop;
	}
	
	// set event tops
	for (i=0; i<segCnt; i++) {
		seg = segs[i];
		if (eventElement = seg.element) {
			eventElement[0].style.top = rowDivTops[seg.row] + seg.top + 'px';
			event = seg.event;
			view.trigger('eventAfterRender', event, event, eventElement);
		}
	}
	
}



/* Agenda Views: agendaWeek/agendaDay
-----------------------------------------------------------------------------*/

setDefaults({
	allDaySlot: true,
	allDayText: 'all-day',
	firstHour: 6,
	slotMinutes: 30,
	defaultEventMinutes: 120,
	axisFormat: 'h(:mm)tt',
	timeFormat: {
		agenda: 'h:mm{ - h:mm}'
	},
	dragOpacity: {
		agenda: .5
	},
	minTime: 0,
	maxTime: 24
});

views.agendaWeek = function(element, options) {
	return new Agenda(element, options, {
		render: function(date, delta) {
			if (delta) {
				addDays(date, delta * 7);
			}
			var visStart = this.visStart = cloneDate(
					this.start = addDays(cloneDate(date), -((date.getDay() - options.firstDay + 7) % 7))
				),
				visEnd = this.visEnd = cloneDate(
					this.end = addDays(cloneDate(visStart), 7)
				);
			if (!options.weekends) {
				skipWeekend(visStart);
				skipWeekend(visEnd, -1, true);
			}
			this.title = formatDates(
				visStart,
				addDays(cloneDate(visEnd), -1),
				this.option('titleFormat'),
				options
			);
			this.renderAgenda(
				options.weekends ? 7 : 5,
				this.option('columnFormat')
			);
		}
	});
};

views.agendaDay = function(element, options) {
	return new Agenda(element, options, {
		render: function(date, delta) {
			if (delta) {
				addDays(date, delta);
				if (!options.weekends) {
					skipWeekend(date, delta < 0 ? -1 : 1);
				}
			}
			this.title = formatDate(date, this.option('titleFormat'), options);
			this.start = this.visStart = cloneDate(date, true);
			this.end = this.visEnd = addDays(cloneDate(this.start), 1);
			this.renderAgenda(
				1,
				this.option('columnFormat')
			);
		}
	});
};

function Agenda(element, options, methods) {

	var head, body, bodyContent, bodyTable, bg,
		colCnt,
		axisWidth, colWidth, slotHeight,
		viewWidth, viewHeight,
		savedScrollTop,
		cachedEvents=[],
		daySegmentContainer,
		slotSegmentContainer,
		tm, firstDay,
		nwe,            // no weekends (int)
		rtl, dis, dit,  // day index sign / translate
		minMinute, maxMinute,
		colContentPositions = new HorizontalPositionCache(function(col) {
			return bg.find('td:eq(' + col + ') div div');
		}),
		slotTopCache = {},
		// ...
		
	view = $.extend(this, viewMethods, methods, {
		renderAgenda: renderAgenda,
		renderEvents: renderEvents,
		rerenderEvents: rerenderEvents,
		clearEvents: clearEvents,
		setHeight: setHeight,
		setWidth: setWidth,
		beforeHide: function() {
			savedScrollTop = body.scrollTop();
		},
		afterShow: function() {
			body.scrollTop(savedScrollTop);
		},
		defaultEventEnd: function(event) {
			var start = cloneDate(event.start);
			if (event.allDay) {
				return start;
			}
			return addMinutes(start, options.defaultEventMinutes);
		}
	});
	view.init(element, options);
	
	
	
	/* Time-slot rendering
	-----------------------------------------------------------------------------*/
	
	
	element.addClass('fc-agenda');
	if (element.disableSelection) {
		element.disableSelection();
	}
	
	function renderAgenda(c, colFormat) {
		colCnt = c;
		
		// update option-derived variables
		tm = options.theme ? 'ui' : 'fc';
		nwe = options.weekends ? 0 : 1;
		firstDay = options.firstDay;
		if (rtl = options.isRTL) {
			dis = -1;
			dit = colCnt - 1;
		}else{
			dis = 1;
			dit = 0;
		}
		minMinute = parseTime(options.minTime);
		maxMinute = parseTime(options.maxTime);
		
		var d0 = rtl ? addDays(cloneDate(view.visEnd), -1) : cloneDate(view.visStart),
			d = cloneDate(d0),
			today = clearTime(new Date());
		
		if (!head) { // first time rendering, build from scratch
		
			var i,
				minutes,
				slotNormal = options.slotMinutes % 15 == 0, //...
			
			// head
			s = "<div class='fc-agenda-head' style='position:relative;z-index:4'>" +
				"<table style='width:100%'>" +
				"<tr class='fc-first" + (options.allDaySlot ? '' : ' fc-last') + "'>" +
				"<th class='fc-leftmost " +
					tm + "-state-default'>&nbsp;</th>";
			for (i=0; i<colCnt; i++) {
				s += "<th class='fc-" +
					dayIDs[d.getDay()] + ' ' + // needs to be first
					tm + '-state-default' +
					"'>" + formatDate(d, colFormat, options) + "</th>";
				addDays(d, dis);
				if (nwe) {
					skipWeekend(d, dis);
				}
			}
			s += "<th class='" + tm + "-state-default'>&nbsp;</th></tr>";
			if (options.allDaySlot) {
				s += "<tr class='fc-all-day'>" +
						"<th class='fc-axis fc-leftmost " + tm + "-state-default'>" + options.allDayText + "</th>" +
						"<td colspan='" + colCnt + "' class='" + tm + "-state-default'>" +
							"<div class='fc-day-content'><div style='position:relative'>&nbsp;</div></div></td>" +
						"<th class='" + tm + "-state-default'>&nbsp;</th>" +
					"</tr><tr class='fc-divider fc-last'><th colspan='" + (colCnt+2) + "' class='" +
						tm + "-state-default fc-leftmost'><div/></th></tr>";
			}
			s+= "</table></div>";
			head = $(s).appendTo(element);
			head.find('td').click(slotClick);
			
			// all-day event container
			daySegmentContainer = $("<div style='position:absolute;z-index:8;top:0;left:0'/>").appendTo(head);
			
			// body
			d = zeroDate();
			var maxd = addMinutes(cloneDate(d), maxMinute);
			addMinutes(d, minMinute);
			s = "<table>";
			for (i=0; d < maxd; i++) {
				minutes = d.getMinutes();
				s += "<tr class='" +
					(i==0 ? 'fc-first' : (minutes==0 ? '' : 'fc-minor')) +
					"'><th class='fc-axis fc-leftmost " + tm + "-state-default'>" +
					((!slotNormal || minutes==0) ? formatDate(d, options.axisFormat) : '&nbsp;') + 
					"</th><td class='fc-slot" + i + ' ' +
						tm + "-state-default'><div style='position:relative'>&nbsp;</div></td></tr>";
				addMinutes(d, options.slotMinutes);
			}
			s += "</table>";
			body = $("<div class='fc-agenda-body' style='position:relative;z-index:2;overflow:auto'/>")
				.append(bodyContent = $("<div style='position:relative;overflow:hidden'>")
					.append(bodyTable = $(s)))
				.appendTo(element);
			body.find('td').click(slotClick);
			
			// slot event container
			slotSegmentContainer = $("<div style='position:absolute;z-index:8;top:0;left:0'/>").appendTo(bodyContent);
			
			// background stripes
			d = cloneDate(d0);
			s = "<div class='fc-agenda-bg' style='position:absolute;z-index:1'>" +
				"<table style='width:100%;height:100%'><tr class='fc-first'>";
			for (i=0; i<colCnt; i++) {
				s += "<td class='fc-" +
					dayIDs[d.getDay()] + ' ' + // needs to be first
					tm + '-state-default ' +
					(i==0 ? 'fc-leftmost ' : '') +
					(+d == +today ? tm + '-state-highlight fc-today' : 'fc-not-today') +
					"'><div class='fc-day-content'><div>&nbsp;</div></div></td>";
				addDays(d, dis);
				if (nwe) {
					skipWeekend(d, dis);
				}
			}
			s += "</tr></table></div>";
			bg = $(s).appendTo(element);
			
		}else{ // skeleton already built, just modify it
		
			clearEvents();
			
			// redo column header text and class
			head.find('tr:first th').slice(1, -1).each(function() {
				$(this).text(formatDate(d, colFormat, options));
				this.className = this.className.replace(/^fc-\w+(?= )/, 'fc-' + dayIDs[d.getDay()]);
				addDays(d, dis);
				if (nwe) {
					skipWeekend(d, dis);
				}
			});
			
			// change classes of background stripes
			d = cloneDate(d0);
			bg.find('td').each(function() {
				this.className = this.className.replace(/^fc-\w+(?= )/, 'fc-' + dayIDs[d.getDay()]);
				if (+d == +today) {
					$(this)
						.removeClass('fc-not-today')
						.addClass('fc-today')
						.addClass(tm + '-state-highlight');
				}else{
					$(this)
						.addClass('fc-not-today')
						.removeClass('fc-today')
						.removeClass(tm + '-state-highlight');
				}
				addDays(d, dis);
				if (nwe) {
					skipWeekend(d, dis);
				}
			});
		
		}
		
	};
	
	
	function resetScroll() {
		var d0 = zeroDate(),
			scrollDate = cloneDate(d0);
		scrollDate.setHours(options.firstHour);
		var top = timePosition(d0, scrollDate) + 1, // +1 for the border
			scroll = function() {
				body.scrollTop(top);
			};
		scroll();
		setTimeout(scroll, 0); // overrides any previous scroll state made by the browser
	}
	
	
	function setHeight(height, dateChanged) {
		viewHeight = height;
		slotTopCache = {};
		
		body.height(height - head.height());
		
		slotHeight = body.find('tr:first div').height() + 1;
		
		bg.css({
			top: head.find('tr').height(),
			height: height
		});
		
		if (dateChanged) {
			resetScroll();
		}
	}
	
	
	function setWidth(width) {
		viewWidth = width;
		colContentPositions.clear();
		
		body.width(width);
		bodyTable.width('');
		
		var topTDs = head.find('tr:first th'),
			stripeTDs = bg.find('td'),
			clientWidth = body[0].clientWidth;
			
		bodyTable.width(clientWidth);
		
		// time-axis width
		axisWidth = 0;
		setOuterWidth(
			head.find('tr:lt(2) th:first').add(body.find('tr:first th'))
				.width('')
				.each(function() {
					axisWidth = Math.max(axisWidth, $(this).outerWidth());
				}),
			axisWidth
		);
		
		// column width
		colWidth = Math.floor((clientWidth - axisWidth) / colCnt);
		setOuterWidth(stripeTDs.slice(0, -1), colWidth);
		setOuterWidth(topTDs.slice(1, -2), colWidth);
		setOuterWidth(topTDs.slice(-2, -1), clientWidth - axisWidth - colWidth*(colCnt-1));
		
		bg.css({
			left: axisWidth,
			width: clientWidth - axisWidth
		});
	}
	
	
	
	
	function slotClick(ev) {
		var col = Math.floor((ev.pageX - bg.offset().left) / colWidth),
			date = addDays(cloneDate(view.visStart), dit + dis*col),
			rowMatch = this.className.match(/fc-slot(\d+)/);
		if (rowMatch) {
			var mins = parseInt(rowMatch[1]) * options.slotMinutes,
				hours = Math.floor(mins/60);
			date.setHours(hours);
			date.setMinutes(mins%60 + minMinute);
			view.trigger('dayClick', this, date, false, ev);
		}else{
			view.trigger('dayClick', this, date, true, ev);
		}
	}
	
	
	
	/* Event Rendering
	-----------------------------------------------------------------------------*/
	
	function renderEvents(events, modifiedEventId) {
		view.reportEvents(cachedEvents = events);
		var i, len=events.length,
			dayEvents=[],
			slotEvents=[];
		for (i=0; i<len; i++) {
			if (events[i].allDay) {
				dayEvents.push(events[i]);
			}else{
				slotEvents.push(events[i]);
			}
		}
		renderDaySegs(compileDaySegs(dayEvents), modifiedEventId);
		renderSlotSegs(compileSlotSegs(slotEvents), modifiedEventId);
	}
	
	
	function rerenderEvents(modifiedEventId) {
		clearEvents();
		renderEvents(cachedEvents, modifiedEventId);
	}
	
	
	function clearEvents() {
		view._clearEvents(); // only clears the hashes
		daySegmentContainer.empty();
		slotSegmentContainer.empty();
	}
	
	
	
	
	
	function compileDaySegs(events) {
		var levels = stackSegs(view.sliceSegs(events, $.map(events, visEventEnd), view.visStart, view.visEnd)),
			i, levelCnt=levels.length, level,
			j, seg,
			segs=[];
		for (i=0; i<levelCnt; i++) {
			level = levels[i];
			for (j=0; j<level.length; j++) {
				seg = level[j];
				seg.row = 0;
				seg.level = i;
				segs.push(seg);
			}
		}
		return segs;
	}
	
	
	function compileSlotSegs(events) {
		var d = addMinutes(cloneDate(view.visStart), minMinute),
			visEventEnds = $.map(events, visEventEnd),
			i, col,
			j, level,
			k, seg,
			segs=[];
		for (i=0; i<colCnt; i++) {
			col = stackSegs(view.sliceSegs(events, visEventEnds, d, addMinutes(cloneDate(d), maxMinute-minMinute)));
			countForwardSegs(col);
			for (j=0; j<col.length; j++) {
				level = col[j];
				for (k=0; k<level.length; k++) {
					seg = level[k];
					seg.col = i;
					seg.level = j;
					segs.push(seg);
				}
			}
			addDays(d, 1, true);
		}
		return segs;
	}
	
	
	
	
	// renders 'all-day' events at the top
	
	function renderDaySegs(segs, modifiedEventId) {
		if (options.allDaySlot) {
			_renderDaySegs(
				segs,
				1,
				view,
				axisWidth,
				viewWidth,
				function() {
					return head.find('tr.fc-all-day')
				},
				function(dayOfWeek) {
					return axisWidth + colContentPositions.left(day2col(dayOfWeek));
				},
				function(dayOfWeek) {
					return axisWidth + colContentPositions.right(day2col(dayOfWeek));
				},
				daySegmentContainer,
				bindDaySegHandlers,
				modifiedEventId
			);
			setHeight(viewHeight); // might have pushed the body down, so resize
		}
	}
	
	
	
	// renders events in the 'time slots' at the bottom
	
	function renderSlotSegs(segs, modifiedEventId) {
	
		var i, segCnt=segs.length, seg,
			event,
			className,
			top, bottom,
			colI, levelI, forward,
			leftmost,
			availWidth,
			outerWidth,
			left,
			html='',
			eventElements,
			eventElement,
			triggerRes,
			vsideCache={},
			hsideCache={},
			key, val,
			titleSpan,
			height;
			
		// calculate position/dimensions, create html
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			className = 'fc-event fc-event-vert ';
			if (seg.isStart) {
				className += 'fc-corner-top ';
			}
			if (seg.isEnd) {
				className += 'fc-corner-bottom ';
			}
			top = timePosition(seg.start, seg.start);
			bottom = timePosition(seg.start, seg.end);
			colI = seg.col;
			levelI = seg.level;
			forward = seg.forward || 0;
			leftmost = axisWidth + colContentPositions.left(colI*dis + dit);
			availWidth = axisWidth + colContentPositions.right(colI*dis + dit) - leftmost;
			availWidth = Math.min(availWidth-6, availWidth*.95); // TODO: move this to CSS
			if (levelI) {
				// indented and thin
				outerWidth = availWidth / (levelI + forward + 1);
			}else{
				if (forward) {
					// moderately wide, aligned left still
					outerWidth = ((availWidth / (forward + 1)) - (12/2)) * 2; // 12 is the predicted width of resizer =
				}else{
					// can be entire width, aligned left
					outerWidth = availWidth;
				}
			}
			left = leftmost +                                  // leftmost possible
				(availWidth / (levelI + forward + 1) * levelI) // indentation
				* dis + (rtl ? availWidth - outerWidth : 0);   // rtl
			seg.top = top;
			seg.left = left;
			seg.outerWidth = outerWidth;
			seg.outerHeight = bottom - top;
			html +=
				"<div class='" + className + event.className.join(' ') + "' style='position:absolute;z-index:8;top:" + top + "px;left:" + left + "px'>" +
					"<a" + (event.url ? " href='" + htmlEscape(event.url) + "'" : '') + ">" +
						"<span class='fc-event-bg'></span>" +
						"<span class='fc-event-time'>" + htmlEscape(formatDates(event.start, event.end, view.option('timeFormat'))) + "</span>" +
						"<span class='fc-event-title'>" + htmlEscape(event.title) + "</span>" +
					"</a>" +
					((event.editable || event.editable == undefined && options.editable) && !options.disableResizing && $.fn.resizable ?
						"<div class='ui-resizable-handle ui-resizable-s'>=</div>"
						: '') +
				"</div>";
		}
		slotSegmentContainer[0].innerHTML = html; // faster than html()
		eventElements = slotSegmentContainer.children();
		
		// retrieve elements, run through eventRender callback, bind event handlers
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			eventElement = $(eventElements[i]); // faster than eq()
			triggerRes = view.trigger('eventRender', event, event, eventElement);
			if (triggerRes === false) {
				eventElement.remove();
			}else{
				if (triggerRes && triggerRes !== true) {
					eventElement.remove();
					eventElement = $(triggerRes)
						.css({
							position: 'absolute',
							top: seg.top,
							left: seg.left
						})
						.appendTo(slotSegmentContainer);
				}
				seg.element = eventElement;
				if (event._id === modifiedEventId) {
					bindSlotSegHandlers(event, eventElement, seg);
				}else{
					eventElement[0]._fci = i; // for lazySegBind
				}
				view.reportEventElement(event, eventElement);
			}
		}
		
		lazySegBind(slotSegmentContainer, segs, bindSlotSegHandlers);
		
		// record event sides and title positions
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			if (eventElement = seg.element) {
				val = vsideCache[key = seg.key = cssKey(eventElement[0])];
				seg.vsides = val == undefined ? (vsideCache[key] = vsides(eventElement[0], true)) : val;
				val = hsideCache[key];
				seg.hsides = val == undefined ? (hsideCache[key] = hsides(eventElement[0], true)) : val;
				titleSpan = eventElement.find('span.fc-event-title');
				if (titleSpan.length) {
					seg.titleTop = titleSpan[0].offsetTop;
				}
			}
		}
		
		// set all positions/dimensions at once
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			if (eventElement = seg.element) {
				eventElement[0].style.width = seg.outerWidth - seg.hsides + 'px';
				eventElement[0].style.height = (height = seg.outerHeight - seg.vsides) + 'px';
				event = seg.event;
				if (seg.titleTop != undefined && height - seg.titleTop < 10) {
					// not enough room for title, put it in the time header
					eventElement.find('span.fc-event-time')
						.text(formatDate(event.start, view.option('timeFormat')) + ' - ' + event.title);
					eventElement.find('span.fc-event-title')
						.remove();
				}
				view.trigger('eventAfterRender', event, event, eventElement);
			}
		}
					
	}
	
	
	
	
	
	function visEventEnd(event) { // returns exclusive 'visible' end, for rendering
		if (event.allDay) {
			if (event.end) {
				var end = cloneDate(event.end);
				return (event.allDay || end.getHours() || end.getMinutes()) ? addDays(end, 1) : end;
			}else{
				return addDays(cloneDate(event.start), 1);
			}
		}
		if (event.end) {
			return cloneDate(event.end);
		}else{
			return addMinutes(cloneDate(event.start), options.defaultEventMinutes);
		}
	}
	
	
	
	function bindDaySegHandlers(event, eventElement, seg) {
		view.eventElementHandlers(event, eventElement);
		if (event.editable || event.editable == undefined && options.editable) {
			draggableDayEvent(event, eventElement, seg.isStart);
			if (seg.isEnd) {
				view.resizableDayEvent(event, eventElement, colWidth);
			}
		}
	}
	
	
	
	function bindSlotSegHandlers(event, eventElement, seg) {
		view.eventElementHandlers(event, eventElement);
		if (event.editable || event.editable == undefined && options.editable) {
			var timeElement = eventElement.find('span.fc-event-time');
			draggableSlotEvent(event, eventElement, timeElement);
			if (seg.isEnd) {
				resizableSlotEvent(event, eventElement, timeElement);
			}
		}
	}

	
	
	
	/* Event Dragging
	-----------------------------------------------------------------------------*/
	
	
	
	// when event starts out FULL-DAY
	
	function draggableDayEvent(event, eventElement, isStart) {
		if (!options.disableDragging && eventElement.draggable) {
			var origPosition, origWidth,
				resetElement,
				allDay=true,
				matrix;
			eventElement.draggable({
				zIndex: 9,
				opacity: view.option('dragOpacity', 'month'), // use whatever the month view was using
				revertDuration: options.dragRevertDuration,
				start: function(ev, ui) {
					view.hideEvents(event, eventElement);
					view.trigger('eventDragStart', eventElement, event, ev, ui);
					origPosition = eventElement.position();
					origWidth = eventElement.width();
					resetElement = function() {
						if (!allDay) {
							eventElement
								.width(origWidth)
								.height('')
								.draggable('option', 'grid', null);
							allDay = true;
						}
					};
					matrix = new HoverMatrix(function(cell) {
						eventElement.draggable('option', 'revert', !cell || !cell.rowDelta && !cell.colDelta);
						if (cell) {
							if (!cell.row) { // on full-days
								resetElement();
								view.showOverlay(cell);
							}else{ // mouse is over bottom slots
								if (isStart && allDay) {
									// convert event to temporary slot-event
									setOuterHeight(
										eventElement.width(colWidth - 10), // don't use entire width
										slotHeight * Math.round(
											(event.end ? ((event.end - event.start)/MINUTE_MS) : options.defaultEventMinutes)
											/options.slotMinutes)
									);
									eventElement.draggable('option', 'grid', [colWidth, 1]);
									allDay = false;
								}
								view.hideOverlay();
							}
						}else{ // mouse is outside of everything
							view.hideOverlay();
						}
					});
					matrix.row(head.find('td'));
					bg.find('td').each(function() {
						matrix.col(this);
					});
					matrix.row(body);
					matrix.mouse(ev.pageX, ev.pageY);
				},
				drag: function(ev, ui) {
					matrix.mouse(ev.pageX, ev.pageY);
				},
				stop: function(ev, ui) {
					view.hideOverlay();
					view.trigger('eventDragStop', eventElement, event, ev, ui);
					var cell = matrix.cell,
						dayDelta = dis * (
							allDay ? // can't trust cell.colDelta when using slot grid
							(cell ? cell.colDelta : 0) :
							Math.floor((ui.position.left - origPosition.left) / colWidth)
						);
					if (!cell || !dayDelta && !cell.rowDelta) {
						// over nothing (has reverted)
						resetElement();
						if ($.browser.msie) {
							eventElement.css('filter', ''); // clear IE opacity side-effects
						}
						view.showEvents(event, eventElement);
					}else{
						eventElement.find('a').removeAttr('href'); // prevents safari from visiting the link
						view.eventDrop(
							this, event, dayDelta,
							allDay ? 0 : // minute delta
								Math.round((eventElement.offset().top - bodyContent.offset().top) / slotHeight)
								* options.slotMinutes
								+ minMinute
								- (event.start.getHours() * 60 + event.start.getMinutes()),
							allDay, ev, ui
						);
					}
				}
			});
		}
	}
	
	
	
	// when event starts out IN TIMESLOTS
	
	function draggableSlotEvent(event, eventElement, timeElement) {
		if (!options.disableDragging && eventElement.draggable) {
			var origPosition,
				resetElement,
				prevSlotDelta, slotDelta,
				allDay=false,
				matrix;
			eventElement.draggable({
				zIndex: 9,
				scroll: false,
				grid: [colWidth, slotHeight],
				axis: colCnt==1 ? 'y' : false,
				opacity: view.option('dragOpacity'),
				revertDuration: options.dragRevertDuration,
				start: function(ev, ui) {
					view.hideEvents(event, eventElement);
					view.trigger('eventDragStart', eventElement, event, ev, ui);
					if ($.browser.msie) {
						eventElement.find('span.fc-event-bg').hide(); // nested opacities mess up in IE, just hide
					}
					origPosition = eventElement.position();
					resetElement = function() {
						// convert back to original slot-event
						if (allDay) {
							timeElement.css('display', ''); // show() was causing display=inline
							eventElement.draggable('option', 'grid', [colWidth, slotHeight]);
							allDay = false;
						}
					};
					prevSlotDelta = 0;
					matrix = new HoverMatrix(function(cell) {
						eventElement.draggable('option', 'revert', !cell);
						if (cell) {
							if (!cell.row && options.allDaySlot) { // over full days
								if (!allDay) {
									// convert to temporary all-day event
									allDay = true;
									timeElement.hide();
									eventElement.draggable('option', 'grid', null);
								}
								view.showOverlay(cell);
							}else{ // on slots
								resetElement();
								view.hideOverlay();
							}
						}else{
							view.hideOverlay();
						}
					});
					if (options.allDaySlot) {
						matrix.row(head.find('td'));
					}
					bg.find('td').each(function() {
						matrix.col(this);
					});
					matrix.row(body);
					matrix.mouse(ev.pageX, ev.pageY);
				},
				drag: function(ev, ui) {
					slotDelta = Math.round((ui.position.top - origPosition.top) / slotHeight);
					if (slotDelta != prevSlotDelta) {
						if (!allDay) {
							// update time header
							var minuteDelta = slotDelta*options.slotMinutes,
								newStart = addMinutes(cloneDate(event.start), minuteDelta),
								newEnd;
							if (event.end) {
								newEnd = addMinutes(cloneDate(event.end), minuteDelta);
							}
							timeElement.text(formatDates(newStart, newEnd, view.option('timeFormat')));
						}
						prevSlotDelta = slotDelta;
					}
					matrix.mouse(ev.pageX, ev.pageY);
				},
				stop: function(ev, ui) {
					view.hideOverlay();
					view.trigger('eventDragStop', eventElement, event, ev, ui);
					var cell = matrix.cell,
						dayDelta = dis * (
							allDay ? // can't trust cell.colDelta when using slot grid
							(cell ? cell.colDelta : 0) : 
							Math.floor((ui.position.left - origPosition.left) / colWidth)
						);
					if (!cell || !slotDelta && !dayDelta) {
						resetElement();
						if ($.browser.msie) {
							eventElement
								.css('filter', '') // clear IE opacity side-effects
								.find('span.fc-event-bg').css('display', ''); // .show() made display=inline
						}
						eventElement.css(origPosition); // sometimes fast drags make event revert to wrong position
						view.showEvents(event, eventElement);
					}else{
						view.eventDrop(
							this, event, dayDelta,
							allDay ? 0 : slotDelta * options.slotMinutes, // minute delta
							allDay, ev, ui
						);
					}
				}
			});
		}
	}
	
	
	
	
	/* Event Resizing
	-----------------------------------------------------------------------------*/
	
	// for TIMESLOT events

	function resizableSlotEvent(event, eventElement, timeElement) {
		if (!options.disableResizing && eventElement.resizable) {
			var slotDelta, prevSlotDelta;
			eventElement.resizable({
				handles: {
					s: 'div.ui-resizable-s'
				},
				grid: slotHeight,
				start: function(ev, ui) {
					slotDelta = prevSlotDelta = 0;
					view.hideEvents(event, eventElement);
					if ($.browser.msie && $.browser.version == '6.0') {
						eventElement.css('overflow', 'hidden');
					}
					eventElement.css('z-index', 9);
					view.trigger('eventResizeStart', this, event, ev, ui);
				},
				resize: function(ev, ui) {
					// don't rely on ui.size.height, doesn't take grid into account
					slotDelta = Math.round((Math.max(slotHeight, eventElement.height()) - ui.originalSize.height) / slotHeight);
					if (slotDelta != prevSlotDelta) {
						timeElement.text(
							formatDates(
								event.start,
								(!slotDelta && !event.end) ? null : // no change, so don't display time range
									addMinutes(view.eventEnd(event), options.slotMinutes*slotDelta),
								view.option('timeFormat')
							)
						);
						prevSlotDelta = slotDelta;
					}
				},
				stop: function(ev, ui) {
					view.trigger('eventResizeStop', this, event, ev, ui);
					if (slotDelta) {
						view.eventResize(this, event, 0, options.slotMinutes*slotDelta, ev, ui);
					}else{
						eventElement.css('z-index', 8);
						view.showEvents(event, eventElement);
						// BUG: if event was really short, need to put title back in span
					}
				}
			});
		}
	}
	
	
	
	
	/* Misc
	-----------------------------------------------------------------------------*/
	
	// get the Y coordinate of the given time on the given day (both Date objects)
	
	function timePosition(day, time) { // both date objects. day holds 00:00 of current day
		day = cloneDate(day, true);
		if (time < addMinutes(cloneDate(day), minMinute)) {
			return 0;
		}
		if (time >= addMinutes(cloneDate(day), maxMinute)) {
			return bodyContent.height();
		}
		var slotMinutes = options.slotMinutes,
			minutes = time.getHours()*60 + time.getMinutes() - minMinute,
			slotI = Math.floor(minutes / slotMinutes),
			slotTop = slotTopCache[slotI];
		if (slotTop == undefined) {
			slotTop = slotTopCache[slotI] = body.find('tr:eq(' + slotI + ') td div')[0].offsetTop;
		}
		return Math.max(0, Math.round(
			slotTop - 1 + slotHeight * ((minutes % slotMinutes) / slotMinutes)
		));
	}
	
	
	
	
	function day2col(dayOfWeek) {
		return ((dayOfWeek - Math.max(firstDay,nwe)+colCnt) % colCnt)*dis+dit;
	}
	

}


// count the number of colliding, higher-level segments (for event squishing)

function countForwardSegs(levels) {
	var i, j, k, level, segForward, segBack;
	for (i=levels.length-1; i>0; i--) {
		level = levels[i];
		for (j=0; j<level.length; j++) {
			segForward = level[j];
			for (k=0; k<levels[i-1].length; k++) {
				segBack = levels[i-1][k];
				if (segsCollide(segForward, segBack)) {
					segBack.forward = Math.max(segBack.forward||0, (segForward.forward||0)+1);
				}
			}
		}
	}
}


/* Methods & Utilities for All Views
-----------------------------------------------------------------------------*/

var viewMethods = {

	// TODO: maybe change the 'vis' variables to 'excl'

	/*
	 * Objects inheriting these methods must implement the following properties/methods:
	 * - title
	 * - start
	 * - end
	 * - visStart
	 * - visEnd
	 * - defaultEventEnd(event)
	 * - render(events)
	 * - rerenderEvents()
	 *
	 *
	 * z-index reservations:
	 * 3 - day-overlay
	 * 8 - events
	 * 9 - dragging/resizing events
	 *
	 */
	
	

	init: function(element, options) {
		this.element = element;
		this.options = options;
		this.eventsByID = {};
		this.eventElements = [];
		this.eventElementsByID = {};
	},
	
	
	
	// triggers an event handler, always append view as last arg
	
	trigger: function(name, thisObj) {
		if (this.options[name]) {
			return this.options[name].apply(thisObj || this, Array.prototype.slice.call(arguments, 2).concat([this]));
		}
	},
	
	
	
	// returns a Date object for an event's end
	
	eventEnd: function(event) {
		return event.end ? cloneDate(event.end) : this.defaultEventEnd(event); // TODO: make sure always using copies
	},
	
	
	
	// report when view receives new events
	
	reportEvents: function(events) { // events are already normalized at this point
		var i, len=events.length, event,
			eventsByID = this.eventsByID = {};
		for (i=0; i<len; i++) {
			event = events[i];
			if (eventsByID[event._id]) {
				eventsByID[event._id].push(event);
			}else{
				eventsByID[event._id] = [event];
			}
		}
	},
	
	
	
	// report when view creates an element for an event

	reportEventElement: function(event, element) {
		this.eventElements.push(element);
		var eventElementsByID = this.eventElementsByID;
		if (eventElementsByID[event._id]) {
			eventElementsByID[event._id].push(element);
		}else{
			eventElementsByID[event._id] = [element];
		}
	},
	
	
	
	// event element manipulation
	
	_clearEvents: function() { // only resets hashes
		this.eventElements = [];
		this.eventElementsByID = {};
	},
	
	showEvents: function(event, exceptElement) {
		this._eee(event, exceptElement, 'show');
	},
	
	hideEvents: function(event, exceptElement) {
		this._eee(event, exceptElement, 'hide');
	},
	
	_eee: function(event, exceptElement, funcName) { // event-element-each
		var elements = this.eventElementsByID[event._id],
			i, len = elements.length;
		for (i=0; i<len; i++) {
			if (elements[i][0] != exceptElement[0]) { // AHAHAHAHAHAHAHAH
				elements[i][funcName]();
			}
		}
	},
	
	
	
	// event modification reporting
	
	eventDrop: function(e, event, dayDelta, minuteDelta, allDay, ev, ui) {
		var view = this,
			oldAllDay = event.allDay,
			eventId = event._id;
		view.moveEvents(view.eventsByID[eventId], dayDelta, minuteDelta, allDay);
		view.trigger('eventDrop', e, event, dayDelta, minuteDelta, allDay, function() { // TODO: change docs
			// TODO: investigate cases where this inverse technique might not work
			view.moveEvents(view.eventsByID[eventId], -dayDelta, -minuteDelta, oldAllDay);
			view.rerenderEvents();
		}, ev, ui);
		view.eventsChanged = true;
		view.rerenderEvents(eventId);
	},
	
	eventResize: function(e, event, dayDelta, minuteDelta, ev, ui) {
		var view = this,
			eventId = event._id;
		view.elongateEvents(view.eventsByID[eventId], dayDelta, minuteDelta);
		view.trigger('eventResize', e, event, dayDelta, minuteDelta, function() {
			// TODO: investigate cases where this inverse technique might not work
			view.elongateEvents(view.eventsByID[eventId], -dayDelta, -minuteDelta);
			view.rerenderEvents();
		}, ev, ui);
		view.eventsChanged = true;
		view.rerenderEvents(eventId);
	},
	
	
	
	// event modification
	
	moveEvents: function(events, dayDelta, minuteDelta, allDay) {
		minuteDelta = minuteDelta || 0;
		for (var e, len=events.length, i=0; i<len; i++) {
			e = events[i];
			if (allDay != undefined) {
				e.allDay = allDay;
			}
			addMinutes(addDays(e.start, dayDelta, true), minuteDelta);
			if (e.end) {
				e.end = addMinutes(addDays(e.end, dayDelta, true), minuteDelta);
			}
			normalizeEvent(e, this.options);
		}
	},
	
	elongateEvents: function(events, dayDelta, minuteDelta) {
		minuteDelta = minuteDelta || 0;
		for (var e, len=events.length, i=0; i<len; i++) {
			e = events[i];
			e.end = addMinutes(addDays(this.eventEnd(e), dayDelta, true), minuteDelta);
			normalizeEvent(e, this.options);
		}
	},
	
	
	
	// semi-transparent overlay (while dragging)
	
	showOverlay: function(props) {
		if (!this.dayOverlay) {
			this.dayOverlay = $("<div class='fc-cell-overlay' style='position:absolute;z-index:3;display:none'/>")
				.appendTo(this.element);
		}
		var o = this.element.offset();
		this.dayOverlay
			.css({
				top: props.top - o.top,
				left: props.left - o.left,
				width: props.width,
				height: props.height
			})
			.show();
	},
	
	hideOverlay: function() {
		if (this.dayOverlay) {
			this.dayOverlay.hide();
		}
	},
	
	
	
	// common horizontal event resizing

	resizableDayEvent: function(event, eventElement, colWidth) {
		var view = this;
		if (!view.options.disableResizing && eventElement.resizable) {
			eventElement.resizable({
				handles: view.options.isRTL ? {w:'div.ui-resizable-w'} : {e:'div.ui-resizable-e'},
				grid: colWidth,
				minWidth: colWidth/2, // need this or else IE throws errors when too small
				containment: view.element.parent().parent(), // the main element...
				             // ... a fix. wouldn't allow extending to last column in agenda views (jq ui bug?)
				start: function(ev, ui) {
					eventElement.css('z-index', 9);
					view.hideEvents(event, eventElement);
					view.trigger('eventResizeStart', this, event, ev, ui);
				},
				stop: function(ev, ui) {
					view.trigger('eventResizeStop', this, event, ev, ui);
					// ui.size.width wasn't working with grid correctly, use .width()
					var dayDelta = Math.round((eventElement.width() - ui.originalSize.width) / colWidth);
					if (dayDelta) {
						view.eventResize(this, event, dayDelta, 0, ev, ui);
					}else{
						eventElement.css('z-index', 8);
						view.showEvents(event, eventElement);
					}
				}
			});
		}
	},
	
	
	
	// attaches eventClick, eventMouseover, eventMouseout
	
	eventElementHandlers: function(event, eventElement) {
		var view = this;
		eventElement
			.click(function(ev) {
				if (!eventElement.hasClass('ui-draggable-dragging') &&
					!eventElement.hasClass('ui-resizable-resizing')) {
						return view.trigger('eventClick', this, event, ev);
					}
			})
			.hover(
				function(ev) {
					view.trigger('eventMouseover', this, event, ev);
				},
				function(ev) {
					view.trigger('eventMouseout', this, event, ev);
				}
			);
	},
	
	
	
	// get a property from the 'options' object, using smart view naming
	
	option: function(name, viewName) {
		var v = this.options[name];
		if (typeof v == 'object') {
			return smartProperty(v, viewName || this.name);
		}
		return v;
	},
	
	
	
	// event rendering utilities
	
	sliceSegs: function(events, visEventEnds, start, end) {
		var segs = [],
			i, len=events.length, event,
			eventStart, eventEnd,
			segStart, segEnd,
			isStart, isEnd;
		for (i=0; i<len; i++) {
			event = events[i];
			eventStart = event.start;
			eventEnd = visEventEnds[i];
			if (eventEnd > start && eventStart < end) {
				if (eventStart < start) {
					segStart = cloneDate(start);
					isStart = false;
				}else{
					segStart = eventStart;
					isStart = true;
				}
				if (eventEnd > end) {
					segEnd = cloneDate(end);
					isEnd = false;
				}else{
					segEnd = eventEnd;
					isEnd = true;
				}
				segs.push({
					event: event,
					start: segStart,
					end: segEnd,
					isStart: isStart,
					isEnd: isEnd,
					msLength: segEnd - segStart
				});
			}
		} 
		return segs.sort(segCmp);
	}
	

};



function lazySegBind(container, segs, bindHandlers) {
	container.unbind('mouseover').mouseover(function(ev) {
		var parent=ev.target, e,
			i, seg;
		while (parent != this) {
			e = parent;
			parent = parent.parentNode;
		}
		if ((i = e._fci) != undefined) {
			e._fci = undefined;
			seg = segs[i];
			bindHandlers(seg.event, seg.element, seg);
			$(ev.target).trigger(ev);
		}
		ev.stopPropagation();
	});
}



// event rendering calculation utilities

function stackSegs(segs) {
	var levels = [],
		i, len = segs.length, seg,
		j, collide, k;
	for (i=0; i<len; i++) {
		seg = segs[i];
		j = 0; // the level index where seg should belong
		while (true) {
			collide = false;
			if (levels[j]) {
				for (k=0; k<levels[j].length; k++) {
					if (segsCollide(levels[j][k], seg)) {
						collide = true;
						break;
					}
				}
			}
			if (collide) {
				j++;
			}else{
				break;
			}
		}
		if (levels[j]) {
			levels[j].push(seg);
		}else{
			levels[j] = [seg];
		}
	}
	return levels;
}

function segCmp(a, b) {
	return  (b.msLength - a.msLength) * 100 + (a.event.start - b.event.start);
}

function segsCollide(seg1, seg2) {
	return seg1.end > seg2.start && seg1.start < seg2.end;
}




/* Date Math
-----------------------------------------------------------------------------*/

var DAY_MS = 86400000,
	HOUR_MS = 3600000,
	MINUTE_MS = 60000;

function addYears(d, n, keepTime) {
	d.setFullYear(d.getFullYear() + n);
	if (!keepTime) {
		clearTime(d);
	}
	return d;
}

function addMonths(d, n, keepTime) { // prevents day overflow/underflow
	if (+d) { // prevent infinite looping on invalid dates
		var m = d.getMonth() + n,
			check = cloneDate(d);
		check.setDate(1);
		check.setMonth(m);
		d.setMonth(m);
		if (!keepTime) {
			clearTime(d);
		}
		while (d.getMonth() != check.getMonth()) {
			d.setDate(d.getDate() + (d < check ? 1 : -1));
		}
	}
	return d;
}

function addDays(d, n, keepTime) { // deals with daylight savings
	if (+d) {
		var dd = d.getDate() + n,
			check = cloneDate(d);
		check.setHours(9); // set to middle of day
		check.setDate(dd);
		d.setDate(dd);
		if (!keepTime) {
			clearTime(d);
		}
		fixDate(d, check);
	}
	return d;
}
fc.addDays = addDays;

function fixDate(d, check) { // force d to be on check's YMD, for daylight savings purposes
	if (+d) { // prevent infinite looping on invalid dates
		while (d.getDate() != check.getDate()) {
			d.setTime(+d + (d < check ? 1 : -1) * HOUR_MS);
		}
	}
}

function addMinutes(d, n) {
	d.setMinutes(d.getMinutes() + n);
	return d;
}

function clearTime(d) {
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0); 
	d.setMilliseconds(0);
	return d;
}

function cloneDate(d, dontKeepTime) {
	if (dontKeepTime) {
		return clearTime(new Date(+d));
	}
	return new Date(+d);
}

function zeroDate() { // returns a Date with time 00:00:00 and dateOfMonth=1
	var i=0, d;
	do {
		d = new Date(1970, i++, 1);
	} while (d.getHours() != 0);
	return d;
}

function skipWeekend(date, inc, excl) {
	inc = inc || 1;
	while (date.getDay()==0 || (excl && date.getDay()==1 || !excl && date.getDay()==6)) {
		addDays(date, inc);
	}
	return date;
}



/* Date Parsing
-----------------------------------------------------------------------------*/

var parseDate = fc.parseDate = function(s) {
	if (typeof s == 'object') { // already a Date object
		return s;
	}
	if (typeof s == 'number') { // a UNIX timestamp
		return new Date(s * 1000);
	}
	if (typeof s == 'string') {
		if (s.match(/^\d+$/)) { // a UNIX timestamp
			return new Date(parseInt(s) * 1000);
		}
		return parseISO8601(s, true) || (s ? new Date(s) : null);
	}
	// TODO: never return invalid dates (like from new Date(<string>)), return null instead
	return null;
}

var parseISO8601 = fc.parseISO8601 = function(s, ignoreTimezone) {
	// derived from http://delete.me.uk/2005/03/iso8601.html
	// TODO: for a know glitch/feature, read tests/issue_206_parseDate_dst.html
	var m = s.match(/^([0-9]{4})(-([0-9]{2})(-([0-9]{2})([T ]([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?$/);
	if (!m) {
		return null;
	}
	var date = new Date(m[1], 0, 1),
		check = new Date(m[1], 0, 1, 9, 0),
		offset = 0;
	if (m[3]) {
		date.setMonth(m[3] - 1);
		check.setMonth(m[3] - 1);
	}
	if (m[5]) {
		date.setDate(m[5]);
		check.setDate(m[5]);
	}
	fixDate(date, check);
	if (m[7]) {
		date.setHours(m[7]);
	}
	if (m[8]) {
		date.setMinutes(m[8]);
	}
	if (m[10]) {
		date.setSeconds(m[10]);
	}
	if (m[12]) {
		date.setMilliseconds(Number("0." + m[12]) * 1000);
	}
	fixDate(date, check);
	if (!ignoreTimezone) {
		if (m[14]) {
			offset = Number(m[16]) * 60 + Number(m[17]);
			offset *= m[15] == '-' ? 1 : -1;
		}
		offset -= date.getTimezoneOffset();
	}
	return new Date(+date + (offset * 60 * 1000));
}

var parseTime = fc.parseTime = function(s) { // returns minutes since start of day
	if (typeof s == 'number') { // an hour
		return s * 60;
	}
	if (typeof s == 'object') { // a Date object
		return s.getHours() * 60 + s.getMinutes();
	}
	var m = s.match(/(\d+)(?::(\d+))?\s*(\w+)?/);
	if (m) {
		var h = parseInt(m[1]);
		if (m[3]) {
			h %= 12;
			if (m[3].toLowerCase().charAt(0) == 'p') {
				h += 12;
			}
		}
		return h * 60 + (m[2] ? parseInt(m[2]) : 0);
	}
};



/* Date Formatting
-----------------------------------------------------------------------------*/

var formatDate = fc.formatDate = function(date, format, options) {
	return formatDates(date, null, format, options);
}

var formatDates = fc.formatDates = function(date1, date2, format, options) {
	options = options || defaults;
	var date = date1,
		otherDate = date2,
		i, len = format.length, c,
		i2, formatter,
		res = '';
	for (i=0; i<len; i++) {
		c = format.charAt(i);
		if (c == "'") {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == "'") {
					if (date) {
						if (i2 == i+1) {
							res += "'";
						}else{
							res += format.substring(i+1, i2);
						}
						i = i2;
					}
					break;
				}
			}
		}
		else if (c == '(') {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == ')') {
					var subres = formatDate(date, format.substring(i+1, i2), options);
					if (parseInt(subres.replace(/\D/, ''))) {
						res += subres;
					}
					i = i2;
					break;
				}
			}
		}
		else if (c == '[') {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == ']') {
					var subformat = format.substring(i+1, i2);
					var subres = formatDate(date, subformat, options);
					if (subres != formatDate(otherDate, subformat, options)) {
						res += subres;
					}
					i = i2;
					break;
				}
			}
		}
		else if (c == '{') {
			date = date2;
			otherDate = date1;
		}
		else if (c == '}') {
			date = date1;
			otherDate = date2;
		}
		else {
			for (i2=len; i2>i; i2--) {
				if (formatter = dateFormatters[format.substring(i, i2)]) {
					if (date) {
						res += formatter(date, options);
					}
					i = i2 - 1;
					break;
				}
			}
			if (i2 == i) {
				if (date) {
					res += c;
				}
			}
		}
	}
	return res;
}

var dateFormatters = {
	s	: function(d)	{ return d.getSeconds() },
	ss	: function(d)	{ return zeroPad(d.getSeconds()) },
	m	: function(d)	{ return d.getMinutes() },
	mm	: function(d)	{ return zeroPad(d.getMinutes()) },
	h	: function(d)	{ return d.getHours() % 12 || 12 },
	hh	: function(d)	{ return zeroPad(d.getHours() % 12 || 12) },
	H	: function(d)	{ return d.getHours() },
	HH	: function(d)	{ return zeroPad(d.getHours()) },
	d	: function(d)	{ return d.getDate() },
	dd	: function(d)	{ return zeroPad(d.getDate()) },
	ddd	: function(d,o)	{ return o.dayNamesShort[d.getDay()] },
	dddd: function(d,o)	{ return o.dayNames[d.getDay()] },
	M	: function(d)	{ return d.getMonth() + 1 },
	MM	: function(d)	{ return zeroPad(d.getMonth() + 1) },
	MMM	: function(d,o)	{ return o.monthNamesShort[d.getMonth()] },
	MMMM: function(d,o)	{ return o.monthNames[d.getMonth()] },
	yy	: function(d)	{ return (d.getFullYear()+'').substring(2) },
	yyyy: function(d)	{ return d.getFullYear() },
	t	: function(d)	{ return d.getHours() < 12 ? 'a' : 'p' },
	tt	: function(d)	{ return d.getHours() < 12 ? 'am' : 'pm' },
	T	: function(d)	{ return d.getHours() < 12 ? 'A' : 'P' },
	TT	: function(d)	{ return d.getHours() < 12 ? 'AM' : 'PM' },
	u	: function(d)	{ return formatDate(d, "yyyy-MM-dd'T'HH:mm:ss'Z'") },
	S	: function(d)	{
		var date = d.getDate();
		if (date > 10 && date < 20) return 'th';
		return ['st', 'nd', 'rd'][date%10-1] || 'th';
	}
};



/* Element Dimensions
-----------------------------------------------------------------------------*/

function setOuterWidth(element, width, includeMargins) {
	element.each(function(i, _element) {
		_element.style.width = width - hsides(_element, includeMargins) + 'px';
	});
}

function setOuterHeight(element, height, includeMargins) {
	element.each(function(i, _element) {
		_element.style.height = height - vsides(_element, includeMargins) + 'px';
	});
}


function hsides(_element, includeMargins) {
	return (parseFloat(jQuery.curCSS(_element, 'paddingLeft', true)) || 0) +
	       (parseFloat(jQuery.curCSS(_element, 'paddingRight', true)) || 0) +
	       (parseFloat(jQuery.curCSS(_element, 'borderLeftWidth', true)) || 0) +
	       (parseFloat(jQuery.curCSS(_element, 'borderRightWidth', true)) || 0) +
	       (includeMargins ? hmargins(_element) : 0);
}

function hmargins(_element) {
	return (parseFloat(jQuery.curCSS(_element, 'marginLeft', true)) || 0) +
	       (parseFloat(jQuery.curCSS(_element, 'marginRight', true)) || 0);
}

function vsides(_element, includeMargins) {
	return (parseFloat(jQuery.curCSS(_element, 'paddingTop', true)) || 0) +
	       (parseFloat(jQuery.curCSS(_element, 'paddingBottom', true)) || 0) +
	       (parseFloat(jQuery.curCSS(_element, 'borderTopWidth', true)) || 0) +
	       (parseFloat(jQuery.curCSS(_element, 'borderBottomWidth', true)) || 0) +
	       (includeMargins ? vmargins(_element) : 0);
}

function vmargins(_element) {
	return (parseFloat(jQuery.curCSS(_element, 'marginTop', true)) || 0) +
	       (parseFloat(jQuery.curCSS(_element, 'marginBottom', true)) || 0);
}




function setMinHeight(element, h) {
	h = typeof h == 'number' ? h + 'px' : h;
	element[0].style.cssText += ';min-height:' + h + ';_height:' + h;
}



/* Position Calculation
-----------------------------------------------------------------------------*/
// nasty bugs in opera 9.25
// position()'s top returning incorrectly with TR/TD or elements within TD

var topBug;

function topCorrect(tr) { // tr/th/td or anything else
	if (topBug !== false) {
		var cell;
		if (tr.is('th,td')) {
			tr = (cell = tr).parent();
		}
		if (topBug == undefined && tr.is('tr')) {
			topBug = tr.position().top != tr.children().position().top;
		}
		if (topBug) {
			return tr.parent().position().top + (cell ? tr.position().top - cell.position().top : 0);
		}
	}
	return 0;
}



/* Hover Matrix
-----------------------------------------------------------------------------*/

function HoverMatrix(changeCallback) {

	var t=this,
		tops=[], lefts=[],
		prevRowE, prevColE,
		origRow, origCol,
		currRow, currCol;
	
	t.row = function(e) {
		prevRowE = $(e);
		tops.push(prevRowE.offset().top + topCorrect(prevRowE));
	};
	
	t.col = function(e) {
		prevColE = $(e);
		lefts.push(prevColE.offset().left);
	};

	t.mouse = function(x, y) {
		if (origRow == undefined) {
			tops.push(tops[tops.length-1] + prevRowE.outerHeight());
			lefts.push(lefts[lefts.length-1] + prevColE.outerWidth());
			currRow = currCol = -1;
		}
		var r, c;
		for (r=0; r<tops.length && y>=tops[r]; r++) ;
		for (c=0; c<lefts.length && x>=lefts[c]; c++) ;
		r = r >= tops.length ? -1 : r - 1;
		c = c >= lefts.length ? -1 : c - 1;
		if (r != currRow || c != currCol) {
			currRow = r;
			currCol = c;
			if (r == -1 || c == -1) {
				t.cell = null;
			}else{
				if (origRow == undefined) {
					origRow = r;
					origCol = c;
				}
				t.cell = {
					row: r,
					col: c,
					top: tops[r],
					left: lefts[c],
					width: lefts[c+1] - lefts[c],
					height: tops[r+1] - tops[r],
					isOrig: r==origRow && c==origCol,
					rowDelta: r-origRow,
					colDelta: c-origCol
				};
			}
			changeCallback(t.cell);
		}
	};

}



/* Misc Utils
-----------------------------------------------------------------------------*/

var undefined,
	dayIDs = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
	arrayPop = Array.prototype.pop;

function zeroPad(n) {
	return (n < 10 ? '0' : '') + n;
}

function smartProperty(obj, name) { // get a camel-cased/namespaced property of an object
	if (obj[name] != undefined) {
		return obj[name];
	}
	var parts = name.split(/(?=[A-Z])/),
		i=parts.length-1, res;
	for (; i>=0; i--) {
		res = obj[parts[i].toLowerCase()];
		if (res != undefined) {
			return res;
		}
	}
	return obj[''];
}

function htmlEscape(s) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/'/g, '&#039;')
		.replace(/"/g, '&quot;')
}



function HorizontalPositionCache(getElement) {

	var t = this,
		elements = {},
		lefts = {},
		rights = {};
		
	function e(i) {
		return elements[i] =
			elements[i] || getElement(i);
	}
	
	t.left = function(i) {
		return lefts[i] =
			lefts[i] == undefined ? e(i).position().left : lefts[i];
	};
	
	t.right = function(i) {
		return rights[i] =
			rights[i] == undefined ? t.left(i) + e(i).width() : rights[i];
	};
	
	t.clear = function() {
		elements = {};
		lefts = {};
		rights = {};
	};
	
}



function cssKey(_element) {
	return _element.id + '/' + _element.className + '/' + _element.style.cssText.replace(/(^|;)\s*(top|left|width|height)\s*:[^;]*/ig, '');
}




})(jQuery);

/*
 * jQuery.weekCalendar v1.2.3-pre
 * http://www.redredred.com.au/
 *
 * Requires:
 * - jquery.weekcalendar.css
 * - jquery 1.3.x
 * - jquery-ui 1.7.x (widget, drag, drop, resize)
 *
 * Copyright (c) 2009 Rob Monie
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *   
 *   If you're after a monthly calendar plugin, check out http://arshaw.com/fullcalendar/
 */

(function($) {

   $.widget("ui.weekCalendar", {

       options : {
         date: new Date(),
         timeFormat : "h:i a",
         dateFormat : "M d, Y",
         alwaysDisplayTimeMinutes: true,
         use24Hour : false,
         daysToShow : 7,
         firstDayOfWeek : 0, // 0 = Sunday, 1 = Monday, 2 = Tuesday, ... , 6 = Saturday
         useShortDayNames: false,
         timeSeparator : " to ",
         startParam : "start",
         endParam : "end",
         businessHours : {start: 8, end: 18, limitDisplay : false},
         newEventText : "New Event",
         timeslotHeight: 20,
         defaultEventLength : 2,
         timeslotsPerHour : 4,
         buttons : true,
         buttonText : {
            today : "today",
            lastWeek : "&nbsp;&lt;&nbsp;",
            nextWeek : "&nbsp;&gt;&nbsp;"
         },
         scrollToHourMillis : 500,
         allowCalEventOverlap : false,
         overlapEventsSeparate: false,
         readonly: false,
         draggable : function(calEvent, element) {
            return true;
         },
         resizable : function(calEvent, element) {
            return true;
         },
         eventClick : function() {
         },
         eventRender : function(calEvent, element) {
            return element;
         },
         eventAfterRender : function(calEvent, element) {
            return element;
         },
         eventDrag : function(calEvent, element) {
         },
         eventDrop : function(calEvent, element) {
         },
         eventResize : function(calEvent, element) {
         },
         eventNew : function(calEvent, element) {
         },
         eventMouseover : function(calEvent, $event) {
         },
         eventMouseout : function(calEvent, $event) {
         },
         calendarBeforeLoad : function(calendar) {
         },
         calendarAfterLoad : function(calendar) {
         },
         noEvents : function() {
         },
         shortMonths : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
         longMonths : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
         shortDays : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
         longDays : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      },

      /***********************
       * Initialise calendar *
       ***********************/
      _create : function() {

         var self = this;
         self._computeOptions();
         self._setupEventDelegation();

         self._renderCalendar();

         self._loadCalEvents();

         self._resizeCalendar();
         self._scrollToHour(self.options.date.getHours());

         $(window).unbind("resize.weekcalendar");
         $(window).bind("resize.weekcalendar", function() {
            self._resizeCalendar();
         });

      },


      /********************
       * public functions *
       ********************/
      /*
       * Refresh the events for the currently displayed week.
       */
      refresh : function() {
         this._loadCalEvents(this.element.data("startDate")); //reload with existing week
      },

      /*
       * Clear all events currently loaded into the calendar
       */
      clear : function() {
         this._clearCalendar();
      },

      /*
       * Go to this week
       */
      today : function() {
         this._clearCalendar();
         this._loadCalEvents(new Date());
      },

      /*
       * Go to the previous week relative to the currently displayed week
       */
      prevWeek : function() {
         //minus more than 1 day to be sure we're in previous week - account for daylight savings or other anomolies
         var newDate = new Date(this.element.data("startDate").getTime() - (MILLIS_IN_WEEK / 6));
         this._clearCalendar();
         this._loadCalEvents(newDate);
      },

      /*
       * Go to the next week relative to the currently displayed week
       */
      nextWeek : function() {
         //add 8 days to be sure of being in prev week - allows for daylight savings or other anomolies
         var newDate = new Date(this.element.data("startDate").getTime() + MILLIS_IN_WEEK + (MILLIS_IN_WEEK / 7));
         this._clearCalendar();
         this._loadCalEvents(newDate);
      },

      /*
       * Reload the calendar to whatever week the date passed in falls on.
       */
      gotoWeek : function(date) {
         this._clearCalendar();
         this._loadCalEvents(date);
      },

      /*
       * Remove an event based on it's id
       */
      removeEvent : function(eventId) {

         var self = this;

         self.element.find(".wc-cal-event").each(function() {
            if ($(this).data("calEvent").id === eventId) {
               $(this).remove();
               return false;
            }
         });

         //this could be more efficient rather than running on all days regardless...
         self.element.find(".wc-day-column-inner").each(function() {
            self._adjustOverlappingEvents($(this));
         });
      },

      /*
       * Removes any events that have been added but not yet saved (have no id).
       * This is useful to call after adding a freshly saved new event.
       */
      removeUnsavedEvents : function() {

         var self = this;

         self.element.find(".wc-new-cal-event").each(function() {
            $(this).remove();
         });

         //this could be more efficient rather than running on all days regardless...
         self.element.find(".wc-day-column-inner").each(function() {
            self._adjustOverlappingEvents($(this));
         });
      },

      /*
       * update an event in the calendar. If the event exists it refreshes
       * it's rendering. If it's a new event that does not exist in the calendar
       * it will be added.
       */
      updateEvent : function (calEvent) {
         this._updateEventInCalendar(calEvent);
      },

      /*
       * Returns an array of timeslot start and end times based on
       * the configured grid of the calendar. Returns in both date and
       * formatted time based on the 'timeFormat' config option.
       */
      getTimeslotTimes : function(date) {
         var options = this.options;
         var firstHourDisplayed = options.businessHours.limitDisplay ? options.businessHours.start : 0;
         var startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), firstHourDisplayed);

         var times = []
         var startMillis = startDate.getTime();
         for (var i = 0; i < options.timeslotsPerDay; i++) {
            var endMillis = startMillis + options.millisPerTimeslot;
            times[i] = {
               start: new Date(startMillis),
               startFormatted: this._formatDate(new Date(startMillis), options.timeFormat),
               end: new Date(endMillis),
               endFormatted: this._formatDate(new Date(endMillis), options.timeFormat)
            };
            startMillis = endMillis;
         }
         return times;
      },

      formatDate : function(date, format) {
         if (format) {
            return this._formatDate(date, format);
         } else {
            return this._formatDate(date, this.options.dateFormat);
         }
      },

      formatTime : function(date, format) {
         if (format) {
            return this._formatDate(date, format);
         } else {
            return this._formatDate(date, this.options.timeFormat);
         }
      },





/*
      getData : function(key) {
         return this._getData(key);
      },
      */

      /*********************
       * private functions *
       *********************/


      _setOption: function(key, value) {
         var self = this;
         if(self.options[key] != value) {

            // this could be made more efficient at some stage by caching the
            // events array locally in a store but this should be done in conjunction
            // with a proper binding model.

            var currentEvents = $.map(self.element.find(".wc-cal-event"), function() {
               return $(this).data("calEvent");
            });

            var newOptions = {};
            newOptions[key] = value;
            self._renderEvents({events:currentEvents, options: newOptions}, self.element.find(".wc-day-column-inner"))
        }

	   },
      

      // compute dynamic options based on other config values
      _computeOptions : function() {

         var options = this.options;

         if (options.businessHours.limitDisplay) {
            options.timeslotsPerDay = options.timeslotsPerHour * (options.businessHours.end - options.businessHours.start);
            options.millisToDisplay = (options.businessHours.end - options.businessHours.start) * 60 * 60 * 1000;
            options.millisPerTimeslot = options.millisToDisplay / options.timeslotsPerDay;
         } else {
            options.timeslotsPerDay = options.timeslotsPerHour * 24;
            options.millisToDisplay = MILLIS_IN_DAY;
            options.millisPerTimeslot = MILLIS_IN_DAY / options.timeslotsPerDay;
         }
      },

      /*
       * Resize the calendar scrollable height based on the provided function in options.
       */
      _resizeCalendar : function () {

         var options = this.options;
         if (options && $.isFunction(options.height)) {
            var calendarHeight = options.height(this.element);
            var headerHeight = this.element.find(".wc-header").outerHeight();
            var navHeight = this.element.find(".wc-nav").outerHeight();
            this.element.find(".wc-scrollable-grid").height(calendarHeight - navHeight - headerHeight);
         }
      },

      /*
       * configure calendar interaction events that are able to use event
       * delegation for greater efficiency
       */
      _setupEventDelegation : function() {
         var self = this;
         var options = this.options;
         this.element.click(function(event) {
            var $target = $(event.target);
            if ($target.data("preventClick")) {
               return;
            }
            if ($target.hasClass("wc-cal-event")) {
               options.eventClick($target.data("calEvent"), $target, event);
            } else if ($target.parent().hasClass("wc-cal-event")) {
               options.eventClick($target.parent().data("calEvent"), $target.parent(), event);
            }
         }).mouseover(function(event) {
            var $target = $(event.target);

            if (self._isDraggingOrResizing($target)) {
               return;
            }

            if ($target.hasClass("wc-cal-event")) {
               options.eventMouseover($target.data("calEvent"), $target, event);
            }
         }).mouseout(function(event) {
            var $target = $(event.target);
            if (self._isDraggingOrResizing($target)) {
               return;
            }
            if ($target.hasClass("wc-cal-event")) {
               if ($target.data("sizing")) return;
               options.eventMouseout($target.data("calEvent"), $target, event);

            }
         });
      },

      /*
       * check if a ui draggable or resizable is currently being dragged or resized
       */
      _isDraggingOrResizing : function ($target) {
         return $target.hasClass("ui-draggable-dragging") || $target.hasClass("ui-resizable-resizing");
      },

      /*
       * Render the main calendar layout
       */
      _renderCalendar : function() {

         var $calendarContainer, calendarNavHtml, calendarHeaderHtml, calendarBodyHtml, $weekDayColumns;
         var self = this;
         var options = this.options;

         $calendarContainer = $("<div class=\"wc-container\">").appendTo(self.element);

         if (options.buttons) {
            calendarNavHtml = "<div class=\"wc-nav\">\
                    <button class=\"wc-today\">" + options.buttonText.today + "</button>\
                    <button class=\"wc-prev\">" + options.buttonText.lastWeek + "</button>\
                    <button class=\"wc-next\">" + options.buttonText.nextWeek + "</button>\
                    </div>";

            $(calendarNavHtml).appendTo($calendarContainer);

            $calendarContainer.find(".wc-nav .wc-today").click(function() {
               self.element.weekCalendar("today");
               return false;
            });

            $calendarContainer.find(".wc-nav .wc-prev").click(function() {
               self.element.weekCalendar("prevWeek");
               return false;
            });

            $calendarContainer.find(".wc-nav .wc-next").click(function() {
               self.element.weekCalendar("nextWeek");
               return false;
            });

         }

         //render calendar header
         calendarHeaderHtml = "<table class=\"wc-header\"><tbody><tr><td class=\"wc-time-column-header\"></td>";
         for (var i = 1; i <= options.daysToShow; i++) {
            calendarHeaderHtml += "<td class=\"wc-day-column-header wc-day-" + i + "\"></td>";
         }
         calendarHeaderHtml += "<td class=\"wc-scrollbar-shim\"></td></tr></tbody></table>";

         //render calendar body
         calendarBodyHtml = "<div class=\"wc-scrollable-grid\">\
                <table class=\"wc-time-slots\">\
                <tbody>\
                <tr>\
                <td class=\"wc-grid-timeslot-header\"></td>\
                <td colspan=\"" + options.daysToShow + "\">\
                <div class=\"wc-time-slot-wrapper\">\
                <div class=\"wc-time-slots\">";

         var start = options.businessHours.limitDisplay ? options.businessHours.start : 0;
         var end = options.businessHours.limitDisplay ? options.businessHours.end : 24;

         for (var i = start; i < end; i++) {
            for (var j = 0; j < options.timeslotsPerHour - 1; j++) {
               calendarBodyHtml += "<div class=\"wc-time-slot\"></div>";
            }
            calendarBodyHtml += "<div class=\"wc-time-slot wc-hour-end\"></div>";
         }

         calendarBodyHtml += "</div></div></td></tr><tr><td class=\"wc-grid-timeslot-header\">";

         for (var i = start; i < end; i++) {

            var bhClass = (options.businessHours.start <= i && options.businessHours.end > i) ? "wc-business-hours" : "";
            calendarBodyHtml += "<div class=\"wc-hour-header " + bhClass + "\">"
            if (options.use24Hour) {
               calendarBodyHtml += "<div class=\"wc-time-header-cell\">" + self._24HourForIndex(i) + "</div>";
            } else {
               calendarBodyHtml += "<div class=\"wc-time-header-cell\">" + self._hourForIndex(i) + "<span class=\"wc-am-pm\">" + self._amOrPm(i) + "</span></div>";
            }
            calendarBodyHtml += "</div>";
         }

         calendarBodyHtml += "</td>";

         for (var i = 1; i <= options.daysToShow; i++) {
            calendarBodyHtml += "<td class=\"wc-day-column day-" + i + "\"><div class=\"wc-day-column-inner\"></div></td>"
         }

         calendarBodyHtml += "</tr></tbody></table></div>";

         //append all calendar parts to container
         $(calendarHeaderHtml + calendarBodyHtml).appendTo($calendarContainer);

         $weekDayColumns = $calendarContainer.find(".wc-day-column-inner");
         $weekDayColumns.each(function(i, val) {
            $(this).height(options.timeslotHeight * options.timeslotsPerDay);
            if (!options.readonly) {
               self._addDroppableToWeekDay($(this));
               self._setupEventCreationForWeekDay($(this));
            }
         });

         $calendarContainer.find(".wc-time-slot").height(options.timeslotHeight - 1); //account for border

         $calendarContainer.find(".wc-time-header-cell").css({
            height :  (options.timeslotHeight * options.timeslotsPerHour) - 11,
            padding: 5
         });


      },

      /*
       * setup mouse events for capturing new events
       */
      _setupEventCreationForWeekDay : function($weekDay) {
         var self = this;
         var options = this.options;
         $weekDay.mousedown(function(event) {
            var $target = $(event.target);
            if ($target.hasClass("wc-day-column-inner")) {

               var $newEvent = $("<div class=\"wc-cal-event wc-new-cal-event wc-new-cal-event-creating\"></div>");

               $newEvent.css({lineHeight: (options.timeslotHeight - 2) + "px", fontSize: (options.timeslotHeight / 2) + "px"});
               $target.append($newEvent);

               var columnOffset = $target.offset().top;
               var clickY = event.pageY - columnOffset;
               var clickYRounded = (clickY - (clickY % options.timeslotHeight)) / options.timeslotHeight;
               var topPosition = clickYRounded * options.timeslotHeight;
               $newEvent.css({top: topPosition});

               $target.bind("mousemove.newevent", function(event) {
                  $newEvent.show();
                  $newEvent.addClass("ui-resizable-resizing");
                  var height = Math.round(event.pageY - columnOffset - topPosition);
                  var remainder = height % options.timeslotHeight;
                  //snap to closest timeslot
                  if (remainder < (height / 2)) {
                     var useHeight = height - remainder;
                     $newEvent.css("height", useHeight < options.timeslotHeight ? options.timeslotHeight : useHeight);
                  } else {
                     $newEvent.css("height", height + (options.timeslotHeight - remainder));
                  }
               }).mouseup(function() {
                  $target.unbind("mousemove.newevent");
                  $newEvent.addClass("ui-corner-all");
               });
            }

         }).mouseup(function(event) {
            var $target = $(event.target);

            var $weekDay = $target.closest(".wc-day-column-inner");
            var $newEvent = $weekDay.find(".wc-new-cal-event-creating");

            if ($newEvent.length) {
               //if even created from a single click only, default height
               if (!$newEvent.hasClass("ui-resizable-resizing")) {
                  $newEvent.css({height: options.timeslotHeight * options.defaultEventLength}).show();
               }
               var top = parseInt($newEvent.css("top"));
               var eventDuration = self._getEventDurationFromPositionedEventElement($weekDay, $newEvent, top);

               $newEvent.remove();
               var newCalEvent = {start: eventDuration.start, end: eventDuration.end, title: options.newEventText};
               var $renderedCalEvent = self._renderEvent(newCalEvent, $weekDay);

               if (!options.allowCalEventOverlap) {
                  self._adjustForEventCollisions($weekDay, $renderedCalEvent, newCalEvent, newCalEvent);
                  self._positionEvent($weekDay, $renderedCalEvent);
               } else {
                  self._adjustOverlappingEvents($weekDay);
               }

               options.eventNew(eventDuration, $renderedCalEvent);
            }
         });
      },

      /*
       * load calendar events for the week based on the date provided
       */
      _loadCalEvents : function(dateWithinWeek) {

         var date, weekStartDate, endDate, $weekDayColumns;
         var self = this;



         var options = this.options;
         date = dateWithinWeek || options.date;
         weekStartDate = self._dateFirstDayOfWeek(date);

         weekEndDate = self._dateLastMilliOfWeek(date);

         options.calendarBeforeLoad(self.element);

         self.element.data("startDate", weekStartDate);
         self.element.data("endDate", weekEndDate);

         $weekDayColumns = self.element.find(".wc-day-column-inner");

         self._updateDayColumnHeader($weekDayColumns);

         //load events by chosen means
         if (typeof options.data == 'string') {
            if (options.loading) options.loading(true);
            var jsonOptions = {};
            jsonOptions[options.startParam || 'start'] = Math.round(weekStartDate.getTime() / 1000);
            jsonOptions[options.endParam || 'end'] = Math.round(weekEndDate.getTime() / 1000);
            $.getJSON(options.data, jsonOptions, function(data) {
               self._renderEvents(data, $weekDayColumns);
               if (options.loading) options.loading(false);
            });
         }
         else if ($.isFunction(options.data)) {
            options.data(weekStartDate, weekEndDate,
                  function(data) {
                     self._renderEvents(data, $weekDayColumns);
                  });
         }
         else if (options.data) {
               self._renderEvents(options.data, $weekDayColumns);
            }

         self._disableTextSelect($weekDayColumns);


      },

      /*
       * update the display of each day column header based on the calendar week
       */
      _updateDayColumnHeader : function ($weekDayColumns) {
         var self = this;
         var options = this.options;
         var currentDay = self._cloneDate(self.element.data("startDate"));

         self.element.find(".wc-header td.wc-day-column-header").each(function(i, val) {

            var dayName = options.useShortDayNames ? options.shortDays[currentDay.getDay()] : options.longDays[currentDay.getDay()];

            $(this).html(dayName + "<br/>" + self._formatDate(currentDay, options.dateFormat));
            if (self._isToday(currentDay)) {
               $(this).addClass("wc-today");
            } else {
               $(this).removeClass("wc-today");
            }
            currentDay = self._addDays(currentDay, 1);

         });

         currentDay = self._dateFirstDayOfWeek(self._cloneDate(self.element.data("startDate")));

         $weekDayColumns.each(function(i, val) {

            $(this).data("startDate", self._cloneDate(currentDay));
            $(this).data("endDate", new Date(currentDay.getTime() + (MILLIS_IN_DAY)));
            if (self._isToday(currentDay)) {
               $(this).parent().addClass("wc-today");
            } else {
               $(this).parent().removeClass("wc-today");
            }

            currentDay = self._addDays(currentDay, 1);
         });

      },

      /*
       * Render the events into the calendar
       */
      _renderEvents : function (data, $weekDayColumns) {

         this._clearCalendar();

         var self = this;
         var options = this.options;
         var eventsToRender;

         if ($.isArray(data)) {
            eventsToRender = self._cleanEvents(data);
         } else if (data.events) {
            eventsToRender = self._cleanEvents(data.events);
         }
          
         if (data.options) {

            var updateLayout = false;
            //update options
            $.each(data.options, function(key, value) {
               if (value !== options[key]) {
                  options[key] = value;
                  updateLayout = true;
               }
            });

            self._computeOptions();

            if (updateLayout) {
               self.element.empty();
               self._renderCalendar();
               $weekDayColumns = self.element.find(".wc-time-slots .wc-day-column-inner");
               self._updateDayColumnHeader($weekDayColumns);
               self._resizeCalendar();
            }

         }


         $.each(eventsToRender, function(i, calEvent) {

            var $weekDay = self._findWeekDayForEvent(calEvent, $weekDayColumns);

            if ($weekDay) {
               self._renderEvent(calEvent, $weekDay);
            }
         });

         $weekDayColumns.each(function() {
            self._adjustOverlappingEvents($(this));
         });

         options.calendarAfterLoad(self.element);

         if (!eventsToRender.length) {
            options.noEvents();
         }

      },

      /*
       * Render a specific event into the day provided. Assumes correct
       * day for calEvent date
       */
      _renderEvent: function (calEvent, $weekDay) {
         var self = this;
         var options = this.options;
         if (calEvent.start.getTime() > calEvent.end.getTime()) {
            return; // can't render a negative height
         }

         var eventClass, eventHtml, $calEvent, $modifiedEvent;

         eventClass = calEvent.id ? "wc-cal-event" : "wc-cal-event wc-new-cal-event";
         eventHtml = "<div class=\"" + eventClass + " ui-corner-all\">\
                <div class=\"wc-time ui-corner-all\"></div>\
                <div class=\"wc-title\"></div></div>";

         $calEvent = $(eventHtml);
         $modifiedEvent = options.eventRender(calEvent, $calEvent);
         $calEvent = $modifiedEvent ? $modifiedEvent.appendTo($weekDay) : $calEvent.appendTo($weekDay);
         $calEvent.css({lineHeight: (options.timeslotHeight - 2) + "px", fontSize: (options.timeslotHeight / 2) + "px"});

         self._refreshEventDetails(calEvent, $calEvent);
         self._positionEvent($weekDay, $calEvent);
         $calEvent.show();

         if (!options.readonly && options.resizable(calEvent, $calEvent)) {
            self._addResizableToCalEvent(calEvent, $calEvent, $weekDay)
         }
         if (!options.readonly && options.draggable(calEvent, $calEvent)) {
            self._addDraggableToCalEvent(calEvent, $calEvent);
         }

         options.eventAfterRender(calEvent, $calEvent);

         return $calEvent;

      },

      _adjustOverlappingEvents : function($weekDay) {
         var self = this;
         if (self.options.allowCalEventOverlap) {
            var groupsList = self._groupOverlappingEventElements($weekDay);
            $.each(groupsList, function() {
               var curGroups = this;
               $.each(curGroups, function(groupIndex) {
                  var curGroup = this;

                  // do we want events to be displayed as overlapping
                  if (self.options.overlapEventsSeparate) {
                     var newWidth = 100 / curGroups.length;
                     var newLeft = groupIndex * newWidth;
                  } else {
                     // TODO what happens when the group has more than 10 elements
                     var newWidth = 100 - ( (curGroups.length - 1) * 10 );
                     var newLeft = groupIndex * 10;
                  }
                  $.each(curGroup, function() {
                     // bring mouseovered event to the front
                     if (!self.options.overlapEventsSeparate) {
                        $(this).bind("mouseover.z-index", function() {
                           var $elem = $(this);
                           $.each(curGroup, function() {
                              $(this).css({"z-index":  "1"});
                           });
                           $elem.css({"z-index": "3"});
                        });
                     }
                     $(this).css({width: newWidth + "%", left:newLeft + "%", right: 0});
                  });
               });
            });
         }
      },


      /*
       * Find groups of overlapping events
       */
      _groupOverlappingEventElements : function($weekDay) {
         var $events = $weekDay.find(".wc-cal-event:visible");
         var sortedEvents = $events.sort(function(a, b) {
            return $(a).data("calEvent").start.getTime() - $(b).data("calEvent").start.getTime();
         });

         var lastEndTime = new Date(0, 0, 0);
         var groups = [];
         var curGroups = [];
         var $curEvent;
         $.each(sortedEvents, function() {
            $curEvent = $(this);
            //checks, if the current group list is not empty, if the overlapping is finished
            if (curGroups.length > 0) {
               if (lastEndTime.getTime() <= $curEvent.data("calEvent").start.getTime()) {
                  //finishes the current group list by adding it to the resulting list of groups and cleans it

                  groups.push(curGroups);
                  curGroups = [];
               }
            }

            //finds the first group to fill with the event
            for (var groupIndex = 0; groupIndex < curGroups.length; groupIndex++) {
               if (curGroups[groupIndex].length > 0) {
                  //checks if the event starts after the end of the last event of the group
                  if (curGroups[groupIndex][curGroups [groupIndex].length - 1].data("calEvent").end.getTime() <= $curEvent.data("calEvent").start.getTime()) {
                     curGroups[groupIndex].push($curEvent);
                     if (lastEndTime.getTime() < $curEvent.data("calEvent").end.getTime()) {
                        lastEndTime = $curEvent.data("calEvent").end;
                     }
                     return;
                  }
               }
            }
            //if not found, creates a new group
            curGroups.push([$curEvent]);
            if (lastEndTime.getTime() < $curEvent.data("calEvent").end.getTime()) {
               lastEndTime = $curEvent.data("calEvent").end;
            }
         });
         //adds the last groups in result
         if (curGroups.length > 0) {
            groups.push(curGroups);
         }
         return groups;
      },


      /*
       * find the weekday in the current calendar that the calEvent falls within
       */
      _findWeekDayForEvent : function(calEvent, $weekDayColumns) {

         var $weekDay;
         $weekDayColumns.each(function() {
            if ($(this).data("startDate").getTime() <= calEvent.start.getTime() && $(this).data("endDate").getTime() >= calEvent.end.getTime()) {
               $weekDay = $(this);
               return false;
            }
         });
         return $weekDay;
      },

      /*
       * update the events rendering in the calendar. Add if does not yet exist.
       */
      _updateEventInCalendar : function (calEvent) {
         var self = this;
         var options = this.options;
         self._cleanEvent(calEvent);

         if (calEvent.id) {
            self.element.find(".wc-cal-event").each(function() {
               if ($(this).data("calEvent").id === calEvent.id || $(this).hasClass("wc-new-cal-event")) {
                  $(this).remove();
                  return false;
               }
            });
         }

         var $weekDay = self._findWeekDayForEvent(calEvent, self.element.find(".wc-time-slots .wc-day-column-inner"));
         if ($weekDay) {
            var $calEvent = self._renderEvent(calEvent, $weekDay);
            self._adjustForEventCollisions($weekDay, $calEvent, calEvent, calEvent);
            self._refreshEventDetails(calEvent, $calEvent);
            self._positionEvent($weekDay, $calEvent);
            self._adjustOverlappingEvents($weekDay);
         }
      },

      /*
       * Position the event element within the weekday based on it's start / end dates.
       */
      _positionEvent : function($weekDay, $calEvent) {
         var options = this.options;
         var calEvent = $calEvent.data("calEvent");
         var pxPerMillis = $weekDay.height() / options.millisToDisplay;
         var firstHourDisplayed = options.businessHours.limitDisplay ? options.businessHours.start : 0;
         var startMillis = calEvent.start.getTime() - new Date(calEvent.start.getFullYear(), calEvent.start.getMonth(), calEvent.start.getDate(), firstHourDisplayed).getTime();
         var eventMillis = calEvent.end.getTime() - calEvent.start.getTime();
         var pxTop = pxPerMillis * startMillis;
         var pxHeight = pxPerMillis * eventMillis;
         $calEvent.css({top: pxTop, height: pxHeight});
      },

      /*
       * Determine the actual start and end times of a calevent based on it's
       * relative position within the weekday column and the starting hour of the
       * displayed calendar.
       */
      _getEventDurationFromPositionedEventElement : function($weekDay, $calEvent, top) {
         var options = this.options;
         var startOffsetMillis = options.businessHours.limitDisplay ? options.businessHours.start * 60 * 60 * 1000 : 0;
         var start = new Date($weekDay.data("startDate").getTime() + startOffsetMillis + Math.round(top / options.timeslotHeight) * options.millisPerTimeslot);
         var end = new Date(start.getTime() + ($calEvent.height() / options.timeslotHeight) * options.millisPerTimeslot);
         return {start: start, end: end};
      },

      /*
       * If the calendar does not allow event overlap, adjust the start or end date if necessary to
       * avoid overlapping of events. Typically, shortens the resized / dropped event to it's max possible
       * duration  based on the overlap. If no satisfactory adjustment can be made, the event is reverted to
       * it's original location.
       */
      _adjustForEventCollisions : function($weekDay, $calEvent, newCalEvent, oldCalEvent, maintainEventDuration) {
         var options = this.options;

         if (options.allowCalEventOverlap) {
            return;
         }
         var adjustedStart, adjustedEnd;
         var self = this;

         $weekDay.find(".wc-cal-event").not($calEvent).each(function() {
            var currentCalEvent = $(this).data("calEvent");

            //has been dropped onto existing event overlapping the end time
            if (newCalEvent.start.getTime() < currentCalEvent.end.getTime()
                  && newCalEvent.end.getTime() >= currentCalEvent.end.getTime()) {

               adjustedStart = currentCalEvent.end;
            }


            //has been dropped onto existing event overlapping the start time
            if (newCalEvent.end.getTime() > currentCalEvent.start.getTime()
                  && newCalEvent.start.getTime() <= currentCalEvent.start.getTime()) {

               adjustedEnd = currentCalEvent.start;
            }
            //has been dropped inside existing event with same or larger duration
            if (oldCalEvent.resizable == false || (newCalEvent.end.getTime() <= currentCalEvent.end.getTime()
                  && newCalEvent.start.getTime() >= currentCalEvent.start.getTime())) {

               adjustedStart = oldCalEvent.start;
               adjustedEnd = oldCalEvent.end;
               return false;
            }

         });


         newCalEvent.start = adjustedStart || newCalEvent.start;

         if (adjustedStart && maintainEventDuration) {
            newCalEvent.end = new Date(adjustedStart.getTime() + (oldCalEvent.end.getTime() - oldCalEvent.start.getTime()));
            self._adjustForEventCollisions($weekDay, $calEvent, newCalEvent, oldCalEvent);
         } else {
            newCalEvent.end = adjustedEnd || newCalEvent.end;
         }


         //reset if new cal event has been forced to zero size
         if (newCalEvent.start.getTime() >= newCalEvent.end.getTime()) {
            newCalEvent.start = oldCalEvent.start;
            newCalEvent.end = oldCalEvent.end;
         }

         $calEvent.data("calEvent", newCalEvent);
      },

      /*
       * Add draggable capabilities to an event
       */
      _addDraggableToCalEvent : function(calEvent, $calEvent) {
         var self = this;
         var options = this.options;
         var $weekDay = self._findWeekDayForEvent(calEvent, self.element.find(".wc-time-slots .wc-day-column-inner"));
         $calEvent.draggable({
            handle : ".wc-time",
            containment: ".wc-scrollable-grid",
            revert: 'valid',
            opacity: 0.5,
            grid : [$calEvent.outerWidth() + 1, options.timeslotHeight ],
            start : function(event, ui) {
               var $calEvent = ui.draggable;
               options.eventDrag(calEvent, $calEvent);
            }
         });

      },

      /*
       * Add droppable capabilites to weekdays to allow dropping of calEvents only
       */
      _addDroppableToWeekDay : function($weekDay) {
         var self = this;
         var options = this.options;
         $weekDay.droppable({
            accept: ".wc-cal-event",
            drop: function(event, ui) {
               var $calEvent = ui.draggable;
               var top = Math.round(parseInt(ui.position.top));
               var eventDuration = self._getEventDurationFromPositionedEventElement($weekDay, $calEvent, top);
               var calEvent = $calEvent.data("calEvent");

                

               var newCalEvent = $.extend(true, {}, calEvent, {start: eventDuration.start, end: eventDuration.end});
               self._adjustForEventCollisions($weekDay, $calEvent, newCalEvent, calEvent, true);
               var $weekDayColumns = self.element.find(".wc-day-column-inner");

                //trigger drop callback
               options.eventDrop(newCalEvent, calEvent, $newEvent);

               var $newEvent = self._renderEvent(newCalEvent, self._findWeekDayForEvent(newCalEvent, $weekDayColumns));
               $calEvent.hide();
              
               $calEvent.data("preventClick", true);

               var $weekDayOld = self._findWeekDayForEvent($calEvent.data("calEvent"), self.element.find(".wc-time-slots .wc-day-column-inner"));

               if ($weekDayOld.data("startDate") != $weekDay.data("startDate")) {
                  self._adjustOverlappingEvents($weekDayOld);
               }
               self._adjustOverlappingEvents($weekDay);

               setTimeout(function() {
                  $calEvent.remove();
               }, 1000);

            }
         });
      },

      /*
       * Add resizable capabilities to a calEvent
       */
      _addResizableToCalEvent : function(calEvent, $calEvent, $weekDay) {
         var self = this;
         var options = this.options;
         $calEvent.resizable({
            grid: options.timeslotHeight,
            containment : $weekDay,
            handles: "s",
            minHeight: options.timeslotHeight,
            stop :function(event, ui) {
               var $calEvent = ui.element;
               var newEnd = new Date($calEvent.data("calEvent").start.getTime() + ($calEvent.height() / options.timeslotHeight) * options.millisPerTimeslot);
               var newCalEvent = $.extend(true, {}, calEvent, {start: calEvent.start, end: newEnd});
               self._adjustForEventCollisions($weekDay, $calEvent, newCalEvent, calEvent);

               self._refreshEventDetails(newCalEvent, $calEvent);
               self._positionEvent($weekDay, $calEvent);
               self._adjustOverlappingEvents($weekDay);
               //trigger resize callback
               options.eventResize(newCalEvent, calEvent, $calEvent);
               $calEvent.data("preventClick", true);
               setTimeout(function() {
                  $calEvent.removeData("preventClick");
               }, 500);
            }
         });
      },

      /*
       * Refresh the displayed details of a calEvent in the calendar
       */
      _refreshEventDetails : function(calEvent, $calEvent) {
         var self = this;
         var options = this.options;
         var one_hour = 3600000;
         var displayTitleWithTime = calEvent.end.getTime()-calEvent.start.getTime() <= (one_hour/options.timeslotsPerHour);
         if (displayTitleWithTime){
           $calEvent.find(".wc-time").html(self._formatDate(calEvent.start, options.timeFormat) + ": " + calEvent.title);
         }
         else {
           $calEvent.find(".wc-time").html(self._formatDate(calEvent.start, options.timeFormat) + options.timeSeparator + self._formatDate(calEvent.end, options.timeFormat));
         }
         $calEvent.find(".wc-title").html(calEvent.title);
         $calEvent.data("calEvent", calEvent);
      },

      /*
       * Clear all cal events from the calendar
       */
      _clearCalendar : function() {
         this.element.find(".wc-day-column-inner div").remove();
      },

      /*
       * Scroll the calendar to a specific hour
       */
      _scrollToHour : function(hour) {
         var self = this;
         var options = this.options;
         var $scrollable = this.element.find(".wc-scrollable-grid");
         var slot = hour;
         if (self.options.businessHours.limitDisplay) {
            if (hour <= self.options.businessHours.start) {
               slot = 0;
            } else if (hour > self.options.businessHours.end) {
               slot = self.options.businessHours.end -
               self.options.businessHours.start - 1;
            } else {
               slot = hour - self.options.businessHours.start;
            }
            
         }

         var $target = this.element.find(".wc-grid-timeslot-header .wc-hour-header:eq(" + slot + ")");

         $scrollable.animate({scrollTop: 0}, 0, function() {
            var targetOffset = $target.offset().top;
            var scroll = targetOffset - $scrollable.offset().top - $target.outerHeight();
            $scrollable.animate({scrollTop: scroll}, options.scrollToHourMillis);
         });
      },

      /*
       * find the hour (12 hour day) for a given hour index
       */
      _hourForIndex : function(index) {
         if (index === 0) { //midnight
            return 12;
         } else if (index < 13) { //am
            return index;
         } else { //pm
            return index - 12;
         }
      },

      _24HourForIndex : function(index) {
         if (index === 0) { //midnight
            return "00:00";
         } else if (index < 10) {
            return "0" + index + ":00";
         } else {
            return index + ":00";
         }
      },

      _amOrPm : function (hourOfDay) {
         return hourOfDay < 12 ? "AM" : "PM";
      },

      _isToday : function(date) {
         var clonedDate = this._cloneDate(date);
         this._clearTime(clonedDate);
         var today = new Date();
         this._clearTime(today);
         return today.getTime() === clonedDate.getTime();
      },

      /*
       * Clean events to ensure correct format
       */
      _cleanEvents : function(events) {
         var self = this;
         $.each(events, function(i, event) {
            self._cleanEvent(event);
         });
         return events;
      },

      /*
       * Clean specific event
       */
      _cleanEvent : function (event) {
         if (event.date) {
            event.start = event.date;
         }
         event.start = this._cleanDate(event.start);
         event.end = this._cleanDate(event.end);
         if (!event.end) {
            event.end = this._addDays(this._cloneDate(event.start), 1);
         }
      },

      /*
       * Disable text selection of the elements in different browsers
       */
      _disableTextSelect : function($elements) {
         $elements.each(function() {
            if ($.browser.mozilla) {//Firefox
               $(this).css('MozUserSelect', 'none');
            } else if ($.browser.msie) {//IE
               $(this).bind('selectstart', function() {
                  return false;
               });
            } else {//Opera, etc.
               $(this).mousedown(function() {
                  return false;
               });
            }
         });
      },

      /*
       * returns the date on the first millisecond of the week
       */

      _dateFirstDayOfWeek : function(date) {
         var self = this;
         var midnightCurrentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
         var adjustedDate = new Date(midnightCurrentDate);
         adjustedDate.setDate(adjustedDate.getDate() - self._getAdjustedDayIndex(midnightCurrentDate));

         return adjustedDate;

      },

       /*
       * returns the date on the first millisecond of the last day of the week
       */
       _dateLastDayOfWeek : function(date) {


         var self = this;
         var midnightCurrentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
         var adjustedDate = new Date(midnightCurrentDate);
         adjustedDate.setDate(adjustedDate.getDate() + (6 - this._getAdjustedDayIndex(midnightCurrentDate)));

         return adjustedDate;
          
       },

      /*
       * gets the index of the current day adjusted based on options
       */
      _getAdjustedDayIndex : function(date) {

         var midnightCurrentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
         var currentDayOfStandardWeek = midnightCurrentDate.getDay();
         var days = [0,1,2,3,4,5,6];
         this._rotate(days, this.options.firstDayOfWeek);
         return days[currentDayOfStandardWeek];
      },

      /*
       * returns the date on the last millisecond of the week
       */
      _dateLastMilliOfWeek : function(date) {
         var lastDayOfWeek = this._dateLastDayOfWeek(date);
         return new Date(lastDayOfWeek.getTime() + (MILLIS_IN_DAY));

      },

      /*
       * Clear the time components of a date leaving the date
       * of the first milli of day
       */
      _clearTime : function(d) {
         d.setHours(0);
         d.setMinutes(0);
         d.setSeconds(0);
         d.setMilliseconds(0);
         return d;
      },

      /*
       * add specific number of days to date
       */
      _addDays : function(d, n, keepTime) {
         d.setDate(d.getDate() + n);
         if (keepTime) {
            return d;
         }
         return this._clearTime(d);
      },

      /*
       * Rotate an array by specified number of places.
       */
      _rotate : function(a /*array*/, p /* integer, positive integer rotate to the right, negative to the left... */) {
         for (var l = a.length, p = (Math.abs(p) >= l && (p %= l),p < 0 && (p += l),p), i, x; p; p = (Math.ceil(l / p) - 1) * p - l + (l = p)) {
            for (i = l; i > p; x = a[--i],a[i] = a[i - p],a[i - p] = x);
         }
         return a;
      },

      _cloneDate : function(d) {
         return new Date(d.getTime());
      },

      /*
       * return a date for different representations
       */
      _cleanDate : function(d) {
         if (typeof d == 'string') {
            return $.weekCalendar.parseISO8601(d, true) || Date.parse(d) || new Date(parseInt(d));
         }
         if (typeof d == 'number') {
            return new Date(d);
         }
         return d;
      },

      /*
       * date formatting is adapted from
       * http://jacwright.com/projects/javascript/date_format
       */
      _formatDate : function(date, format) {
         var options = this.options;
         var returnStr = '';
         for (var i = 0; i < format.length; i++) {
            var curChar = format.charAt(i);
            if ($.isFunction(this._replaceChars[curChar])) {
	           var res = this._replaceChars[curChar](date, options);

	           if (res === '00' && options.alwaysDisplayTimeMinutes === false) {
		          //remove previous character
		          returnStr = returnStr.slice(0, -1);
		        } else {
                 
	               returnStr += res;
	           }
            } else {
               returnStr += curChar;
            }
         }

         return returnStr;
      },

      _replaceChars : {

         // Day
         d: function(date) {
            return (date.getDate() < 10 ? '0' : '') + date.getDate();
         },
         D: function(date, options) {
            return options.shortDays[date.getDay()];
         },
         j: function(date) {
            return date.getDate();
         },
         l: function(date, options) {
            return options.longDays[date.getDay()];
         },
         N: function(date) {
            return date.getDay() + 1;
         },
         S: function(date) {
            return (date.getDate() % 10 == 1 && date.getDate() != 11 ? 'st' : (date.getDate() % 10 == 2 && date.getDate() != 12 ? 'nd' : (date.getDate() % 10 == 3 && date.getDate() != 13 ? 'rd' : 'th')));
         },
         w: function(date) {
            return date.getDay();
         },
         z: function(date) {
            return "Not Yet Supported";
         },
         // Week
         W: function(date) {
            return "Not Yet Supported";
         },
         // Month
         F: function(date, options) {
            return options.longMonths[date.getMonth()];
         },
         m: function(date) {
            return (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1);
         },
         M: function(date, options) {
            return options.shortMonths[date.getMonth()];
         },
         n: function(date) {
            return date.getMonth() + 1;
         },
         t: function(date) {
            return "Not Yet Supported";
         },
         // Year
         L: function(date) {
            return "Not Yet Supported";
         },
         o: function(date) {
            return "Not Supported";
         },
         Y: function(date) {
            return date.getFullYear();
         },
         y: function(date) {
            return ('' + date.getFullYear()).substr(2);
         },
         // Time
         a: function(date) {
            return date.getHours() < 12 ? 'am' : 'pm';
         },
         A: function(date) {
            return date.getHours() < 12 ? 'AM' : 'PM';
         },
         B: function(date) {
            return "Not Yet Supported";
         },
         g: function(date) {
            return date.getHours() % 12 || 12;
         },
         G: function(date) {
            return date.getHours();
         },
         h: function(date) {
            return ((date.getHours() % 12 || 12) < 10 ? '0' : '') + (date.getHours() % 12 || 12);
         },
         H: function(date) {
            return (date.getHours() < 10 ? '0' : '') + date.getHours();
         },
         i: function(date) {
            return (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
         },
         s: function(date) {
            return (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
         },
         // Timezone
         e: function(date) {
            return "Not Yet Supported";
         },
         I: function(date) {
            return "Not Supported";
         },
         O: function(date) {
            return (date.getTimezoneOffset() < 0 ? '-' : '+') + (date.getTimezoneOffset() / 60 < 10 ? '0' : '') + (date.getTimezoneOffset() / 60) + '00';
         },
         T: function(date) {
            return "Not Yet Supported";
         },
         Z: function(date) {
            return date.getTimezoneOffset() * 60;
         },
         // Full Date/Time
         c: function(date) {
            return "Not Yet Supported";
         },
         r: function(date) {
            return date.toString();
         },
         U: function(date) {
            return date.getTime() / 1000;
         }
      }

   });

   $.extend($.ui.weekCalendar, {
      version: '1.2.2-pre'
   });

   var MILLIS_IN_DAY = 86400000;
   var MILLIS_IN_WEEK = MILLIS_IN_DAY * 7;

   $.weekCalendar = function() {
      return {
         parseISO8601 : function(s, ignoreTimezone) {

            // derived from http://delete.me.uk/2005/03/iso8601.html
            var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
                         "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
                         "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
            var d = s.match(new RegExp(regexp));
            if (!d) return null;
            var offset = 0;
            var date = new Date(d[1], 0, 1);
            if (d[3]) {
               date.setMonth(d[3] - 1);
            }
            if (d[5]) {
               date.setDate(d[5]);
            }
            if (d[7]) {
               date.setHours(d[7]);
            }
            if (d[8]) {
               date.setMinutes(d[8]);
            }
            if (d[10]) {
               date.setSeconds(d[10]);
            }
            if (d[12]) {
               date.setMilliseconds(Number("0." + d[12]) * 1000);
            }
            if (!ignoreTimezone) {
               if (d[14]) {
                  offset = (Number(d[16]) * 60) + Number(d[17]);
                  offset *= ((d[15] == '-') ? 1 : -1);
               }
               offset -= date.getTimezoneOffset();
            }
            return new Date(Number(date) + (offset * 60 * 1000));
         }
      };
   }();


})(jQuery);


/*!
* Title:  jMonthCalendar 1.3.2-beta2
* Dependencies:  jQuery 1.3.0 +
* Author:  Kyle LeNeau
* Email:  kyle.leneau@gmail.com
* Project Hompage:  http://www.bytecyclist.com/projects/jmonthcalendar
* Source:  http://code.google.com/p/jmonthcalendar
*
*/
(function($) {
	var _boxes = [];
	var _eventObj = {};
	
	var _workingDate = null;
	var _daysInMonth = 0;
	var _firstOfMonth = null;
	var _lastOfMonth = null;
	var _gridOffset = 0;
	var _totalDates = 0;
	var _gridRows = 0;
	var _totalBoxes = 0;
	var _dateRange = { startDate: null, endDate: null };
	
	
	var cEvents = [];
	var def = {
			containerId: "#jMonthCalendar",
			headerHeight: 50,
			firstDayOfWeek: 0,
			calendarStartDate:new Date(),
			dragableEvents: true,
			dragHoverClass: 'DateBoxOver',
			navLinks: {
				enableToday: true,
				enableNextYear: true,
				enablePrevYear: true,
				p:'&lsaquo; Prev', 
				n:'Next &rsaquo;', 
				t:'Today',
				showMore: 'Show More'
			},
			onMonthChanging: function() {},
			onMonthChanged: function() {},
			onEventLinkClick: function() {},
			onEventBlockClick: function() {},
			onEventBlockOver: function() {},
			onEventBlockOut: function() {},
			onDayLinkClick: function() {},
			onDayCellClick: function() {},
			onDayCellDblClick: function() {},
			onEventDropped: function() {},
			onShowMoreClick: function() {}
		};
		
	$.jMonthCalendar = $.J = function() {};
	
	var _getJSONDate = function(dateStr) {
		//check conditions for different types of accepted dates
		var tDt, k;
		if (typeof dateStr == "string") {
			
			//  "2008-12-28T00:00:00.0000000"
			var isoRegPlus = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2}).([0-9]{7})$/;
			
			//  "2008-12-28T00:00:00"
			var isoReg = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})$/;
		
			//"2008-12-28"
			var yyyyMMdd = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
			
			//  "new Date(2009, 1, 1)"
			//  "new Date(1230444000000)
			var newReg = /^new/;
			
			//  "\/Date(1234418400000-0600)\/"
			var stdReg = /^\\\/Date\(([0-9]{13})-([0-9]{4})\)\\\/$/;
			
			if (k = dateStr.match(isoRegPlus)) {
				return new Date(k[1],k[2]-1,k[3],k[4],k[5],k[6]);
			} else if (k = dateStr.match(isoReg)) {
				return new Date(k[1],k[2]-1,k[3],k[4],k[5],k[6]);
			} else if (k = dateStr.match(yyyyMMdd)) {
				return new Date(k[1],k[2]-1,k[3]);
			}
			
			if (k = dateStr.match(stdReg)) {
				return new Date(k[1]);
			}
			
			if (k = dateStr.match(newReg)) {
				return eval('(' + dateStr + ')');
			}
			
			return tDt;
		}
	};
	
	//This function will clean the JSON array, primaryly the dates and put the correct ones in the object.  Intended to alwasy be called on event functions.
	var _filterEventCollection = function() {
		if (cEvents && cEvents.length > 0) {
			var multi = [];
			var single = [];
			
			//Update and parse all the dates
			$.each(cEvents, function(){
				var ev = this;
				//Date Parse the JSON to create a new Date to work with here				
				if(ev.StartDateTime) {
					if (typeof ev.StartDateTime == 'object' && ev.StartDateTime.getDate) { this.StartDateTime = ev.StartDateTime; }
					if (typeof ev.StartDateTime == 'string' && ev.StartDateTime.split) { this.StartDateTime = _getJSONDate(ev.StartDateTime); }
				} else if(ev.Date) { // DEPRECATED
					if (typeof ev.Date == 'object' && ev.Date.getDate) { this.StartDateTime = ev.Date; }
					if (typeof ev.Date == 'string' && ev.Date.split) { this.StartDateTime = _getJSONDate(ev.Date); }
				} else {
					return;  //no start date, or legacy date. no event.
				}
				
				if(ev.EndDateTime) {
					if (typeof ev.EndDateTime == 'object' && ev.EndDateTime.getDate) { this.EndDateTime = ev.EndDateTime; }
					if (typeof ev.EndDateTime == 'string' && ev.EndDateTime.split) { this.EndDateTime = _getJSONDate(ev.EndDateTime); }
				} else {
					this.EndDateTime = this.StartDateTime.clone();
				}
				
				if (this.StartDateTime.clone().clearTime().compareTo(this.EndDateTime.clone().clearTime()) == 0) {
					single.push(this);
				} else if (this.StartDateTime.clone().clearTime().compareTo(this.EndDateTime.clone().clearTime()) == -1) {
					multi.push(this);
				}
			});
			
			multi.sort(_eventSort);
			single.sort(_eventSort);
			cEvents = [];
			$.merge(cEvents, multi);
			$.merge(cEvents, single);
		}
	};
	
	var _eventSort = function(a, b) {
		return a.StartDateTime.compareTo(b.StartDateTime);
	};
	
	var _clearBoxes = function() {
		_clearBoxEvents();
		_boxes = [];
	};
	
	var _clearBoxEvents = function() {
		for (var i = 0; i < _boxes.length; i++) {
			_boxes[i].clear();
		}
		_eventObj = {};
	};
	
	var _initDates = function(dateIn) {
		var today = def.calendarStartDate;
		if(dateIn == undefined) {
			_workingDate = new Date(today.getFullYear(), today.getMonth(), 1);
		} else {
			_workingDate = dateIn;
			_workingDate.setDate(1);
		}
		
		_daysInMonth = _workingDate.getDaysInMonth();
		_firstOfMonth = _workingDate.clone().moveToFirstDayOfMonth();
		_lastOfMonth = _workingDate.clone().moveToLastDayOfMonth();
		_gridOffset = _firstOfMonth.getDay() - def.firstDayOfWeek;
		_totalDates = _gridOffset + _daysInMonth;
		_gridRows = Math.ceil(_totalDates / 7);
		_totalBoxes = _gridRows * 7;
		
		_dateRange.startDate = _firstOfMonth.clone().addDays((-1) * _gridOffset);
		_dateRange.endDate = _lastOfMonth.clone().addDays(_totalBoxes - (_daysInMonth + _gridOffset));
	};
	
	var _initHeaders = function() {
		// Create Previous Month link for later
		var prevMonth = _workingDate.clone().addMonths(-1);
		var prevMLink = $('<div class="MonthNavPrev"><a class="link-prev">'+ def.navLinks.p +'</a></div>').click(function() {
			$.J.ChangeMonth(prevMonth);
			return false;
		});
		
		//Create Next Month link for later
		var nextMonth = _workingDate.clone().addMonths(1);
		var nextMLink = $('<div class="MonthNavNext"><a class="link-next">'+ def.navLinks.n +'</a></div>').click(function() {
			$.J.ChangeMonth(nextMonth);
			return false;
		});
		
		//Create Previous Year link for later
		var prevYear = _workingDate.clone().addYears(-1);
		var prevYLink;
		if(def.navLinks.enablePrevYear) {
			prevYLink = $('<div class="YearNavPrev"><a>'+ prevYear.getFullYear() +'</a></div>').click(function() {
				$.J.ChangeMonth(prevYear);
				return false;
			});
		}
		
		//Create Next Year link for later
		var nextYear = _workingDate.clone().addYears(1);
		var nextYLink;
		if(def.navLinks.enableNextYear) {
			nextYLink = $('<div class="YearNavNext"><a>'+ nextYear.getFullYear() +'</a></div>').click(function() {
				$.J.ChangeMonth(nextYear);
				return false;
			});
		}
		
		var todayLink;
		if(def.navLinks.enableToday) {
			//Create Today link for later
			todayLink = $('<div class="TodayLink"><a class="link-today">'+ def.navLinks.t +'</a></div>').click(function() {
				$.J.ChangeMonth(new Date());
				return false;
			});
		}

		//Build up the Header first,  Navigation
		var navRow = $('<tr><td colspan="7"><div class="FormHeader MonthNavigation"></div></td></tr>');
		var navHead = $('.MonthNavigation', navRow);
		
		navHead.append(prevMLink, nextMLink);
		if(def.navLinks.enableToday) { navHead.append(todayLink); }

		navHead.append($('<div class="MonthName"></div>').append(Date.CultureInfo.monthNames[_workingDate.getMonth()] + " " + _workingDate.getFullYear()));
		
		if(def.navLinks.enablePrevYear) { navHead.append(prevYLink); }
		if(def.navLinks.enableNextYear) { navHead.append(nextYLink); }
		
		
		//  Days
		var headRow = $("<tr></tr>");		
		for (var i = def.firstDayOfWeek; i < def.firstDayOfWeek+7; i++) {
			var weekday = i % 7;
			var wordday = Date.CultureInfo.dayNames[weekday];
			headRow.append('<th title="' + wordday + '" class="DateHeader' + (weekday == 0 || weekday == 6 ? ' Weekend' : '') + '"><span>' + wordday + '</span></th>');
		}
		
		headRow = $("<thead id=\"CalendarHead\"></thead>").css({ "height" : def.headerHeight + "px" }).append(headRow);
		headRow = headRow.prepend(navRow);
		return headRow;
	};
	
	
	
	$.J.DrawCalendar = function(dateIn){
		var now = new Date();
		now.clearTime();
		
		var today = def.calendarStartDate;
		
		_clearBoxes();
		
		_initDates(dateIn);
		var headerRow = _initHeaders();
		
		//properties
		var isCurrentMonth = (_workingDate.getMonth() == today.getMonth() && _workingDate.getFullYear() == today.getFullYear());
		var containerHeight = $(def.containerId).outerHeight();
		var rowHeight = (containerHeight - def.headerHeight) / _gridRows;
		var row = null;

		//Build up the Body
		var tBody = $('<tbody id="CalendarBody"></tbody>');
		
		for (var i = 0; i < _totalBoxes; i++) {
			var currentDate = _dateRange.startDate.clone().addDays(i);
			if (i % 7 == 0 || i == 0) {
				row = $("<tr></tr>");
				row.css({ "height" : rowHeight + "px" });
				tBody.append(row);
			}
			
			var weekday = (def.firstDayOfWeek + i) % 7;
			var atts = {'class':"DateBox" + (weekday == 0 || weekday == 6 ? ' Weekend ' : ''),
						'date':currentDate.toString("M/d/yyyy")
			};
			
			//dates outside of month range.
			if (currentDate.compareTo(_firstOfMonth) == -1 || currentDate.compareTo(_lastOfMonth) == 1) {
				atts['class'] += ' Inactive';
			}
			
			//check to see if current date rendering is today
			if (currentDate.compareTo(now) == 0) { 
				atts['class'] += ' Today';
			}
			
			//DateBox Events
			var dateLink = $('<div class="DateLabel"><a>' + currentDate.getDate() + '</a></div>');
			dateLink.bind('click', { Date: currentDate.clone() }, def.onDayLinkClick);
			
			var dateBox = $("<td></td>").attr(atts).append(dateLink);
			dateBox.bind('dblclick', { Date: currentDate.clone() }, def.onDayCellDblClick);
			dateBox.bind('click', { Date: currentDate.clone() }, def.onDayCellClick);
			
			if (def.dragableEvents) {
				dateBox.droppable({
					hoverClass: def.dragHoverClass,
					tolerance: 'pointer',
					drop: function(ev, ui) {
						var eventId = ui.draggable.attr("eventid")
						var newDate = new Date($(this).attr("date")).clearTime();
						
						var event;
						$.each(cEvents, function() {
							if (this.EventID == eventId) {
								var days = new TimeSpan(newDate - this.StartDateTime).days;
								
								this.StartDateTime.addDays(days);
								this.EndDateTime.addDays(days);
																
								event = this;
							}
						});
						
						$.J.ClearEventsOnCalendar();
						_drawEventsOnCalendar();
						
						def.onEventDropped.call(this, event, newDate);
					}
				});
			}
			
			_boxes.push(new CalendarBox(i, currentDate, dateBox, dateLink));
			row.append(dateBox);
		}
		tBody.append(row);

		var a = $(def.containerId);
		var cal = $('<table class="MonthlyCalendar" cellpadding="0" tablespacing="0"></table>').append(headerRow, tBody);
		
		a.hide();
		a.html(cal);
		a.fadeIn("normal");
		
		_drawEventsOnCalendar();
	}
	
	var _drawEventsOnCalendar = function() {
		//filter the JSON array for proper dates
		_filterEventCollection();
		_clearBoxEvents();
		
		if (cEvents && cEvents.length > 0) {
			var container = $(def.containerId);			
			
			$.each(cEvents, function(){
				var ev = this;
				//alert("eventID: " + ev.EventID + ", start: " + ev.StartDateTime + ",end: " + ev.EndDateTime);
				
				var tempStartDT = ev.StartDateTime.clone().clearTime();
				var tempEndDT = ev.EndDateTime.clone().clearTime();
				
				var startI = new TimeSpan(tempStartDT - _dateRange.startDate).days;
				var endI = new TimeSpan(tempEndDT - _dateRange.startDate).days;
				//alert("start I: " + startI + " end I: " + endI);
				
				var istart = (startI < 0) ? 0 : startI;
				var iend = (endI > _boxes.length - 1) ? _boxes.length - 1 : endI;
				//alert("istart: " + istart + " iend: " + iend);
				
				
				for (var i = istart; i <= iend; i++) {
					var b = _boxes[i];

					var startBoxCompare = tempStartDT.compareTo(b.date);
					var endBoxCompare = tempEndDT.compareTo(b.date);

					var continueEvent = ((i != 0 && startBoxCompare == -1 && endBoxCompare >= 0 && b.weekNumber != _boxes[i - 1].weekNumber) || (i == 0 && startBoxCompare == -1));
					var toManyEvents = (startBoxCompare == 0 || (i == 0 && startBoxCompare == -1) || 
										continueEvent || (startBoxCompare == -1 && endBoxCompare >= 0)) && b.vOffset >= (b.getCellBox().height() - b.getLabelHeight() - 32);
					
					//alert("b.vOffset: " + b.vOffset + ", cell height: " + (b.getCellBox().height() - b.getLabelHeight() - 32));
					//alert(continueEvent);
					//alert(toManyEvents);
					
					if (toManyEvents) {
						if (!b.isTooManySet) {
							var moreDiv = $('<div class="MoreEvents" id="ME_' + i + '">' + def.navLinks.showMore + '</div>');
							var pos = b.getCellPosition();
							var index = i;

							moreDiv.css({ 
								"top" : (pos.top + (b.getCellBox().height() - b.getLabelHeight())), 
								"left" : pos.left, 
								"width" : (b.getLabelWidth() - 7),
								"position" : "absolute" });
							
							moreDiv.click(function(e) { _showMoreClick(e, index); });
							
							_eventObj[moreDiv.attr("id")] = moreDiv;
							b.isTooManySet = true;
						} //else update the +more to show??
						b.events.push(ev);
					} else if (startBoxCompare == 0 || (i == 0 && startBoxCompare == -1) || continueEvent) {
						var block = _buildEventBlock(ev, b.weekNumber);						
						var pos = b.getCellPosition();
						
						block.css({ 
							"top" : (pos.top + b.getLabelHeight() + b.vOffset), 
							"left" : pos.left, 
							"width" : (b.getLabelWidth() - 7), 
							"position" : "absolute" });
						
						b.vOffset += 19;
						
						if (continueEvent) {
							block.prepend($('<span />').addClass("ui-icon").addClass("ui-icon-triangle-1-w"));
							
							var e = _eventObj['Event_' + ev.EventID + '_' + (b.weekNumber - 1)];
							if (e) { e.prepend($('<span />').addClass("ui-icon").addClass("ui-icon-triangle-1-e")); }
						}
						
						_eventObj[block.attr("id")] = block;
						
						b.events.push(ev);
					} else if (startBoxCompare == -1 && endBoxCompare >= 0) {
						var e = _eventObj['Event_' + ev.EventID + '_' + b.weekNumber];
						if (e) {
							var w = e.css("width")
							e.css({ "width" : (parseInt(w) + b.getLabelWidth() + 1) });
							b.vOffset += 19;
							b.events.push(ev);
						}
					}
					
					//end of month continue
					if (i == iend && endBoxCompare > 0) {
						var e = _eventObj['Event_' + ev.EventID + '_' + b.weekNumber];
						if (e) { e.prepend($('<span />').addClass("ui-icon").addClass("ui-icon-triangle-1-e")); }
					}
				}
			});
			
			for (var o in _eventObj) {
				_eventObj[o].hide();
				container.append(_eventObj[o]);
				_eventObj[o].show();
			}
		}
	}
	
	var _buildEventBlock = function(ev, weekNumber) {
		var block = $('<div class="Event" id="Event_' + ev.EventID + '_' + weekNumber + '" eventid="' + ev.EventID +'"></div>');
		
		if(ev.CssClass) { block.addClass(ev.CssClass) }
		block.bind('click', { Event: ev }, def.onEventBlockClick);
		block.bind('mouseover', { Event: ev }, def.onEventBlockOver);
		block.bind('mouseout', { Event: ev }, def.onEventBlockOut);
		
		if (def.dragableEvents) {
			_dragableEvent(ev, block, weekNumber);
		}
		
		var link;
		if (ev.URL && ev.URL.length > 0) {
			link = $('<a href="' + ev.URL + '">' + ev.Title + '</a>');
		} else {
			link = $('<a>' + ev.Title + '</a>');
		}
		
		link.bind('click', { Event: ev }, def.onEventLinkClick);
		block.append(link);
		return block;
	}	

	var _dragableEvent = function(event, block, weekNumber) {
		block.draggable({
			zIndex: 4,
			delay: 50,
			opacity: 0.5,
			revertDuration: 1000,
			cursorAt: { left: 5 },
			start: function(ev, ui) {
				//hide any additional event parts
				for (var i = 0; i <= _gridRows; i++) {
					if (i == weekNumber) {
						continue;
					}
					
					var e = _eventObj['Event_' + event.EventID + '_' + i];
					if (e) { e.hide(); }
				}
			}
		});
	}
	
	var _showMoreClick = function(e, boxIndex) {
		var box = _boxes[boxIndex];
		def.onShowMoreClick.call(this, box.events);
		e.stopPropagation();
	}
	
	
	$.J.ClearEventsOnCalendar = function() {
		_clearBoxEvents();
		$(".Event", $(def.containerId)).remove();
		$(".MoreEvents", $(def.containerId)).remove();
	}
	
	$.J.AddEvents = function(eventCollection) {
		if(eventCollection) {
			if(eventCollection.length > 0) {
				$.merge(cEvents, eventCollection);
			} else {
				cEvents.push(eventCollection);
			}
			$.J.ClearEventsOnCalendar();
			_drawEventsOnCalendar();
		}
	}
	
	$.J.ReplaceEventCollection = function(eventCollection) {
		if(eventCollection) {
			cEvents = [];
			cEvents = eventCollection;
		}
		
		$.J.ClearEventsOnCalendar();
		_drawEventsOnCalendar();
	}
	
	$.J.ChangeMonth = function(dateIn) {
		var returned = def.onMonthChanging.call(this, dateIn);
		if (!returned) {
			$.J.DrawCalendar(dateIn);
			def.onMonthChanged.call(this, dateIn);
		}
	}
	
	$.J.Initialize = function(options, events) {
		var today = new Date();
		
		options = $.extend(def, options);
		
		if (events) { 
			$.J.ClearEventsOnCalendar();
			cEvents = events;
		}
		
		$.J.DrawCalendar();
	};
	
	
	function CalendarBox(id, boxDate, cell, label) {
		this.id = id;
		this.date = boxDate;
		this.cell = cell;
		this.label = label;
		this.weekNumber = Math.floor(id / 7);
		this.events= [];
		this.isTooManySet = false;
		this.vOffset = 0;
		
		this.echo = function() {
			alert("Date: " + this.date + " WeekNumber: " + this.weekNumber + " ID: " + this.id);
		}
		
		this.clear = function() {
			this.events = [];
			this.isTooManySet = false;
			this.vOffset = 0;
		}
		
		this.getCellPosition = function() {
			if (this.cell) { 
				return this.cell.position();
			}
			return;
		}
		
		this.getCellBox = function() {
			if (this.cell) { 
				return this.cell;
			}
			return;
		}
		
		this.getLabelWidth = function() {
			if (this.label) {
				return this.label.innerWidth();
			}
			return;
		}
		
		this.getLabelHeight = function() {
			if (this.label) { 
				return this.label.height();
			}
			return;
		}
		
		this.getDate = function() {
			return this.date;
		}
	}
})(jQuery);/**
 * Version: 1.0 Alpha-1 
 * Build Date: 13-Nov-2007
 * Copyright (c) 2006-2007, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * License: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/. 
 * Website: http://www.datejs.com/ or http://www.coolite.com/datejs/
 */
Date.CultureInfo={name:"en-US",englishName:"English (United States)",nativeName:"English (United States)",dayNames:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],abbreviatedDayNames:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],shortestDayNames:["Su","Mo","Tu","We","Th","Fr","Sa"],firstLetterDayNames:["S","M","T","W","T","F","S"],monthNames:["January","February","March","April","May","June","July","August","September","October","November","December"],abbreviatedMonthNames:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],amDesignator:"AM",pmDesignator:"PM",firstDayOfWeek:0,twoDigitYearMax:2029,dateElementOrder:"mdy",formatPatterns:{shortDate:"M/d/yyyy",longDate:"dddd, MMMM dd, yyyy",shortTime:"h:mm tt",longTime:"h:mm:ss tt",fullDateTime:"dddd, MMMM dd, yyyy h:mm:ss tt",sortableDateTime:"yyyy-MM-ddTHH:mm:ss",universalSortableDateTime:"yyyy-MM-dd HH:mm:ssZ",rfc1123:"ddd, dd MMM yyyy HH:mm:ss GMT",monthDay:"MMMM dd",yearMonth:"MMMM, yyyy"},regexPatterns:{jan:/^jan(uary)?/i,feb:/^feb(ruary)?/i,mar:/^mar(ch)?/i,apr:/^apr(il)?/i,may:/^may/i,jun:/^jun(e)?/i,jul:/^jul(y)?/i,aug:/^aug(ust)?/i,sep:/^sep(t(ember)?)?/i,oct:/^oct(ober)?/i,nov:/^nov(ember)?/i,dec:/^dec(ember)?/i,sun:/^su(n(day)?)?/i,mon:/^mo(n(day)?)?/i,tue:/^tu(e(s(day)?)?)?/i,wed:/^we(d(nesday)?)?/i,thu:/^th(u(r(s(day)?)?)?)?/i,fri:/^fr(i(day)?)?/i,sat:/^sa(t(urday)?)?/i,future:/^next/i,past:/^last|past|prev(ious)?/i,add:/^(\+|after|from)/i,subtract:/^(\-|before|ago)/i,yesterday:/^yesterday/i,today:/^t(oday)?/i,tomorrow:/^tomorrow/i,now:/^n(ow)?/i,millisecond:/^ms|milli(second)?s?/i,second:/^sec(ond)?s?/i,minute:/^min(ute)?s?/i,hour:/^h(ou)?rs?/i,week:/^w(ee)?k/i,month:/^m(o(nth)?s?)?/i,day:/^d(ays?)?/i,year:/^y((ea)?rs?)?/i,shortMeridian:/^(a|p)/i,longMeridian:/^(a\.?m?\.?|p\.?m?\.?)/i,timezone:/^((e(s|d)t|c(s|d)t|m(s|d)t|p(s|d)t)|((gmt)?\s*(\+|\-)\s*\d\d\d\d?)|gmt)/i,ordinalSuffix:/^\s*(st|nd|rd|th)/i,timeContext:/^\s*(\:|a|p)/i},abbreviatedTimeZoneStandard:{GMT:"-000",EST:"-0400",CST:"-0500",MST:"-0600",PST:"-0700"},abbreviatedTimeZoneDST:{GMT:"-000",EDT:"-0500",CDT:"-0600",MDT:"-0700",PDT:"-0800"}};
Date.getMonthNumberFromName=function(name){var n=Date.CultureInfo.monthNames,m=Date.CultureInfo.abbreviatedMonthNames,s=name.toLowerCase();for(var i=0;i<n.length;i++){if(n[i].toLowerCase()==s||m[i].toLowerCase()==s){return i;}}
return-1;};Date.getDayNumberFromName=function(name){var n=Date.CultureInfo.dayNames,m=Date.CultureInfo.abbreviatedDayNames,o=Date.CultureInfo.shortestDayNames,s=name.toLowerCase();for(var i=0;i<n.length;i++){if(n[i].toLowerCase()==s||m[i].toLowerCase()==s){return i;}}
return-1;};Date.isLeapYear=function(year){return(((year%4===0)&&(year%100!==0))||(year%400===0));};Date.getDaysInMonth=function(year,month){return[31,(Date.isLeapYear(year)?29:28),31,30,31,30,31,31,30,31,30,31][month];};Date.getTimezoneOffset=function(s,dst){return(dst||false)?Date.CultureInfo.abbreviatedTimeZoneDST[s.toUpperCase()]:Date.CultureInfo.abbreviatedTimeZoneStandard[s.toUpperCase()];};Date.getTimezoneAbbreviation=function(offset,dst){var n=(dst||false)?Date.CultureInfo.abbreviatedTimeZoneDST:Date.CultureInfo.abbreviatedTimeZoneStandard,p;for(p in n){if(n[p]===offset){return p;}}
return null;};Date.prototype.clone=function(){return new Date(this.getTime());};Date.prototype.compareTo=function(date){if(isNaN(this)){throw new Error(this);}
if(date instanceof Date&&!isNaN(date)){return(this>date)?1:(this<date)?-1:0;}else{throw new TypeError(date);}};Date.prototype.equals=function(date){return(this.compareTo(date)===0);};Date.prototype.between=function(start,end){var t=this.getTime();return t>=start.getTime()&&t<=end.getTime();};Date.prototype.addMilliseconds=function(value){this.setMilliseconds(this.getMilliseconds()+value);return this;};Date.prototype.addSeconds=function(value){return this.addMilliseconds(value*1000);};Date.prototype.addMinutes=function(value){return this.addMilliseconds(value*60000);};Date.prototype.addHours=function(value){return this.addMilliseconds(value*3600000);};Date.prototype.addDays=function(value){return this.addMilliseconds(value*86400000);};Date.prototype.addWeeks=function(value){return this.addMilliseconds(value*604800000);};Date.prototype.addMonths=function(value){var n=this.getDate();this.setDate(1);this.setMonth(this.getMonth()+value);this.setDate(Math.min(n,this.getDaysInMonth()));return this;};Date.prototype.addYears=function(value){return this.addMonths(value*12);};Date.prototype.add=function(config){if(typeof config=="number"){this._orient=config;return this;}
var x=config;if(x.millisecond||x.milliseconds){this.addMilliseconds(x.millisecond||x.milliseconds);}
if(x.second||x.seconds){this.addSeconds(x.second||x.seconds);}
if(x.minute||x.minutes){this.addMinutes(x.minute||x.minutes);}
if(x.hour||x.hours){this.addHours(x.hour||x.hours);}
if(x.month||x.months){this.addMonths(x.month||x.months);}
if(x.year||x.years){this.addYears(x.year||x.years);}
if(x.day||x.days){this.addDays(x.day||x.days);}
return this;};Date._validate=function(value,min,max,name){if(typeof value!="number"){throw new TypeError(value+" is not a Number.");}else if(value<min||value>max){throw new RangeError(value+" is not a valid value for "+name+".");}
return true;};Date.validateMillisecond=function(n){return Date._validate(n,0,999,"milliseconds");};Date.validateSecond=function(n){return Date._validate(n,0,59,"seconds");};Date.validateMinute=function(n){return Date._validate(n,0,59,"minutes");};Date.validateHour=function(n){return Date._validate(n,0,23,"hours");};Date.validateDay=function(n,year,month){return Date._validate(n,1,Date.getDaysInMonth(year,month),"days");};Date.validateMonth=function(n){return Date._validate(n,0,11,"months");};Date.validateYear=function(n){return Date._validate(n,1,9999,"seconds");};Date.prototype.set=function(config){var x=config;if(!x.millisecond&&x.millisecond!==0){x.millisecond=-1;}
if(!x.second&&x.second!==0){x.second=-1;}
if(!x.minute&&x.minute!==0){x.minute=-1;}
if(!x.hour&&x.hour!==0){x.hour=-1;}
if(!x.day&&x.day!==0){x.day=-1;}
if(!x.month&&x.month!==0){x.month=-1;}
if(!x.year&&x.year!==0){x.year=-1;}
if(x.millisecond!=-1&&Date.validateMillisecond(x.millisecond)){this.addMilliseconds(x.millisecond-this.getMilliseconds());}
if(x.second!=-1&&Date.validateSecond(x.second)){this.addSeconds(x.second-this.getSeconds());}
if(x.minute!=-1&&Date.validateMinute(x.minute)){this.addMinutes(x.minute-this.getMinutes());}
if(x.hour!=-1&&Date.validateHour(x.hour)){this.addHours(x.hour-this.getHours());}
if(x.month!==-1&&Date.validateMonth(x.month)){this.addMonths(x.month-this.getMonth());}
if(x.year!=-1&&Date.validateYear(x.year)){this.addYears(x.year-this.getFullYear());}
if(x.day!=-1&&Date.validateDay(x.day,this.getFullYear(),this.getMonth())){this.addDays(x.day-this.getDate());}
if(x.timezone){this.setTimezone(x.timezone);}
if(x.timezoneOffset){this.setTimezoneOffset(x.timezoneOffset);}
return this;};Date.prototype.clearTime=function(){this.setHours(0);this.setMinutes(0);this.setSeconds(0);this.setMilliseconds(0);return this;};Date.prototype.isLeapYear=function(){var y=this.getFullYear();return(((y%4===0)&&(y%100!==0))||(y%400===0));};Date.prototype.isWeekday=function(){return!(this.is().sat()||this.is().sun());};Date.prototype.getDaysInMonth=function(){return Date.getDaysInMonth(this.getFullYear(),this.getMonth());};Date.prototype.moveToFirstDayOfMonth=function(){return this.set({day:1});};Date.prototype.moveToLastDayOfMonth=function(){return this.set({day:this.getDaysInMonth()});};Date.prototype.moveToDayOfWeek=function(day,orient){var diff=(day-this.getDay()+7*(orient||+1))%7;return this.addDays((diff===0)?diff+=7*(orient||+1):diff);};Date.prototype.moveToMonth=function(month,orient){var diff=(month-this.getMonth()+12*(orient||+1))%12;return this.addMonths((diff===0)?diff+=12*(orient||+1):diff);};Date.prototype.getDayOfYear=function(){return Math.floor((this-new Date(this.getFullYear(),0,1))/86400000);};Date.prototype.getWeekOfYear=function(firstDayOfWeek){var y=this.getFullYear(),m=this.getMonth(),d=this.getDate();var dow=firstDayOfWeek||Date.CultureInfo.firstDayOfWeek;var offset=7+1-new Date(y,0,1).getDay();if(offset==8){offset=1;}
var daynum=((Date.UTC(y,m,d,0,0,0)-Date.UTC(y,0,1,0,0,0))/86400000)+1;var w=Math.floor((daynum-offset+7)/7);if(w===dow){y--;var prevOffset=7+1-new Date(y,0,1).getDay();if(prevOffset==2||prevOffset==8){w=53;}else{w=52;}}
return w;};Date.prototype.isDST=function(){console.log('isDST');return this.toString().match(/(E|C|M|P)(S|D)T/)[2]=="D";};Date.prototype.getTimezone=function(){return Date.getTimezoneAbbreviation(this.getUTCOffset,this.isDST());};Date.prototype.setTimezoneOffset=function(s){var here=this.getTimezoneOffset(),there=Number(s)*-6/10;this.addMinutes(there-here);return this;};Date.prototype.setTimezone=function(s){return this.setTimezoneOffset(Date.getTimezoneOffset(s));};Date.prototype.getUTCOffset=function(){var n=this.getTimezoneOffset()*-10/6,r;if(n<0){r=(n-10000).toString();return r[0]+r.substr(2);}else{r=(n+10000).toString();return"+"+r.substr(1);}};Date.prototype.getDayName=function(abbrev){return abbrev?Date.CultureInfo.abbreviatedDayNames[this.getDay()]:Date.CultureInfo.dayNames[this.getDay()];};Date.prototype.getMonthName=function(abbrev){return abbrev?Date.CultureInfo.abbreviatedMonthNames[this.getMonth()]:Date.CultureInfo.monthNames[this.getMonth()];};Date.prototype._toString=Date.prototype.toString;Date.prototype.toString=function(format){var self=this;var p=function p(s){return(s.toString().length==1)?"0"+s:s;};return format?format.replace(/dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?/g,function(format){switch(format){case"hh":return p(self.getHours()<13?self.getHours():(self.getHours()-12));case"h":return self.getHours()<13?self.getHours():(self.getHours()-12);case"HH":return p(self.getHours());case"H":return self.getHours();case"mm":return p(self.getMinutes());case"m":return self.getMinutes();case"ss":return p(self.getSeconds());case"s":return self.getSeconds();case"yyyy":return self.getFullYear();case"yy":return self.getFullYear().toString().substring(2,4);case"dddd":return self.getDayName();case"ddd":return self.getDayName(true);case"dd":return p(self.getDate());case"d":return self.getDate().toString();case"MMMM":return self.getMonthName();case"MMM":return self.getMonthName(true);case"MM":return p((self.getMonth()+1));case"M":return self.getMonth()+1;case"t":return self.getHours()<12?Date.CultureInfo.amDesignator.substring(0,1):Date.CultureInfo.pmDesignator.substring(0,1);case"tt":return self.getHours()<12?Date.CultureInfo.amDesignator:Date.CultureInfo.pmDesignator;case"zzz":case"zz":case"z":return"";}}):this._toString();};
Date.now=function(){return new Date();};Date.today=function(){return Date.now().clearTime();};Date.prototype._orient=+1;Date.prototype.next=function(){this._orient=+1;return this;};Date.prototype.last=Date.prototype.prev=Date.prototype.previous=function(){this._orient=-1;return this;};Date.prototype._is=false;Date.prototype.is=function(){this._is=true;return this;};Number.prototype._dateElement="day";Number.prototype.fromNow=function(){var c={};c[this._dateElement]=this;return Date.now().add(c);};Number.prototype.ago=function(){var c={};c[this._dateElement]=this*-1;return Date.now().add(c);};(function(){var $D=Date.prototype,$N=Number.prototype;var dx=("sunday monday tuesday wednesday thursday friday saturday").split(/\s/),mx=("january february march april may june july august september october november december").split(/\s/),px=("Millisecond Second Minute Hour Day Week Month Year").split(/\s/),de;var df=function(n){return function(){if(this._is){this._is=false;return this.getDay()==n;}
return this.moveToDayOfWeek(n,this._orient);};};for(var i=0;i<dx.length;i++){$D[dx[i]]=$D[dx[i].substring(0,3)]=df(i);}
var mf=function(n){return function(){if(this._is){this._is=false;return this.getMonth()===n;}
return this.moveToMonth(n,this._orient);};};for(var j=0;j<mx.length;j++){$D[mx[j]]=$D[mx[j].substring(0,3)]=mf(j);}
var ef=function(j){return function(){if(j.substring(j.length-1)!="s"){j+="s";}
return this["add"+j](this._orient);};};var nf=function(n){return function(){this._dateElement=n;return this;};};for(var k=0;k<px.length;k++){de=px[k].toLowerCase();$D[de]=$D[de+"s"]=ef(px[k]);$N[de]=$N[de+"s"]=nf(de);}}());Date.prototype.toJSONString=function(){return this.toString("yyyy-MM-ddThh:mm:ssZ");};Date.prototype.toShortDateString=function(){return this.toString(Date.CultureInfo.formatPatterns.shortDatePattern);};Date.prototype.toLongDateString=function(){return this.toString(Date.CultureInfo.formatPatterns.longDatePattern);};Date.prototype.toShortTimeString=function(){return this.toString(Date.CultureInfo.formatPatterns.shortTimePattern);};Date.prototype.toLongTimeString=function(){return this.toString(Date.CultureInfo.formatPatterns.longTimePattern);};Date.prototype.getOrdinal=function(){switch(this.getDate()){case 1:case 21:case 31:return"st";case 2:case 22:return"nd";case 3:case 23:return"rd";default:return"th";}};
(function(){Date.Parsing={Exception:function(s){this.message="Parse error at '"+s.substring(0,10)+" ...'";}};var $P=Date.Parsing;var _=$P.Operators={rtoken:function(r){return function(s){var mx=s.match(r);if(mx){return([mx[0],s.substring(mx[0].length)]);}else{throw new $P.Exception(s);}};},token:function(s){return function(s){return _.rtoken(new RegExp("^\s*"+s+"\s*"))(s);};},stoken:function(s){return _.rtoken(new RegExp("^"+s));},until:function(p){return function(s){var qx=[],rx=null;while(s.length){try{rx=p.call(this,s);}catch(e){qx.push(rx[0]);s=rx[1];continue;}
break;}
return[qx,s];};},many:function(p){return function(s){var rx=[],r=null;while(s.length){try{r=p.call(this,s);}catch(e){return[rx,s];}
rx.push(r[0]);s=r[1];}
return[rx,s];};},optional:function(p){return function(s){var r=null;try{r=p.call(this,s);}catch(e){return[null,s];}
return[r[0],r[1]];};},not:function(p){return function(s){try{p.call(this,s);}catch(e){return[null,s];}
throw new $P.Exception(s);};},ignore:function(p){return p?function(s){var r=null;r=p.call(this,s);return[null,r[1]];}:null;},product:function(){var px=arguments[0],qx=Array.prototype.slice.call(arguments,1),rx=[];for(var i=0;i<px.length;i++){rx.push(_.each(px[i],qx));}
return rx;},cache:function(rule){var cache={},r=null;return function(s){try{r=cache[s]=(cache[s]||rule.call(this,s));}catch(e){r=cache[s]=e;}
if(r instanceof $P.Exception){throw r;}else{return r;}};},any:function(){var px=arguments;return function(s){var r=null;for(var i=0;i<px.length;i++){if(px[i]==null){continue;}
try{r=(px[i].call(this,s));}catch(e){r=null;}
if(r){return r;}}
throw new $P.Exception(s);};},each:function(){var px=arguments;return function(s){var rx=[],r=null;for(var i=0;i<px.length;i++){if(px[i]==null){continue;}
try{r=(px[i].call(this,s));}catch(e){throw new $P.Exception(s);}
rx.push(r[0]);s=r[1];}
return[rx,s];};},all:function(){var px=arguments,_=_;return _.each(_.optional(px));},sequence:function(px,d,c){d=d||_.rtoken(/^\s*/);c=c||null;if(px.length==1){return px[0];}
return function(s){var r=null,q=null;var rx=[];for(var i=0;i<px.length;i++){try{r=px[i].call(this,s);}catch(e){break;}
rx.push(r[0]);try{q=d.call(this,r[1]);}catch(ex){q=null;break;}
s=q[1];}
if(!r){throw new $P.Exception(s);}
if(q){throw new $P.Exception(q[1]);}
if(c){try{r=c.call(this,r[1]);}catch(ey){throw new $P.Exception(r[1]);}}
return[rx,(r?r[1]:s)];};},between:function(d1,p,d2){d2=d2||d1;var _fn=_.each(_.ignore(d1),p,_.ignore(d2));return function(s){var rx=_fn.call(this,s);return[[rx[0][0],r[0][2]],rx[1]];};},list:function(p,d,c){d=d||_.rtoken(/^\s*/);c=c||null;return(p instanceof Array?_.each(_.product(p.slice(0,-1),_.ignore(d)),p.slice(-1),_.ignore(c)):_.each(_.many(_.each(p,_.ignore(d))),px,_.ignore(c)));},set:function(px,d,c){d=d||_.rtoken(/^\s*/);c=c||null;return function(s){var r=null,p=null,q=null,rx=null,best=[[],s],last=false;for(var i=0;i<px.length;i++){q=null;p=null;r=null;last=(px.length==1);try{r=px[i].call(this,s);}catch(e){continue;}
rx=[[r[0]],r[1]];if(r[1].length>0&&!last){try{q=d.call(this,r[1]);}catch(ex){last=true;}}else{last=true;}
if(!last&&q[1].length===0){last=true;}
if(!last){var qx=[];for(var j=0;j<px.length;j++){if(i!=j){qx.push(px[j]);}}
p=_.set(qx,d).call(this,q[1]);if(p[0].length>0){rx[0]=rx[0].concat(p[0]);rx[1]=p[1];}}
if(rx[1].length<best[1].length){best=rx;}
if(best[1].length===0){break;}}
if(best[0].length===0){return best;}
if(c){try{q=c.call(this,best[1]);}catch(ey){throw new $P.Exception(best[1]);}
best[1]=q[1];}
return best;};},forward:function(gr,fname){return function(s){return gr[fname].call(this,s);};},replace:function(rule,repl){return function(s){var r=rule.call(this,s);return[repl,r[1]];};},process:function(rule,fn){return function(s){var r=rule.call(this,s);return[fn.call(this,r[0]),r[1]];};},min:function(min,rule){return function(s){var rx=rule.call(this,s);if(rx[0].length<min){throw new $P.Exception(s);}
return rx;};}};var _generator=function(op){return function(){var args=null,rx=[];if(arguments.length>1){args=Array.prototype.slice.call(arguments);}else if(arguments[0]instanceof Array){args=arguments[0];}
if(args){for(var i=0,px=args.shift();i<px.length;i++){args.unshift(px[i]);rx.push(op.apply(null,args));args.shift();return rx;}}else{return op.apply(null,arguments);}};};var gx="optional not ignore cache".split(/\s/);for(var i=0;i<gx.length;i++){_[gx[i]]=_generator(_[gx[i]]);}
var _vector=function(op){return function(){if(arguments[0]instanceof Array){return op.apply(null,arguments[0]);}else{return op.apply(null,arguments);}};};var vx="each any all".split(/\s/);for(var j=0;j<vx.length;j++){_[vx[j]]=_vector(_[vx[j]]);}}());(function(){var flattenAndCompact=function(ax){var rx=[];for(var i=0;i<ax.length;i++){if(ax[i]instanceof Array){rx=rx.concat(flattenAndCompact(ax[i]));}else{if(ax[i]){rx.push(ax[i]);}}}
return rx;};Date.Grammar={};Date.Translator={hour:function(s){return function(){this.hour=Number(s);};},minute:function(s){return function(){this.minute=Number(s);};},second:function(s){return function(){this.second=Number(s);};},meridian:function(s){return function(){this.meridian=s.slice(0,1).toLowerCase();};},timezone:function(s){return function(){var n=s.replace(/[^\d\+\-]/g,"");if(n.length){this.timezoneOffset=Number(n);}else{this.timezone=s.toLowerCase();}};},day:function(x){var s=x[0];return function(){this.day=Number(s.match(/\d+/)[0]);};},month:function(s){return function(){this.month=((s.length==3)?Date.getMonthNumberFromName(s):(Number(s)-1));};},year:function(s){return function(){var n=Number(s);this.year=((s.length>2)?n:(n+(((n+2000)<Date.CultureInfo.twoDigitYearMax)?2000:1900)));};},rday:function(s){return function(){switch(s){case"yesterday":this.days=-1;break;case"tomorrow":this.days=1;break;case"today":this.days=0;break;case"now":this.days=0;this.now=true;break;}};},finishExact:function(x){x=(x instanceof Array)?x:[x];var now=new Date();this.year=now.getFullYear();this.month=now.getMonth();this.day=1;this.hour=0;this.minute=0;this.second=0;for(var i=0;i<x.length;i++){if(x[i]){x[i].call(this);}}
this.hour=(this.meridian=="p"&&this.hour<13)?this.hour+12:this.hour;if(this.day>Date.getDaysInMonth(this.year,this.month)){throw new RangeError(this.day+" is not a valid value for days.");}
var r=new Date(this.year,this.month,this.day,this.hour,this.minute,this.second);if(this.timezone){r.set({timezone:this.timezone});}else if(this.timezoneOffset){r.set({timezoneOffset:this.timezoneOffset});}
return r;},finish:function(x){x=(x instanceof Array)?flattenAndCompact(x):[x];if(x.length===0){return null;}
for(var i=0;i<x.length;i++){if(typeof x[i]=="function"){x[i].call(this);}}
if(this.now){return new Date();}
var today=Date.today();var method=null;var expression=!!(this.days!=null||this.orient||this.operator);if(expression){var gap,mod,orient;orient=((this.orient=="past"||this.operator=="subtract")?-1:1);if(this.weekday){this.unit="day";gap=(Date.getDayNumberFromName(this.weekday)-today.getDay());mod=7;this.days=gap?((gap+(orient*mod))%mod):(orient*mod);}
if(this.month){this.unit="month";gap=(this.month-today.getMonth());mod=12;this.months=gap?((gap+(orient*mod))%mod):(orient*mod);this.month=null;}
if(!this.unit){this.unit="day";}
if(this[this.unit+"s"]==null||this.operator!=null){if(!this.value){this.value=1;}
if(this.unit=="week"){this.unit="day";this.value=this.value*7;}
this[this.unit+"s"]=this.value*orient;}
return today.add(this);}else{if(this.meridian&&this.hour){this.hour=(this.hour<13&&this.meridian=="p")?this.hour+12:this.hour;}
if(this.weekday&&!this.day){this.day=(today.addDays((Date.getDayNumberFromName(this.weekday)-today.getDay()))).getDate();}
if(this.month&&!this.day){this.day=1;}
return today.set(this);}}};var _=Date.Parsing.Operators,g=Date.Grammar,t=Date.Translator,_fn;g.datePartDelimiter=_.rtoken(/^([\s\-\.\,\/\x27]+)/);g.timePartDelimiter=_.stoken(":");g.whiteSpace=_.rtoken(/^\s*/);g.generalDelimiter=_.rtoken(/^(([\s\,]|at|on)+)/);var _C={};g.ctoken=function(keys){var fn=_C[keys];if(!fn){var c=Date.CultureInfo.regexPatterns;var kx=keys.split(/\s+/),px=[];for(var i=0;i<kx.length;i++){px.push(_.replace(_.rtoken(c[kx[i]]),kx[i]));}
fn=_C[keys]=_.any.apply(null,px);}
return fn;};g.ctoken2=function(key){return _.rtoken(Date.CultureInfo.regexPatterns[key]);};g.h=_.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2]|[1-9])/),t.hour));g.hh=_.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2])/),t.hour));g.H=_.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3]|[0-9])/),t.hour));g.HH=_.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3])/),t.hour));g.m=_.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/),t.minute));g.mm=_.cache(_.process(_.rtoken(/^[0-5][0-9]/),t.minute));g.s=_.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/),t.second));g.ss=_.cache(_.process(_.rtoken(/^[0-5][0-9]/),t.second));g.hms=_.cache(_.sequence([g.H,g.mm,g.ss],g.timePartDelimiter));g.t=_.cache(_.process(g.ctoken2("shortMeridian"),t.meridian));g.tt=_.cache(_.process(g.ctoken2("longMeridian"),t.meridian));g.z=_.cache(_.process(_.rtoken(/^(\+|\-)?\s*\d\d\d\d?/),t.timezone));g.zz=_.cache(_.process(_.rtoken(/^(\+|\-)\s*\d\d\d\d/),t.timezone));g.zzz=_.cache(_.process(g.ctoken2("timezone"),t.timezone));g.timeSuffix=_.each(_.ignore(g.whiteSpace),_.set([g.tt,g.zzz]));g.time=_.each(_.optional(_.ignore(_.stoken("T"))),g.hms,g.timeSuffix);g.d=_.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1]|\d)/),_.optional(g.ctoken2("ordinalSuffix"))),t.day));g.dd=_.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1])/),_.optional(g.ctoken2("ordinalSuffix"))),t.day));g.ddd=g.dddd=_.cache(_.process(g.ctoken("sun mon tue wed thu fri sat"),function(s){return function(){this.weekday=s;};}));g.M=_.cache(_.process(_.rtoken(/^(1[0-2]|0\d|\d)/),t.month));g.MM=_.cache(_.process(_.rtoken(/^(1[0-2]|0\d)/),t.month));g.MMM=g.MMMM=_.cache(_.process(g.ctoken("jan feb mar apr may jun jul aug sep oct nov dec"),t.month));g.y=_.cache(_.process(_.rtoken(/^(\d\d?)/),t.year));g.yy=_.cache(_.process(_.rtoken(/^(\d\d)/),t.year));g.yyy=_.cache(_.process(_.rtoken(/^(\d\d?\d?\d?)/),t.year));g.yyyy=_.cache(_.process(_.rtoken(/^(\d\d\d\d)/),t.year));_fn=function(){return _.each(_.any.apply(null,arguments),_.not(g.ctoken2("timeContext")));};g.day=_fn(g.d,g.dd);g.month=_fn(g.M,g.MMM);g.year=_fn(g.yyyy,g.yy);g.orientation=_.process(g.ctoken("past future"),function(s){return function(){this.orient=s;};});g.operator=_.process(g.ctoken("add subtract"),function(s){return function(){this.operator=s;};});g.rday=_.process(g.ctoken("yesterday tomorrow today now"),t.rday);g.unit=_.process(g.ctoken("minute hour day week month year"),function(s){return function(){this.unit=s;};});g.value=_.process(_.rtoken(/^\d\d?(st|nd|rd|th)?/),function(s){return function(){this.value=s.replace(/\D/g,"");};});g.expression=_.set([g.rday,g.operator,g.value,g.unit,g.orientation,g.ddd,g.MMM]);_fn=function(){return _.set(arguments,g.datePartDelimiter);};g.mdy=_fn(g.ddd,g.month,g.day,g.year);g.ymd=_fn(g.ddd,g.year,g.month,g.day);g.dmy=_fn(g.ddd,g.day,g.month,g.year);g.date=function(s){return((g[Date.CultureInfo.dateElementOrder]||g.mdy).call(this,s));};g.format=_.process(_.many(_.any(_.process(_.rtoken(/^(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?)/),function(fmt){if(g[fmt]){return g[fmt];}else{throw Date.Parsing.Exception(fmt);}}),_.process(_.rtoken(/^[^dMyhHmstz]+/),function(s){return _.ignore(_.stoken(s));}))),function(rules){return _.process(_.each.apply(null,rules),t.finishExact);});var _F={};var _get=function(f){return _F[f]=(_F[f]||g.format(f)[0]);};g.formats=function(fx){if(fx instanceof Array){var rx=[];for(var i=0;i<fx.length;i++){rx.push(_get(fx[i]));}
return _.any.apply(null,rx);}else{return _get(fx);}};g._formats=g.formats(["yyyy-MM-ddTHH:mm:ss","ddd, MMM dd, yyyy H:mm:ss tt","ddd MMM d yyyy HH:mm:ss zzz","d"]);g._start=_.process(_.set([g.date,g.time,g.expression],g.generalDelimiter,g.whiteSpace),t.finish);g.start=function(s){try{var r=g._formats.call({},s);if(r[1].length===0){return r;}}catch(e){}
return g._start.call({},s);};}());Date._parse=Date.parse;Date.parse=function(s){var r=null;if(!s){return null;}
try{r=Date.Grammar.start.call({},s);}catch(e){return null;}
return((r[1].length===0)?r[0]:null);};Date.getParseFunction=function(fx){var fn=Date.Grammar.formats(fx);return function(s){var r=null;try{r=fn.call({},s);}catch(e){return null;}
return((r[1].length===0)?r[0]:null);};};Date.parseExact=function(s,fx){return Date.getParseFunction(fx)(s);};
/**
 * Version: 1.0 Alpha-1 
 * Build Date: 13-Nov-2007
 * Copyright (c) 2006-2007, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * License: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/. 
 * Website: http://www.datejs.com/ or http://www.coolite.com/datejs/
 */
TimeSpan=function(days,hours,minutes,seconds,milliseconds){this.days=0;this.hours=0;this.minutes=0;this.seconds=0;this.milliseconds=0;if(arguments.length==5){this.days=days;this.hours=hours;this.minutes=minutes;this.seconds=seconds;this.milliseconds=milliseconds;}
else if(arguments.length==1&&typeof days=="number"){var orient=(days<0)?-1:+1;this.milliseconds=Math.abs(days);this.days=Math.floor(this.milliseconds/(24*60*60*1000))*orient;this.milliseconds=this.milliseconds%(24*60*60*1000);this.hours=Math.floor(this.milliseconds/(60*60*1000))*orient;this.milliseconds=this.milliseconds%(60*60*1000);this.minutes=Math.floor(this.milliseconds/(60*1000))*orient;this.milliseconds=this.milliseconds%(60*1000);this.seconds=Math.floor(this.milliseconds/1000)*orient;this.milliseconds=this.milliseconds%1000;this.milliseconds=this.milliseconds*orient;return this;}
else{return null;}};TimeSpan.prototype.compare=function(timeSpan){var t1=new Date(1970,1,1,this.hours(),this.minutes(),this.seconds()),t2;if(timeSpan===null){t2=new Date(1970,1,1,0,0,0);}
else{t2=new Date(1970,1,1,timeSpan.hours(),timeSpan.minutes(),timeSpan.seconds());}
return(t1>t2)?1:(t1<t2)?-1:0;};TimeSpan.prototype.add=function(timeSpan){return(timeSpan===null)?this:this.addSeconds(timeSpan.getTotalMilliseconds()/1000);};TimeSpan.prototype.subtract=function(timeSpan){return(timeSpan===null)?this:this.addSeconds(-timeSpan.getTotalMilliseconds()/1000);};TimeSpan.prototype.addDays=function(n){return new TimeSpan(this.getTotalMilliseconds()+(n*24*60*60*1000));};TimeSpan.prototype.addHours=function(n){return new TimeSpan(this.getTotalMilliseconds()+(n*60*60*1000));};TimeSpan.prototype.addMinutes=function(n){return new TimeSpan(this.getTotalMilliseconds()+(n*60*1000));};TimeSpan.prototype.addSeconds=function(n){return new TimeSpan(this.getTotalMilliseconds()+(n*1000));};TimeSpan.prototype.addMilliseconds=function(n){return new TimeSpan(this.getTotalMilliseconds()+n);};TimeSpan.prototype.getTotalMilliseconds=function(){return(this.days()*(24*60*60*1000))+(this.hours()*(60*60*1000))+(this.minutes()*(60*1000))+(this.seconds()*(1000));};TimeSpan.prototype.get12HourHour=function(){return((h=this.hours()%12)?h:12);};TimeSpan.prototype.getDesignator=function(){return(this.hours()<12)?Date.CultureInfo.amDesignator:Date.CultureInfo.pmDesignator;};TimeSpan.prototype.toString=function(format){function _toString(){if(this.days()!==null&&this.days()>0){return this.days()+"."+this.hours()+":"+p(this.minutes())+":"+p(this.seconds());}
else{return this.hours()+":"+p(this.minutes())+":"+p(this.seconds());}}
function p(s){return(s.toString().length<2)?"0"+s:s;}
var self=this;return format?format.replace(/d|dd|HH|H|hh|h|mm|m|ss|s|tt|t/g,function(format){switch(format){case"d":return self.days();case"dd":return p(self.days());case"H":return self.hours();case"HH":return p(self.hours());case"h":return self.get12HourHour();case"hh":return p(self.get12HourHour());case"m":return self.minutes();case"mm":return p(self.minutes());case"s":return self.seconds();case"ss":return p(self.seconds());case"t":return((this.hours()<12)?Date.CultureInfo.amDesignator:Date.CultureInfo.pmDesignator).substring(0,1);case"tt":return(this.hours()<12)?Date.CultureInfo.amDesignator:Date.CultureInfo.pmDesignator;}}):this._toString();};var TimePeriod=function(years,months,days,hours,minutes,seconds,milliseconds){this.years=0;this.months=0;this.days=0;this.hours=0;this.minutes=0;this.seconds=0;this.milliseconds=0;if(arguments.length==2&&arguments[0]instanceof Date&&arguments[1]instanceof Date){var date1=years.clone();var date2=months.clone();var temp=date1.clone();var orient=(date1>date2)?-1:+1;this.years=date2.getFullYear()-date1.getFullYear();temp.addYears(this.years);if(orient==+1){if(temp>date2){if(this.years!==0){this.years--;}}}else{if(temp<date2){if(this.years!==0){this.years++;}}}
date1.addYears(this.years);if(orient==+1){while(date1<date2&&date1.clone().addDays(date1.getDaysInMonth())<date2){date1.addMonths(1);this.months++;}}
else{while(date1>date2&&date1.clone().addDays(-date1.getDaysInMonth())>date2){date1.addMonths(-1);this.months--;}}
var diff=date2-date1;if(diff!==0){var ts=new TimeSpan(diff);this.days=ts.days;this.hours=ts.hours;this.minutes=ts.minutes;this.seconds=ts.seconds;this.milliseconds=ts.milliseconds;}
return this;}};
