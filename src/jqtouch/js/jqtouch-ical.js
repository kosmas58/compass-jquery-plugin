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
    var btnClass = $(this).prop('class');
    var clickedDate = getClickedDate($(this));

    // where's the today? let's remove it first
    RemoveSelectedCell();

    setToday();

    if (btnClass.indexOf('date_has_event') != -1 || btnClass.indexOf('today_date_has_event') != -1) {
      // Event Date
      $(this).prop('class', 'selected_date_has_event');
      getEvents(clickedDate);
    }
    if (btnClass == '' || btnClass.indexOf('today') != -1) {
      // Non Event Date
      $(this).prop('class', 'selected');
      getNoEvents();
    }

    if (btnClass.indexOf('prevmonth') != -1 || btnClass.indexOf('nextmonth') != -1) {
      getCalendar(url, clickedDate);
    }
  });
  // bottom bar - today
  $("#ical .bottom-bar .bottom-bar-today").bind("click", function() {
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
  if (day == "") day = $('#ical .selected_date_has_event').text();

  var mmm = parseInt($('#ical > #month').val());
  var yyy = $('#ical > #year').val();

  var currentDay = new Date(yyy, mmm - 1, day);
  if (num == 1)
    currentDay.nextMonth();
  else
    currentDay.prevMonth();

  getCalendar(url_month, url_event, currentDay);
}
// Set Today's date
function setToday() {
  $("#ical :hidden").each(function(index) {
    var dt = getDateFromHiddenField($(this).val());

    if (!isNaN(dt)) {
      var no = now
      var da = now.getDate()
      var db = dt.getDate()
      var ma = now.getMonth()
      var mb = dt.getMonth()
      var ya = now.getFullYear()
      var yb = dt.getFullYear()

      if (now.getDate() == dt.getDate()
              && now.getMonth() == dt.getMonth()
              && now.getFullYear() == dt.getFullYear()) {

        var td = $(this).closest('td');

        if ($(td).attr('class') == 'date_has_event')
          $(td).prop('class', 'today_date_has_event');
        else
          $(td).prop('class', 'today');
      }
    }
  });
}

function getDateFromHiddenField(date) {
  var a = date.split('-');
  return new Date(a[0], a[1] - 1, a[2]);
}
// Set Selected date and Load events if exists
function setSelectedAndLoadEvents(date) {
  RemoveSelectedCell();

  $('#ical td').each(function(index) {
    var css = $(this).prop('class');
    var clickedDate = getClickedDate($(this));

    // set todays date
    if ((css != "prevmonth" && css != "nextmonth")
            && date.getDate() == clickedDate.getDate()
            && date.getMonth() == clickedDate.getMonth()
            && date.getFullYear() == clickedDate.getFullYear()) {

      if (css == "date_has_event") {
        $(this).prop('class', 'selected_date_has_event');
        getEvents(date);
      }
      else {
        $(this).prop('class', 'selected');
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
function dateAddExtention(p_Interval, p_Number) {
  var thing = new String();

  //in the spirt of VB we'll make this function non-case sensitive
  //and convert the charcters for the coder.
  p_Interval = p_Interval.toLowerCase();

  if (isNaN(p_Number)) {
    //Only accpets numbers
    //throws an error so that the coder can see why he effed up
    throw "The second parameter must be a number. \n You passed: " + p_Number;
    return false;
  }

  p_Number = new Number(p_Number);
  switch (p_Interval.toLowerCase()) {
    case "yyyy":
    {// year
      this.setFullYear(this.getFullYear() + p_Number);
      break;
    }
    case "q":
    {        // quarter
      this.setMonth(this.getMonth() + (p_Number * 3));
      break;
    }
    case "m":
    {        // month
      this.setMonth(this.getMonth() + p_Number);
      break;
    }
    case "y":        // day of year
    case "d":        // day
    case "w":
    {      // weekday
      this.setDate(this.getDate() + p_Number);
      break;
    }
    case "ww":
    {    // week of year
      this.setDate(this.getDate() + (p_Number * 7));
      break;
    }
    case "h":
    {        // hour
      this.setHours(this.getHours() + p_Number);
      break;
    }
    case "n":
    {        // minute
      this.setMinutes(this.getMinutes() + p_Number);
      break;
    }
    case "s":
    {        // second
      this.setSeconds(this.getSeconds() + p_Number);
      break;
    }
    case "ms":
    {        // second
      this.setMilliseconds(this.getMilliseconds() + p_Number);
      break;
    }
    default:
    {

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
  this.setMonth(thisMonth - 1);
  if (this.getMonth() != thisMonth - 1 && (this.getMonth() != 11 || (thisMonth == 11 && this.getDate() == 1)))
    this.setDate(0);
}
function nextMonth() {
  var thisMonth = this.getMonth();
  this.setMonth(thisMonth + 1);
  if (this.getMonth() != thisMonth + 1 && this.getMonth() != 0)
    this.setDate(0);
}

Date.prototype.nextMonth = nextMonth;
Date.prototype.prevMonth = prevMonth;
