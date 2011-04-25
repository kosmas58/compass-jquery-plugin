/*****************************************************************************
 *  FILE:  anytime.js - The Any+Time(TM) JavaScript Library (source)
 *
 *  VERSION: 4.1112H
 *
 *  Copyright 2008-2010 Andrew M. Andrews III (www.AMA3.com). Some Rights
 *  Reserved. This work licensed under the Creative Commons Attribution-
 *  Noncommercial-Share Alike 3.0 Unported License except in jurisdicitons
 *  for which the license has been ported by Creative Commons International,
 *  where the work is licensed under the applicable ported license instead.
 *  For a copy of the unported license, visit
 *  http://creativecommons.org/licenses/by-nc-sa/3.0/
 *  or send a letter to Creative Commons, 171 Second Street, Suite 300,
 *  San Francisco, California, 94105, USA.  For ported versions of the
 *  license, visit http://creativecommons.org/international/
 *
 *  Alternative licensing arrangements may be made by contacting the
 *  author at http://www.AMA3.com/contact/
 *
 *  The Any+Time(TM) JavaScript Library provides the following ECMAScript
 *  functionality:
 *
 *    AnyTime.Converter
 *      Converts Dates to/from Strings, allowing a wide range of formats
 *      closely matching those provided by the MySQL DATE_FORMAT() function,
 *      with some noteworthy enhancements.
 *
 *    AnyTime.pad()
 *      Pads a value with a specific number of leading zeroes.
 *
 *    AnyTime.noPicker()
 *      Destroys a calendar widget previously added by AnyTime.picker().
 *      Can also be invoked via jQuery using $(selector).AnyTime_noPicker()
 *
 *    AnyTime.picker()
 *      Attaches a calendar widget to a text field for selecting date/time
 *      values with fewer mouse movements than most similar pickers.  Any
 *      format supported by AnyTime.Converter can be used for the text field.
 *      If JavaScript is disabled, the text field remains editable without
 *      any of the picker features.
 *      Can also be invoked via jQuery using $(selector).AnyTime_picker()
 *
 *  IMPORTANT NOTICE:  This code depends upon the jQuery JavaScript Library
 *  (www.jquery.com), currently version 1.4.
 *
 *  The Any+Time(TM) code and styles in anytime.css have been tested (but not
 *  extensively) on Windows Vista in Internet Explorer 8.0, Firefox 3.0, Opera
 *  10.10 and Safari 4.0.  Minor variations in IE6+7 are to be expected, due
 *  to their broken box model. Please report any other problems to the author
 *  (URL above).
 *
 *  Any+Time is a trademark of Andrew M. Andrews III.
 *  Thanks to Chu for help with a setMonth() issue!
 ****************************************************************************/

var AnyTime =
{
  //=============================================================================
  //  AnyTime.pad() pads a value with a specified number of zeroes and returns
  //  a string containing the padded value.
  //=============================================================================

  pad: function(val, len) {
    var str = String(Math.abs(val));
    while (str.length < len)
      str = '0' + str;
    if (val < 0)
      str = '-' + str;
    return str;
  }
};

(function($) {
  // private members

  var __oneDay = (24 * 60 * 60 * 1000);
  var __daysIn = [ 31,28,31,30,31,30,31,31,30,31,30,31 ];
  var __iframe = null;
  var __initialized = false;
  var __msie6 = ( navigator.userAgent.indexOf('MSIE 6') > 0 );
  var __msie7 = ( navigator.userAgent.indexOf('MSIE 7') > 0 );
  var __pickers = [];

  //  Add methods to jQuery to create and destroy pickers using
  //  the typical jQuery approach.

  jQuery.prototype.AnyTime_picker = function(options) {
    return this.each(function(i) {
      AnyTime.picker(this.id, options);
    });
  }

  jQuery.prototype.AnyTime_noPicker = function() {
    return this.each(function(i) {
      AnyTime.noPicker(this.id);
    });
  }

  //  Add special methods to jQuery to compute the height and width
  //  of picker components differently for Internet Explorer 6.x
  //  This prevents the pickers from being too tall and wide.

  jQuery.prototype.AnyTime_height = function(inclusive) {
    return ( __msie6 ?
            Number(this.css('height').replace(/[^0-9]/g, '')) :
            this.outerHeight(inclusive) );
  };

  jQuery.prototype.AnyTime_width = function(inclusive) {
    return ( __msie6 ?
            (1 + Number(this.css('width').replace(/[^0-9]/g, ''))) :
            this.outerWidth(inclusive) );
  };


  //  Add a method to jQuery to change the classes of an element to
  //  indicate whether it's value is current (used by AnyTime.picker),
  //  and another to trigger the click handler for the currently-
  //  selected button under an element.

  jQuery.prototype.AnyTime_current = function(isCurrent, isLegal) {
    if (isCurrent) {
      this.removeClass('AnyTime-out-btn ui-state-default ui-state-disabled ui-state-highlight');
      this.addClass('AnyTime-cur-btn ui-state-default ui-state-highlight');
    }
    else {
      this.removeClass('AnyTime-cur-btn ui-state-highlight');
      if (! isLegal)
        this.addClass('AnyTime-out-btn ui-state-disabled');
      else
        this.removeClass('AnyTime-out-btn ui-state-disabled');
    }
  };

  jQuery.prototype.AnyTime_clickCurrent = function() {
    this.find('.AnyTime-cur-btn').triggerHandler('click');
  }

  $(document).ready(
          function() {
            //  IE6 doesn't float popups over <select> elements unless an
            //  <iframe> is inserted between them!  The <iframe> is added to
            //  the page *before* the popups are moved, so they will appear
            //  after the <iframe>.

            if (__msie6) {
              __iframe = $('<iframe frameborder="0" scrolling="no"></iframe>');
              __iframe.src = "javascript:'<html></html>';";
              $(__iframe).css({
                display: 'block',
                height: '1px',
                left: '0',
                top: '0',
                width: '1px',
                zIndex: 0
              });
              $(document.body).append(__iframe);
            }

            //  Move popup windows to the end of the page.  This allows them to
            //  overcome XHTML restrictions on <table> placement enforced by MSIE.

            for (var id in __pickers)
              if (! Array.prototype[id]) // prototype.js compatibility issue
                __pickers[id].onReady();

            __initialized = true;

          }); // document.ready

//=============================================================================
//  AnyTime.Converter
//
//  This object converts between Date objects and Strings.
//
//  To use AnyTime.Converter, simply create an instance for a format string,
//  and then (repeatedly) invoke the format() and/or parse() methods to
//  perform the conversions.  For example:
//
//    var converter = new AnyTime.Converter({format:'%Y-%m-%d'})
//    var datetime = converter.parse('1967-07-30') // July 30, 1967 @ 00:00
//    alert( converter.format(datetime) ); // outputs: 1967-07-30
//
//  Constructor parameter:
//
//  options - an object of optional parameters that override default behaviors.
//    The supported options are:
//
//    baseYear - the number to add to two-digit years if the %y format
//      specifier is used.  By default, AnyTime.Converter follows the
//      MySQL assumption that two-digit years are in the range 1970 to 2069
//      (see http://dev.mysql.com/doc/refman/5.1/en/y2k-issues.html).
//      The most common alternatives for baseYear are 1900 and 2000.
//
//    dayAbbreviations - an array of seven strings, indexed 0-6, to be used
//      as ABBREVIATED day names.  If not specified, the following are used:
//      ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
//      Note that if the firstDOW option is passed to AnyTime.picker() (see
//      AnyTime.picker()), this array should nonetheless begin with the 
//      desired abbreviation for Sunday.
//
//    dayNames - an array of seven strings, indexed 0-6, to be used as
//      day names.  If not specified, the following are used: ['Sunday',
//        'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
//      Note that if the firstDOW option is passed to AnyTime.picker() (see
//      AnyTime.picker()), this array should nonetheless begin with the
//      desired name for Sunday.
//
//    eraAbbreviations - an array of two strings, indexed 0-1, to be used
//      as ABBREVIATED era names.  Item #0 is the abbreviation for "Before
//      Common Era" (years before 0001, sometimes represented as negative
//      years or "B.C"), while item #1 is the abbreviation for "Common Era"
//      (years from 0001 to present, usually represented as unsigned years
//      or years "A.D.").  If not specified, the following are used:
//      ['BCE','CE']
//
//    format - a string specifying the pattern of strings involved in the
//      conversion.  The parse() method can take a string in this format and
//      convert it to a Date, and the format() method can take a Date object
//      and convert it to a string matching the format.
//
//      Fields in the format string must match those for the DATE_FORMAT()
//      function in MySQL, as defined here:
//      http://tinyurl.com/bwd45#function_date-format
//
//      IMPORTANT:  Some MySQL specifiers are not supported (especially
//      those involving day-of-the-year, week-of-the-year) or approximated.
//      See the code for exact behavior.
//
//      In addition to the MySQL format specifiers, the following custom
//      specifiers are also supported:
//
//        %B - If the year is before 0001, then the "Before Common Era"
//          abbreviation (usually BCE or the obsolete BC) will go here.
//
//        %C - If the year is 0001 or later, then the "Common Era"
//          abbreviation (usually CE or the obsolete AD) will go here.
//
//        %E - If the year is before 0001, then the "Before Common Era"
//          abbreviation (usually BCE or the obsolete BC) will go here.
//          Otherwise, the "Common Era" abbreviation (usually CE or the
//          obsolete AD) will go here.
//
//        %Z - The current four-digit year, without any sign.  This is
//          commonly used with years that might be before (or after) 0001,
//          when the %E (or %B and %C) specifier is used instead of a sign.
//          For example, 45 BCE is represented "0045".  By comparison, in
//          the "%Y" format, 45 BCE is represented "-0045".
//
//        %z - The current year, without any sign, using only the necessary
//          number of digits.  This if the year is commonly used with years
//          that might be before (or after) 0001, when the %E (or %B and %C)
//          specifier is used instead of a sign.  For example, the year
//          45 BCE is represented as "45", and the year 312 CE as "312".
//
//        %# - the timezone offset, with a sign, in minutes.
//
//        %+ - the timezone offset, with a sign, in hours and minutes, in
//          four-digit, 24-hour format with no delimiter (for example, +0530).
//          To remember the difference between %+ and %-, it might be helpful
//          to remember that %+ might have more characters than %-.
//
//        %: - the timezone offset, with a sign, in hours and minutes, in
//          four-digit, 24-hour format with a colon delimiter (for example,
//          +05:30).  This is similar to the %z format used by Java.  
//          To remember the difference between %: and %;, it might be helpful
//          to remember that a colon (:) has a period (.) on the bottom and
//          a semicolon (;) has a comma (,), and in English sentence structure,
//          a period represents a more significant stop than a comma, and
//          %: might be a longer string than %; (I know it's a stretch, but
//          it's easier than looking it up every time)!
//    
//        %- - the timezone offset, with a sign, in hours and minutes, in
//          three-or-four-digit, 24-hour format with no delimiter (for
//          example, +530).
//
//        %; - the timezone offset, with a sign, in hours and minutes, in
//          three-or-four-digit, 24-hour format with a colon delimiter
//          (for example, +5:30).
//
//        %@ - the timezone offset label.  By default, this will be the
//          string "UTC" followed by the offset, with a sign, in hours and  
//          minutes, in four-digit, 24-hour format with a colon delimiter
//          (for example, UTC+05:30).  However, if Any+Time(TM) has been
//          extended with a member named utcLabel (for example, by the
//          anytimetz.js file), then it is assumed to be an array of arrays,
//          where the primary array is indexed by time zone offsets, and
//          each sub-array contains a potential label for that offset.
//          When parsing with %@, the array is scanned for matches to the
//          input string, and if a match is found, the corresponding UTC
//          offset is used.  When formatting, the array is scanned for a
//          matching offset, and if one is found, the first member of the
//          sub-array is used for output (unless overridden with
//          utcFormatOffsetSubIndex or setUtcFormatOffsetSubIndex()).
//          If the array does not exist, or does not contain a sub-array
//          for the offset, then the default format is used.
//
//    monthAbbreviations - an array of twelve strings, indexed 0-6, to be
//      used as ABBREVIATED month names.  If not specified, the following
//      are used: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep',
//        'Oct','Nov','Dec']
//
//    monthNames - an array of twelve strings, indexed 0-6, to be used as
//      month names.  If not specified, the following are used:
//      ['January','February','March','April','May','June','July',
//        'August','September','October','November','December']
//
//    utcFormatOffsetAlleged - the offset from UTC, in minutes, to claim that
//      a Date object represents during formatting, even though it is formatted
//      using local time. Unlike utcFormatOffsetImposed, which actually
//      converts the Date object to the specified different time zone, this
//      option merely reports the alleged offset when a timezone specifier
//      (%#, %+, %-, %:, %; %@) is encountered in the format string.
//      This primarily exists so AnyTime.picker can edit the time as specified
//      (without conversion to local time) and then convert the edited time to
//      a different time zone (as selected using the picker).  Any initial
//      value specified here can be changed by setUtcFormatOffsetAlleged().
//      If a format offset is alleged, one cannot also be imposed (the imposed
//      offset is ignored).
//
//    utcFormatOffsetImposed - the offset from UTC, in minutes, to specify when
//      formatting a Date object.  By default, a Date is always formatted
//      using the local time zone.
//
//    utcFormatOffsetSubIndex - when extending AnyTime with a utcLabel array
//      (for example, by the anytimetz.js file), the specified sub-index is
//      used to choose the Time Zone label for the UTC offset when formatting
//      a Date object.  This primarily exists so AnyTime.picker can specify
//      the label selected using the picker.  Any initial value specified here
//      can be changed by setUtcFormatOffsetSubIndex().
//
//    utcParseOffsetAssumed - the offset from UTC, in minutes, to assume when
//      parsing a String object.  By default, a Date is always parsed using the
//      local time zone, unless the format string includes a timezone
//      specifier (%#, %+, %-, %:, %; or %@), in which case the timezone
//      specified in the string is used. The Date object created by parsing
//      always represents local time regardless of the input time zone.
//
//    utcParseOffsetCapture - if true, any parsed string is always treated as
//      though it represents local time, and any offset specified by the string
//      (or utcParseOffsetAssume) is captured for return by the 
//      getUtcParseOffsetCaptured() method.  If the %@ format specifier is
//      used, the sub-index of any matched label is also captured for return
//      by the getUtcParseOffsetSubIndex() method.  This primarily exists so
//      AnyTime.picker can edit the time as specified (without conversion to
//      local time) and then convert the edited time to a different time zone
//      (as selected using the picker). 
//=============================================================================

  AnyTime.Converter = function(options) {
    // private members

    var _flen = 0;
    var _longDay = 9;
    var _longMon = 9;
    var _shortDay = 6;
    var _shortMon = 3;
    var _offAl = Number.MIN_VALUE; // format time zone offset alleged
    var _offCap = Number.MIN_VALUE; // parsed time zone offset captured
    var _offF = Number.MIN_VALUE; // format time zone offset imposed
    var _offFSI = (-1); // format time zone label subindex
    var _offP = Number.MIN_VALUE; // parsed time zone offset assumed
    var _offPSI = (-1);        // parsed time zone label subindex captured
    var _captureOffset = false;

    // public members

    this.fmt = '%Y-%m-%d %T';
    this.dAbbr = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    this.dNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    this.eAbbr = ['BCE','CE'];
    this.mAbbr = [ 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ];
    this.mNames = [ 'January','February','March','April','May','June','July','August','September','October','November','December' ];
    this.baseYear = null;

    //-------------------------------------------------------------------------
    //  AnyTime.Converter.dAt() returns true if the character in str at pos
    //  is a digit.
    //-------------------------------------------------------------------------

    this.dAt = function(str, pos) {
      return ( (str.charCodeAt(pos) >= '0'.charCodeAt(0)) &&
              (str.charCodeAt(pos) <= '9'.charCodeAt(0)) );
    };

    //-------------------------------------------------------------------------
    //  AnyTime.Converter.format() returns a String containing the value
    //  of a specified Date object, using the format string passed to
    //  AnyTime.Converter().
    //
    //  Method parameter:
    //
    //    date - the Date object to be converted
    //-------------------------------------------------------------------------

    this.format = function(date) {
      var d = new Date(date.getTime());
      if (( _offAl == Number.MIN_VALUE ) && ( _offF != Number.MIN_VALUE ))
        d.setTime(( d.getTime() + (d.getTimezoneOffset() * 60000) ) + (_offF * 60000));

      var t;
      var str = '';
      for (var f = 0; f < _flen; f++) {
        if (this.fmt.charAt(f) != '%')
          str += this.fmt.charAt(f);
        else {
          var ch = this.fmt.charAt(f + 1)
          switch (ch) {
            case 'a': // Abbreviated weekday name (Sun..Sat)
              str += this.dAbbr[ d.getDay() ];
              break;
            case 'B': // BCE string (eAbbr[0], usually BCE or BC, only if appropriate) (NON-MYSQL)
              if (d.getFullYear() < 0)
                str += this.eAbbr[0];
              break;
            case 'b': // Abbreviated month name (Jan..Dec)
              str += this.mAbbr[ d.getMonth() ];
              break;
            case 'C': // CE string (eAbbr[1], usually CE or AD, only if appropriate) (NON-MYSQL)
              if (d.getFullYear() > 0)
                str += this.eAbbr[1];
              break;
            case 'c': // Month, numeric (0..12)
              str += d.getMonth() + 1;
              break;
            case 'd': // Day of the month, numeric (00..31)
              t = d.getDate();
              if (t < 10) str += '0';
              str += String(t);
              break;
            case 'D': // Day of the month with English suffix (0th, 1st,...)
              t = String(d.getDate());
              str += t;
              if (( t.length == 2 ) && ( t.charAt(0) == '1' ))
                str += 'th';
              else {
                switch (t.charAt(t.length - 1)) {
                  case '1': str += 'st'; break;
                  case '2': str += 'nd'; break;
                  case '3': str += 'rd'; break;
                  default: str += 'th'; break;
                }
              }
              break;
            case 'E': // era string (from eAbbr[], BCE, CE, BC or AD) (NON-MYSQL)
              str += this.eAbbr[ (d.getFullYear() < 0) ? 0 : 1 ];
              break;
            case 'e': // Day of the month, numeric (0..31)
              str += d.getDate();
              break;
            case 'H': // Hour (00..23)
              t = d.getHours();
              if (t < 10) str += '0';
              str += String(t);
              break;
            case 'h': // Hour (01..12)
            case 'I': // Hour (01..12)
              t = d.getHours() % 12;
              if (t == 0)
                str += '12';
              else {
                if (t < 10) str += '0';
                str += String(t);
              }
              break;
            case 'i': // Minutes, numeric (00..59)
              t = d.getMinutes();
              if (t < 10) str += '0';
              str += String(t);
              break;
            case 'k': // Hour (0..23)
              str += d.getHours();
              break;
            case 'l': // Hour (1..12)
              t = d.getHours() % 12;
              if (t == 0)
                str += '12';
              else
                str += String(t);
              break;
            case 'M': // Month name (January..December)
              str += this.mNames[ d.getMonth() ];
              break;
            case 'm': // Month, numeric (00..12)
              t = d.getMonth() + 1;
              if (t < 10) str += '0';
              str += String(t);
              break;
            case 'p': // AM or PM
              str += ( ( d.getHours() < 12 ) ? 'AM' : 'PM' );
              break;
            case 'r': // Time, 12-hour (hh:mm:ss followed by AM or PM)
              t = d.getHours() % 12;
              if (t == 0)
                str += '12:';
              else {
                if (t < 10) str += '0';
                str += String(t) + ':';
              }
              t = d.getMinutes();
              if (t < 10) str += '0';
              str += String(t) + ':';
              t = d.getSeconds();
              if (t < 10) str += '0';
              str += String(t);
              str += ( ( d.getHours() < 12 ) ? 'AM' : 'PM' );
              break;
            case 'S': // Seconds (00..59)
            case 's': // Seconds (00..59)
              t = d.getSeconds();
              if (t < 10) str += '0';
              str += String(t);
              break;
            case 'T': // Time, 24-hour (hh:mm:ss)
              t = d.getHours();
              if (t < 10) str += '0';
              str += String(t) + ':';
              t = d.getMinutes();
              if (t < 10) str += '0';
              str += String(t) + ':';
              t = d.getSeconds();
              if (t < 10) str += '0';
              str += String(t);
              break;
            case 'W': // Weekday name (Sunday..Saturday)
              str += this.dNames[ d.getDay() ];
              break;
            case 'w': // Day of the week (0=Sunday..6=Saturday)
              str += d.getDay();
              break;
            case 'Y': // Year, numeric, four digits (negative if before 0001)
              str += AnyTime.pad(d.getFullYear(), 4);
              break;
            case 'y': // Year, numeric (two digits, negative if before 0001)
              t = d.getFullYear() % 100;
              str += AnyTime.pad(t, 2);
              break;
            case 'Z': // Year, numeric, four digits, unsigned (NON-MYSQL)
              str += AnyTime.pad(Math.abs(d.getFullYear()), 4);
              break;
            case 'z': // Year, numeric, variable length, unsigned (NON-MYSQL)
              str += Math.abs(d.getFullYear());
              break;
            case '%': // A literal '%' character
              str += '%';
              break;
            case '#': // signed timezone offset in minutes
              t = ( _offAl != Number.MIN_VALUE ) ? _offAl :
                      ( _offF == Number.MIN_VALUE ) ? (0 - d.getTimezoneOffset()) : _offF;
              if (t >= 0)
                str += '+';
              str += t;
              break;
            case '@': // timezone offset label
              t = ( _offAl != Number.MIN_VALUE ) ? _offAl :
                      ( _offF == Number.MIN_VALUE ) ? (0 - d.getTimezoneOffset()) : _offF;
              if (AnyTime.utcLabel && AnyTime.utcLabel[t]) {
                if (( _offFSI > 0 ) && ( _offFSI < AnyTime.utcLabel[t].length ))
                  str += AnyTime.utcLabel[t][_offFSI];
                else
                  str += AnyTime.utcLabel[t][0];
                break;
              }
              str += 'UTC';
              ch = ':'; // drop through for offset formatting
            case '+': // signed, 4-digit timezone offset in hours and minutes
            case '-': // signed, 3-or-4-digit timezone offset in hours and minutes
            case ':': // signed 4-digit timezone offset with colon delimiter
            case ';': // signed 3-or-4-digit timezone offset with colon delimiter
              t = ( _offAl != Number.MIN_VALUE ) ? _offAl :
                      ( _offF == Number.MIN_VALUE ) ? (0 - d.getTimezoneOffset()) : _offF;
              if (t < 0)
                str += '-';
              else
                str += '+';
              t = Math.abs(t);
              str += ((ch == '+') || (ch == ':')) ? AnyTime.pad(Math.floor(t / 60), 2) : Math.floor(t / 60);
              if ((ch == ':') || (ch == ';'))
                str += ':';
              str += AnyTime.pad(t % 60, 2);
              break;
            case 'f': // Microseconds (000000..999999)
            case 'j': // Day of year (001..366)
            case 'U': // Week (00..53), where Sunday is the first day of the week
            case 'u': // Week (00..53), where Monday is the first day of the week
            case 'V': // Week (01..53), where Sunday is the first day of the week; used with %X
            case 'v': // Week (01..53), where Monday is the first day of the week; used with %x
            case 'X': // Year for the week where Sunday is the first day of the week, numeric, four digits; used with %V
            case 'x': // Year for the week, where Monday is the first day of the week, numeric, four digits; used with %v
              throw '%' + ch + ' not implemented by AnyTime.Converter';
            default: // for any character not listed above
              str += this.fmt.substr(f, 2);
          } // switch ( this.fmt.charAt(f+1) )
          f++;
        } // else
      } // for ( var f = 0 ; f < _flen ; f++ )
      return str;

    }; // AnyTime.Converter.format()

    //-------------------------------------------------------------------------
    //  AnyTime.Converter.getUtcParseOffsetCaptured() returns the UTC offset
    //  last captured by a parsed string (or assumed by utcParseOffsetAssumed).
    //  It returns Number.MIN_VALUE if this object was not constructed with
    //  the utcParseOffsetCapture option set to true, or if an offset was not
    //  specified by the last parsed string or utcParseOffsetAssumed.
    //-------------------------------------------------------------------------

    this.getUtcParseOffsetCaptured = function() {
      return _offCap;
    };

    //-------------------------------------------------------------------------
    //  AnyTime.Converter.getUtcParseOffsetCaptured() returns the UTC offset
    //  last captured by a parsed string (or assumed by utcParseOffsetAssumed).
    //  It returns Number.MIN_VALUE if this object was not constructed with
    //  the utcParseOffsetCapture option set to true, or if an offset was not
    //  specified by the last parsed string or utcParseOffsetAssumed.
    //-------------------------------------------------------------------------

    this.getUtcParseOffsetSubIndex = function() {
      return _offPSI;
    };

    //-------------------------------------------------------------------------
    //  AnyTime.Converter.parse() returns a Date initialized from a specified
    //  string, using the format passed to AnyTime.Converter().
    //
    //  Method parameter:
    //
    //    str - the String object to be converted
    //-------------------------------------------------------------------------

    this.parse = function(str) {
      _offCap = _offP;
      _offPSI = (-1);
      var era = 1;
      var time = new Date(4, 0, 1, 0, 0, 0, 0);//4=leap year bug
      var slen = str.length;
      var s = 0;
      var tzSign = 1, tzOff = _offP;
      var i, matched, sub, sublen, temp;
      for (var f = 0; f < _flen; f++) {
        if (this.fmt.charAt(f) == '%') {
          var ch = this.fmt.charAt(f + 1);
          switch (ch) {
            case 'a': // Abbreviated weekday name (Sun..Sat)
              matched = false;
              for (sublen = 0; s + sublen < slen; sublen++) {
                sub = str.substr(s, sublen);
                for (i = 0; i < 12; i++)
                  if (this.dAbbr[i] == sub) {
                    matched = true;
                    s += sublen;
                    break;
                  }
                if (matched)
                  break;
              } // for ( sublen ... )
              if (! matched)
                throw 'unknown weekday: ' + str.substr(s);
              break;
            case 'B': // BCE string (eAbbr[0]), only if needed. (NON-MYSQL)
              sublen = this.eAbbr[0].length;
              if (( s + sublen <= slen ) && ( str.substr(s, sublen) == this.eAbbr[0] )) {
                era = (-1);
                s += sublen;
              }
              break;
            case 'b': // Abbreviated month name (Jan..Dec)
              matched = false;
              for (sublen = 0; s + sublen < slen; sublen++) {
                sub = str.substr(s, sublen);
                for (i = 0; i < 12; i++)
                  if (this.mAbbr[i] == sub) {
                    time.setMonth(i);
                    matched = true;
                    s += sublen;
                    break;
                  }
                if (matched)
                  break;
              } // for ( sublen ... )
              if (! matched)
                throw 'unknown month: ' + str.substr(s);
              break;
            case 'C': // CE string (eAbbr[1]), only if needed. (NON-MYSQL)
              sublen = this.eAbbr[1].length;
              if (( s + sublen <= slen ) && ( str.substr(s, sublen) == this.eAbbr[1] ))
                s += sublen; // note: CE is the default era
              break;
            case 'c': // Month, numeric (0..12)
              if (( s + 1 < slen ) && this.dAt(str, s + 1)) {
                time.setMonth((Number(str.substr(s, 2)) - 1) % 12);
                s += 2;
              }
              else {
                time.setMonth((Number(str.substr(s, 1)) - 1) % 12);
                s++;
              }
              break;
            case 'D': // Day of the month with English suffix (0th,1st,...)
              if (( s + 1 < slen ) && this.dAt(str, s + 1)) {
                time.setDate(Number(str.substr(s, 2)));
                s += 4;
              }
              else {
                time.setDate(Number(str.substr(s, 1)));
                s += 3;
              }
              break;
            case 'd': // Day of the month, numeric (00..31)
              time.setDate(Number(str.substr(s, 2)));
              s += 2;
              break;
            case 'E': // era string (from eAbbr[]) (NON-MYSQL)
              sublen = this.eAbbr[0].length;
              if (( s + sublen <= slen ) && ( str.substr(s, sublen) == this.eAbbr[0] )) {
                era = (-1);
                s += sublen;
              }
              else if (( s + ( sublen = this.eAbbr[1].length ) <= slen ) && ( str.substr(s, sublen) == this.eAbbr[1] ))
                s += sublen; // note: CE is the default era
              else
                throw 'unknown era: ' + str.substr(s);
              break;
            case 'e': // Day of the month, numeric (0..31)
              if (( s + 1 < slen ) && this.dAt(str, s + 1)) {
                time.setDate(Number(str.substr(s, 2)));
                s += 2;
              }
              else {
                time.setDate(Number(str.substr(s, 1)));
                s++;
              }
              break;
            case 'f': // Microseconds (000000..999999)
              s += 6; // SKIPPED!
              break;
            case 'H': // Hour (00..23)
              time.setHours(Number(str.substr(s, 2)));
              s += 2;
              break;
            case 'h': // Hour (01..12)
            case 'I': // Hour (01..12)
              time.setHours(Number(str.substr(s, 2)));
              s += 2;
              break;
            case 'i': // Minutes, numeric (00..59)
              time.setMinutes(Number(str.substr(s, 2)));
              s += 2;
              break;
            case 'k': // Hour (0..23)
              if (( s + 1 < slen ) && this.dAt(str, s + 1)) {
                time.setHours(Number(str.substr(s, 2)));
                s += 2;
              }
              else {
                time.setHours(Number(str.substr(s, 1)));
                s++;
              }
              break;
            case 'l': // Hour (1..12)
              if (( s + 1 < slen ) && this.dAt(str, s + 1)) {
                time.setHours(Number(str.substr(s, 2)));
                s += 2;
              }
              else {
                time.setHours(Number(str.substr(s, 1)));
                s++;
              }
              break;
            case 'M': // Month name (January..December)
              matched = false;
              for (sublen = _shortMon; s + sublen <= slen; sublen++) {
                if (sublen > _longMon)
                  break;
                sub = str.substr(s, sublen);
                for (i = 0; i < 12; i++) {
                  if (this.mNames[i] == sub) {
                    time.setMonth(i);
                    matched = true;
                    s += sublen;
                    break;
                  }
                }
                if (matched)
                  break;
              }
              break;
            case 'm': // Month, numeric (00..12)
              time.setMonth((Number(str.substr(s, 2)) - 1) % 12);
              s += 2;
              break;
            case 'p': // AM or PM
              if (time.getHours() == 12) {
                if (str.charAt(s) == 'A')
                  time.setHours(0);
              }
              else if (str.charAt(s) == 'P')
                time.setHours(time.getHours() + 12);
              s += 2;
              break;
            case 'r': // Time, 12-hour (hh:mm:ss followed by AM or PM)
              time.setHours(Number(str.substr(s, 2)));
              time.setMinutes(Number(str.substr(s + 3, 2)));
              time.setSeconds(Number(str.substr(s + 6, 2)));
              if (time.getHours() == 12) {
                if (str.charAt(s) == 'A')
                  time.setHours(0);
              }
              else if (str.charAt(s) == 'P')
                time.setHours(time.getHours() + 12);
              s += 10;
              break;
            case 'S': // Seconds (00..59)
            case 's': // Seconds (00..59)
              time.setSeconds(Number(str.substr(s, 2)));
              s += 2;
              break;
            case 'T': // Time, 24-hour (hh:mm:ss)
              time.setHours(Number(str.substr(s, 2)));
              time.setMinutes(Number(str.substr(s + 3, 2)));
              time.setSeconds(Number(str.substr(s + 6, 2)));
              s += 8;
              break;
            case 'W': // Weekday name (Sunday..Saturday)
              matched = false;
              for (sublen = _shortDay; s + sublen <= slen; sublen++) {
                if (sublen > _longDay)
                  break;
                sub = str.substr(s, sublen);
                for (i = 0; i < 7; i++) {
                  if (this.dNames[i] == sub) {
                    matched = true;
                    s += sublen;
                    break;
                  }
                }
                if (matched)
                  break;
              }
              break;
            case 'w': // Day of the week (0=Sunday..6=Saturday) (ignored)
              s += 1;
              break;
            case 'Y': // Year, numeric, four digits, negative if before 0001
              i = 4;
              if (str.substr(s, 1) == '-')
                i++;
              time.setFullYear(Number(str.substr(s, i)));
              s += i;
              break;
            case 'y': // Year, numeric (two digits), negative before baseYear
              i = 2;
              if (str.substr(s, 1) == '-')
                i++;
              temp = Number(str.substr(s, i));
              if (typeof(this.baseYear) == 'number')
                temp += this.baseYear;
              else if (temp < 70)
                temp += 2000;
              else
                temp += 1900;
              time.setFullYear(temp);
              s += i;
              break;
            case 'Z': // Year, numeric, four digits, unsigned (NON-MYSQL)
              time.setFullYear(Number(str.substr(s, 4)));
              s += 4;
              break;
            case 'z': // Year, numeric, variable length, unsigned (NON-MYSQL)
              i = 0;
              while (( s < slen ) && this.dAt(str, s))
                i = ( i * 10 ) + Number(str.charAt(s++));
              time.setFullYear(i);
              break;
            case '#': // signed timezone offset in minutes.
              if (str.charAt(s++) == '-')
                tzSign = (-1);
              for (tzOff = 0; ( s < slen ) && (String(i = Number(str.charAt(s))) == str.charAt(s)); s++)
                tzOff = ( tzOff * 10 ) + i;
              tzOff *= tzSign;
              break;
            case '@': // timezone label
              _offPSI = (-1);
              if (AnyTime.utcLabel) {
                matched = false;
                for (tzOff in AnyTime.utcLabel)
                  if (! Array.prototype[tzOff]) // prototype.js compatibility issue
                  {
                    for (i = 0; i < AnyTime.utcLabel[tzOff].length; i++) {
                      sub = AnyTime.utcLabel[tzOff][i];
                      sublen = sub.length;
                      if (( s + sublen <= slen ) && ( str.substr(s, sublen) == sub )) {
                        s += sublen;
                        matched = true;
                        break;
                      }
                    }
                    if (matched)
                      break;
                  }
                if (matched) {
                  _offPSI = i;
                  tzOff = Number(tzOff);
                  break; // case
                }
              }
              if (( s + 9 < slen ) || ( str.substr(s, 3) != "UTC" ))
                throw 'unknown time zone: ' + str.substr(s);
              s += 3;
              ch = ':'; // drop through for offset parsing
            case '-': // signed, 3-or-4-digit timezone offset in hours and minutes
            case '+': // signed, 4-digit timezone offset in hours and minutes
            case ':': // signed 4-digit timezone offset with colon delimiter
            case ';': // signed 3-or-4-digit timezone offset with colon delimiter
              if (str.charAt(s++) == '-')
                tzSign = (-1);
              tzOff = Number(str.charAt(s));
              if ((ch == '+') || (ch == ':') || ((s + 3 < slen) && (String(Number(str.charAt(s + 3))) !== str.charAt(s + 3))))
                tzOff = (tzOff * 10) + Number(str.charAt(++s));
              tzOff *= 60;
              if ((ch == ':') || (ch == ';'))
                s++; // skip ":" (assumed)
              tzOff = ( tzOff + Number(str.substr(++s, 2)) ) * tzSign;
              s += 2;
              break;
            case 'j': // Day of year (001..366)
            case 'U': // Week (00..53), where Sunday is the first day of the week
            case 'u': // Week (00..53), where Monday is the first day of the week
            case 'V': // Week (01..53), where Sunday is the first day of the week; used with %X
            case 'v': // Week (01..53), where Monday is the first day of the week; used with %x
            case 'X': // Year for the week where Sunday is the first day of the week, numeric, four digits; used with %V
            case 'x': // Year for the week, where Monday is the first day of the week, numeric, four digits; used with %v
              throw '%' + this.fmt.charAt(f + 1) + ' not implemented by AnyTime.Converter';
            case '%': // A literal '%' character
            default: // for any character not listed above
              throw '%' + this.fmt.charAt(f + 1) + ' reserved for future use';
              break;
          }
          f++;
        } // if ( this.fmt.charAt(f) == '%' )
        else if (this.fmt.charAt(f) != str.charAt(s))
          throw str + ' is not in "' + this.fmt + '" format';
        else
          s++;
      } // for ( var f ... )
      if (era < 0)
        time.setFullYear(0 - time.getFullYear());
      if (tzOff != Number.MIN_VALUE) {
        if (_captureOffset)
          _offCap = tzOff;
        else
          time.setTime(( time.getTime() - (tzOff * 60000) ) - (time.getTimezoneOffset() * 60000));
      }

      return time;

    }; // AnyTime.Converter.parse()

    //-------------------------------------------------------------------------
    //  AnyTime.Converter.setUtcFormatOffsetAlleged()  sets the offset from
    //  UTC, in minutes, to claim that a Date object represents during
    //  formatting, even though it is formatted using local time.  This merely
    //  reports the alleged offset when a timezone specifier (%#, %+, %-, %:,
    //  %; or %@) is encountered in the format string--it does not otherwise
    //  affect the date/time value.  This primarily exists so AnyTime.picker
    //  can edit the time as specified (without conversion to local time) and
    //  then convert the edited time to a different time zone (as selected
    //  using the picker).  This method returns the previous value, if any,
    //  set by the utcFormatOffsetAlleged option, or a previous call to
    //  setUtcFormatOffsetAlleged(), or Number.MIN_VALUE if no offset was
    //  previously-alleged.  Call this method with Number.MIN_VALUE to cancel
    //  any prior value.  Note that if a format offset is alleged, any offset
    //  specified by option utcFormatOffsetImposed is ignored.
    //-------------------------------------------------------------------------

    this.setUtcFormatOffsetAlleged = function(offset) {
      var prev = _offAl;
      _offAl = offset;
      return prev;
    };

    //-------------------------------------------------------------------------
    //  AnyTime.Converter.setUtcFormatOffsetSubIndex() sets the sub-index
    //  to choose from the AnyTime.utcLabel array of arrays when formatting
    //  a Date using the %@ specifier.  For more information, see option
    //  AnyTime.Converter.utcFormatOffsetSubIndex.  This primarily exists so
    //  AnyTime.picker can specify the Time Zone label selected using the
    //  picker).  This method returns the previous value, if any, set by the
    //  utcFormatOffsetSubIndex option, or a previous call to
    //  setUtcFormatOffsetAlleged(), or (-1) if no sub-index was previously-
    //  chosen.  Call this method with (-1) to cancel any prior value.
    //-------------------------------------------------------------------------

    this.setUtcFormatOffsetSubIndex = function(subIndex) {
      var prev = _offFSI;
      _offFSI = subIndex;
      return prev;
    };

    //-------------------------------------------------------------------------
    //  AnyTime.Converter construction code:
    //-------------------------------------------------------------------------

    (function(_this) {
      var i, len;

      options = jQuery.extend(true, {}, options || {});

      if (options.baseYear)
        _this.baseYear = Number(options.baseYear);

      if (options.format)
        _this.fmt = options.format;

      _flen = _this.fmt.length;

      if (options.dayAbbreviations)
        _this.dAbbr = $.makeArray(options.dayAbbreviations);

      if (options.dayNames) {
        _this.dNames = $.makeArray(options.dayNames);
        _longDay = 1;
        _shortDay = 1000;
        for (i = 0; i < 7; i++) {
          len = _this.dNames[i].length;
          if (len > _longDay)
            _longDay = len;
          if (len < _shortDay)
            _shortDay = len;
        }
      }

      if (options.eraAbbreviations)
        _this.eAbbr = $.makeArray(options.eraAbbreviations);

      if (options.monthAbbreviations)
        _this.mAbbr = $.makeArray(options.monthAbbreviations);

      if (options.monthNames) {
        _this.mNames = $.makeArray(options.monthNames);
        _longMon = 1;
        _shortMon = 1000;
        for (i = 0; i < 12; i++) {
          len = _this.mNames[i].length;
          if (len > _longMon)
            _longMon = len;
          if (len < _shortMon)
            _shortMon = len;
        }
      }

      if (typeof options.utcFormatOffsetImposed != "undefined")
        _offF = options.utcFormatOffsetImposed;

      if (typeof options.utcParseOffsetAssumed != "undefined")
        _offP = options.utcParseOffsetAssumed;

      if (options.utcParseOffsetCapture)
        _captureOffset = true;

    })(this); // AnyTime.Converter construction

  }; // AnyTime.Converter =

//=============================================================================
//  AnyTime.noPicker()
//
//  Removes the date/time entry picker attached to a specified text field.
//=============================================================================

  AnyTime.noPicker = function(id) {
    if (__pickers[id]) {
      __pickers[id].cleanup();
      delete __pickers[id];
    }
  };

//=============================================================================
//  AnyTime.picker()
//
//  Creates a date/time entry picker attached to a specified text field.
//  Instead of entering a date and/or time into the text field, the user
//  selects legal combinations using the picker, and the field is auto-
//  matically populated.  The picker can be incorporated into the page
//  "inline", or used as a "popup" that appears when the text field is
//  clicked and disappears when the picker is dismissed. Ajax can be used
//  to send the selected value to a server to approve or veto it.
//
//  To create a picker, simply include the necessary files in an HTML page
//  and call the function for each date/time input field.  The following
//  example creates a popup picker for field "foo" using the default
//  format, and a second date-only (no time) inline (always-visible)
//  Ajax-enabled picker for field "bar":
//
//    <link rel="stylesheet" type="text/css" href="anytime.css" />
//    <script type="text/javascript" src="jquery.js"></script>
//    <script type="text/javascript" src="anytime.js"></script>
//    <input type="text" id="foo" tabindex="1" value="1967-07-30 23:45" />
//    <input type="text" id="bar" tabindex="2" value="01/06/90" />
//    <script type="text/javascript">
//      AnyTime.picker( "foo" );
//      AnyTime.picker( "bar", { placement:"inline", format: "%m/%d/%y",
//                ajaxOptions { url: "/some/server/page/" } } );
//    </script>
//
//  The appearance of the picker can be extensively modified using CSS styles.
//  A default appearance can be achieved by the "anytime.css" stylesheet that
//  accompanies this script.  The default style looks better in browsers other
//  than Internet Explorer (before IE8) because older versions of IE do not
//  properly implement the CSS box model standard; however, it is passable in
//  Internet Explorer as well.
//
//  Method parameters:
//
//  id - the "id" attribute of the textfield to associate with the
//    AnyTime.picker object.  The AnyTime.picker will attach itself
//    to the textfield and manage its value.
//
//  options - an object (associative array) of optional parameters that
//    override default behaviors.  The supported options are:
//
//    ajaxOptions - options passed to jQuery's $.ajax() method whenever
//      the user dismisses a popup picker or selects a value in an inline
//      picker.  The input's name (or ID) and value are passed to the
//      server (appended to ajaxOptions.data, if present), and the
//      "success" handler sets the input's value to the responseText.
//      Therefore, the text returned by the server must be valid for the
//      input'sdate/time format, and the server can approve or veto the
//      value chosen by the user. For more information, see:
//      http://docs.jquery.com/Ajax.
//      If ajaxOptions.success is specified, it is used instead of the
//      default "success" behavior.
//
//    askEra - if true, buttons to select the era are shown on the year
//        selector popup, even if format specifier does not include the
//        era.  If false, buttons to select the era are NOT shown, even
//        if the format specifier includes ther era.  Normally, era buttons
//        are only shown if the format string specifies the era.
//
//    askSecond - if false, buttons for number-of-seconds are not shown
//        even if the format includes seconds.  Normally, the buttons
//        are shown if the format string includes seconds.
//
//    earliest - String or Date object representing the earliest date/time
//        that a user can select.  For best results if the field is only
//        used to specify a date, be sure to set the time to 00:00:00.
//        If a String is used, it will be parsed according to the picker's
//        format (see AnyTime.Converter.format()).
//
//    firstDOW - a value from 0 (Sunday) to 6 (Saturday) stating which
//      day should appear at the beginning of the week.  The default is 0
//      (Sunday).  The most common substitution is 1 (Monday).  Note that
//      if custom arrays are specified for AnyTime.Converter's dayAbbreviations
//      and/or dayNames options, they should nonetheless begin with the
//      value for Sunday.
//
//    hideInput - if true, the <input> is "hidden" (the picker appears in 
//      its place). This actually sets the border, height, margin, padding
//      and width of the field as small as possivle, so it can still get focus.
//      If you try to hide the field using traditional techniques (such as
//      setting "display:none"), the picker will not behave correctly.
//
//    labelDayOfMonth - the label for the day-of-month "buttons".
//      Can be any HTML!  If not specified, "Day of Month" is assumed.
//
//    labelDismiss - the label for the dismiss "button" (if placement is
//      "popup"). Can be any HTML!  If not specified, "X" is assumed.
//
//    labelHour - the label for the hour "buttons".
//      Can be any HTML!  If not specified, "Hour" is assumed.
//
//    labelMinute - the label for the minute "buttons".
//      Can be any HTML!  If not specified, "Minute" is assumed.
//
//    labelMonth - the label for the month "buttons".
//      Can be any HTML!  If not specified, "Month" is assumed.
//
//    labelTimeZone - the label for the UTC offset (timezone) "buttons".
//      Can be any HTML!  If not specified, "Time Zone" is assumed.
//
//    labelSecond - the label for the second "buttons".
//      Can be any HTML!  If not specified, "Second" is assumed.
//      This option is ignored if askSecond is false!
//
//    labelTitle - the label for the "title bar".  Can be any HTML!
//      If not specified, then whichever of the following is most
//      appropriate is used:  "Select a Date and Time", "Select a Date"
//      or "Select a Time", or no label if only one field is present.
//
//    labelYear - the label for the year "buttons".
//      Can be any HTML!  If not specified, "Year" is assumed.
//
//    latest - String or Date object representing the latest date/time
//        that a user can select.  For best results if the field is only
//        used to specify a date, be sure to set the time to 23:59:59.
//        If a String is used, it will be parsed according to the picker's
//        format (see AnyTime.Converter.format()).
//
//    placement - One of the following strings:
//
//      "popup" = the picker appears above its <input> when the input
//        receives focus, and disappears when it is dismissed.  This is
//        the default behavior.
//
//      "inline" = the picker is placed immediately after the <input>
//        and remains visible at all times.  When choosing this placement,
//        it is best to make the <input> invisible and use only the
//        picker to select dates.  The <input> value can still be used
//        during form submission as it will always reflect the current
//        picker state.
//
//        WARNING: when using "inline" and XHTML and including a day-of-
//        the-month format field, the input may only appear where a <table>
//        element is permitted (for example, NOT within a <p> element).
//        This is because the picker uses a <table> element to arrange
//        the day-of-the-month (calendar) buttons.  Failure to follow this
//        advice may result in an "unknown error" in Internet Explorer.
//
//    The following additional options may be specified; see documentation
//    for AnyTime.Converter (above) for information about these options:
//
//      baseYear
//      dayAbbreviations
//      dayNames
//      eraAbbreviations
//      format
//      monthAbbreviations
//      monthNames
//
//  Other behavior, such as how to format the values on the display
//  and which "buttons" to include, is inferred from the format string.
//=============================================================================

  AnyTime.picker = function(id, options) {
    //  Create a new private object instance to manage the picker,
    //  if one does not already exist.

    if (__pickers[id])
      throw 'Cannot create another AnyTime picker for "' + id + '"';

    var _this = null;

    __pickers[id] =
    {
      //  private members

      twelveHr: false,
      ajaxOpts: null,   // options for AJAX requests
      denyTab: true,      // set to true to stop Opera from tabbing away
      askEra: false,    // prompt the user for the era in yDiv?
      cloak: null,    // cloak div
      conv: null,     // AnyTime.Converter
      bMinW: 0,     // min width of body div
      bMinH: 0,     // min height of body div
      dMinW: 0,       // min width of date div
      dMinH: 0,     // min height of date div
      div: null,      // picker div
      dB: null,     // body div
      dD: null,     // date div
      dY: null,     // years div
      dMo: null,      // months div
      dDoM: null,     // date-of-month table
      hDoM: null,     // date-of-month heading
      hMo: null,      // month heading
      hTitle: null,   // title heading
      hY: null,     // year heading
      dT: null,     // time div
      dH: null,     // hours div
      dM: null,     // minutes div
      dS: null,     // seconds div
      dO: null,           // offset (time zone) div
      earliest: null,   // earliest selectable date/time
      fBtn: null,     // button with current focus
      fDOW: 0,      // index to use as first day-of-week
      hBlur: null,        // input handler
      hClick: null,       // input handler
      hFocus: null,       // input handler
      hKeydown: null,     // input handler
      hKeypress: null,    // input handler
      id: null,     // picker ID
      inp: null,      // input text field
      latest: null,   // latest selectable date/time
      lastAjax: null,   // last value submitted using AJAX
      lostFocus: false, // when focus is lost, must redraw
      lX: 'X',      // label for dismiss button
      lY: 'Year',     // label for year
      lO: 'Time Zone',    // label for UTC offset (time zone)
      oBody: null,        // UTC offset selector popup
      oConv: null,        // AnyTime.Converter for offset display
      oCur: null,         // current-UTC-offset button
      oDiv: null,     // UTC offset selector popup
      oLab: null,     // UTC offset label
      oListMinW: 0,       // min width of offset list element
      oMinW: 0,           // min width of UTC offset element
      oSel: null,         // select (plus/minus) UTC-offset button
      offMin: Number.MIN_VALUE, // current UTC offset in minutes
      offSI: -1,          // current UTC label sub-index (if any)
      offStr: "",         // current UTC offset (time zone) string
      pop: true,      // picker is a popup?
      time: null,     // current date/time
      tMinW: 0,     // min width of time div
      tMinH: 0,     // min height of time div
      url: null,      // URL to submit value using AJAX
      wMinW: 0,     // min width of picker
      wMinH: 0,     // min height of picker
      yAhead: null,   // years-ahead button
      y0XXX: null,    // millenium-digit-zero button (for focus)
      yCur: null,     // current-year button
      yDiv: null,     // year selector popup
      yLab: null,     // year label
      yNext: null,    // next-year button
      yPast: null,    // years-past button
      yPrior: null,   // prior-year button

      //---------------------------------------------------------------------
      //  .initialize() initializes the picker instance.
      //---------------------------------------------------------------------

      initialize: function(id) {
        _this = this;

        this.id = 'AnyTime--' + id.replace(/[^-_.A-Za-z0-9]/g, '--AnyTime--');

        options = jQuery.extend(true, {}, options || {});
        options.utcParseOffsetCapture = true;
        this.conv = new AnyTime.Converter(options);

        if (options.placement) {
          if (options.placement == 'inline')
            this.pop = false;
          else if (options.placement != 'popup')
            throw 'unknown placement: ' + options.placement;
        }

        if (options.ajaxOptions) {
          this.ajaxOpts = jQuery.extend({}, options.ajaxOptions);
          if (! this.ajaxOpts.success)
            this.ajaxOpts.success = function(data, status) {
              _this.inp.val(data);
            };
        }

        if (options.earliest) {
          if (typeof options.earliest.getTime == 'function')
            this.earliest = options.earliest.getTime();
          else
            this.earliest = this.conv.parse(options.earliest.toString());
        }

        if (options.firstDOW) {
          if (( options.firstDOW < 0 ) || ( options.firstDOW > 6 ))
            throw new Exception('illegal firstDOW: ' + options.firstDOW);
          this.fDOW = options.firstDOW;
        }

        if (options.latest) {
          if (typeof options.latest.getTime == 'function')
            this.latest = options.latest.getTime();
          else
            this.latest = this.conv.parse(options.latest.toString());
        }

        this.lX = options.labelDismiss || 'X';
        this.lY = options.labelYear || 'Year';
        this.lO = options.labelTimeZone || 'Time Zone';

        //  Infer what we can about what to display from the format.

        var i;
        var t;
        var lab;
        var shownFields = 0;
        var format = this.conv.fmt;

        if (typeof options.askEra != 'undefined')
          this.askEra = options.askEra;
        else
          this.askEra = (format.indexOf('%B') >= 0) || (format.indexOf('%C') >= 0) || (format.indexOf('%E') >= 0);
        var askYear = (format.indexOf('%Y') >= 0) || (format.indexOf('%y') >= 0) || (format.indexOf('%Z') >= 0) || (format.indexOf('%z') >= 0);
        var askMonth = (format.indexOf('%b') >= 0) || (format.indexOf('%c') >= 0) || (format.indexOf('%M') >= 0) || (format.indexOf('%m') >= 0);
        var askDoM = (format.indexOf('%D') >= 0) || (format.indexOf('%d') >= 0) || (format.indexOf('%e') >= 0);
        var askDate = askYear || askMonth || askDoM;
        this.twelveHr = (format.indexOf('%h') >= 0) || (format.indexOf('%I') >= 0) || (format.indexOf('%l') >= 0) || (format.indexOf('%r') >= 0);
        var askHour = this.twelveHr || (format.indexOf('%H') >= 0) || (format.indexOf('%k') >= 0) || (format.indexOf('%T') >= 0);
        var askMinute = (format.indexOf('%i') >= 0) || (format.indexOf('%r') >= 0) || (format.indexOf('%T') >= 0);
        var askSec = ( (format.indexOf('%r') >= 0) || (format.indexOf('%S') >= 0) || (format.indexOf('%s') >= 0) || (format.indexOf('%T') >= 0) );
        if (askSec && ( typeof options.askSecond != 'undefined' ))
          askSec = options.askSecond;
        var askOff = ( (format.indexOf('%#') >= 0) || (format.indexOf('%+') >= 0) || (format.indexOf('%-') >= 0) || (format.indexOf('%:') >= 0) || (format.indexOf('%;') >= 0) || (format.indexOf('%<') >= 0) || (format.indexOf('%>') >= 0) || (format.indexOf('%@') >= 0) );
        var askTime = askHour || askMinute || askSec || askOff;

        if (askOff)
          this.oConv = new AnyTime.Converter({ format: options.formatUtcOffset ||
                  format.match(/\S*%[-+:;<>#@]\S*/g).join(' ') });

        //  Create the picker HTML and add it to the page.
        //  Popup pickers will be moved to the end of the body
        //  once the entire page has loaded.

        this.inp = $(document.getElementById(id)); // avoids ID-vs-pseudo-selector probs like id="foo:bar"
        this.div = $('<div class="AnyTime-win AnyTime-pkr ui-widget ui-widget-content ui-corner-all" style="width:0;height:0" id="' + this.id + '" aria-live="off"/>');
        this.inp.after(this.div);
        this.wMinW = this.div.outerWidth(!$.browser.safari);
        this.wMinH = this.div.AnyTime_height(true);
        this.hTitle = $('<h5 class="AnyTime-hdr ui-widget-header ui-corner-top"/>');
        this.div.append(this.hTitle);
        this.dB = $('<div class="AnyTime-body" style="width:0;height:0"/>');
        this.div.append(this.dB);
        this.bMinW = this.dB.outerWidth(true);
        this.bMinH = this.dB.AnyTime_height(true);

        if (options.hideInput)
          this.inp.css({border:0,height:'1px',margin:0,padding:0,width:'1px'});

        //  Add dismiss box to title (if popup)

        t = null;
        var xDiv = null;
        if (this.pop) {
          xDiv = $('<div class="AnyTime-x-btn ui-state-default">' + this.lX + '</div>');
          this.hTitle.append(xDiv);
          xDiv.click(function(e) {
            _this.dismiss(e);
          });
        }

        //  date (calendar) portion

        lab = '';
        if (askDate) {
          this.dD = $('<div class="AnyTime-date" style="width:0;height:0"/>');
          this.dB.append(this.dD);
          this.dMinW = this.dD.outerWidth(true);
          this.dMinH = this.dD.AnyTime_height(true);

          if (askYear) {
            this.yLab = $('<h6 class="AnyTime-lbl AnyTime-lbl-yr">' + this.lY + '</h6>');
            this.dD.append(this.yLab);

            this.dY = $('<ul class="AnyTime-yrs ui-helper-reset" />');
            this.dD.append(this.dY);

            this.yPast = this.btn(this.dY, '&lt;', this.newYear, ['yrs-past'], '- ' + this.lY);
            this.yPrior = this.btn(this.dY, '1', this.newYear, ['yr-prior'], '-1 ' + this.lY);
            this.yCur = this.btn(this.dY, '2', this.newYear, ['yr-cur'], this.lY);
            this.yCur.removeClass('ui-state-default');
            this.yCur.addClass('AnyTime-cur-btn ui-state-default ui-state-highlight');

            this.yNext = this.btn(this.dY, '3', this.newYear, ['yr-next'], '+1 ' + this.lY);
            this.yAhead = this.btn(this.dY, '&gt;', this.newYear, ['yrs-ahead'], '+ ' + this.lY);

            shownFields++;

          } // if ( askYear )

          if (askMonth) {
            lab = options.labelMonth || 'Month';
            this.hMo = $('<h6 class="AnyTime-lbl AnyTime-lbl-month">' + lab + '</h6>');
            this.dD.append(this.hMo);
            this.dMo = $('<ul class="AnyTime-mons" />');
            this.dD.append(this.dMo);
            for (i = 0; i < 12; i++) {
              var mBtn = this.btn(this.dMo, this.conv.mAbbr[i],
                      function(event) {
                        var elem = $(event.target);
                        if (elem.hasClass("AnyTime-out-btn"))
                          return;
                        var mo = event.target.AnyTime_month;
                        var t = new Date(this.time.getTime());
                        if (t.getDate() > __daysIn[mo])
                          t.setDate(__daysIn[mo])
                        t.setMonth(mo);
                        this.set(t);
                        this.upd(elem);
                      },
                      ['mon','mon' + String(i + 1)], lab + ' ' + this.conv.mNames[i]);
              mBtn[0].AnyTime_month = i;
            }
            shownFields++;
          }

          if (askDoM) {
            lab = options.labelDayOfMonth || 'Day of Month';
            this.hDoM = $('<h6 class="AnyTime-lbl AnyTime-lbl-dom">' + lab + '</h6>');
            this.dD.append(this.hDoM);
            this.dDoM = $('<table border="0" cellpadding="0" cellspacing="0" class="AnyTime-dom-table"/>');
            this.dD.append(this.dDoM);
            t = $('<thead class="AnyTime-dom-head"/>');
            this.dDoM.append(t);
            var tr = $('<tr class="AnyTime-dow"/>');
            t.append(tr);
            for (i = 0; i < 7; i++)
              tr.append('<th class="AnyTime-dow AnyTime-dow' + String(i + 1) + '">' + this.conv.dAbbr[(this.fDOW + i) % 7] + '</th>');

            var tbody = $('<tbody class="AnyTime-dom-body" />');
            this.dDoM.append(tbody);
            for (var r = 0; r < 6; r++) {
              tr = $('<tr class="AnyTime-wk AnyTime-wk' + String(r + 1) + '"/>');
              tbody.append(tr);
              for (i = 0; i < 7; i++)
                this.btn(tr, 'x',
                        function(event) {
                          var elem = $(event.target);
                          if (elem.hasClass("AnyTime-out-btn"))
                            return;
                          var dom = Number(elem.html());
                          if (dom) {
                            var t = new Date(this.time.getTime());
                            t.setDate(dom);
                            this.set(t);
                            this.upd(elem);
                          }
                        },
                        ['dom'], lab);
            }
            shownFields++;

          } // if ( askDoM )

        } // if ( askDate )

        //  time portion

        if (askTime) {
          var tensDiv, onesDiv;

          this.dT = $('<div class="AnyTime-time" style="width:0;height:0" />');
          this.dB.append(this.dT);
          this.tMinW = this.dT.outerWidth(true);
          this.tMinH = this.dT.AnyTime_height(true);

          if (askHour) {
            this.dH = $('<div class="AnyTime-hrs"/>');
            this.dT.append(this.dH);

            lab = options.labelHour || 'Hour';
            this.dH.append($('<h6 class="AnyTime-lbl AnyTime-lbl-hr">' + lab + '</h6>'));
            var amDiv = $('<ul class="AnyTime-hrs-am"/>');
            this.dH.append(amDiv);
            var pmDiv = $('<ul class="AnyTime-hrs-pm"/>');
            this.dH.append(pmDiv);

            for (i = 0; i < 12; i++) {
              if (this.twelveHr) {
                if (i == 0)
                  t = '12am';
                else
                  t = String(i) + 'am';
              }
              else
                t = AnyTime.pad(i, 2);

              this.btn(amDiv, t, this.newHour, ['hr','hr' + String(i)], lab + ' ' + t);

              if (this.twelveHr) {
                if (i == 0)
                  t = '12pm';
                else
                  t = String(i) + 'pm';
              }
              else
                t = i + 12;

              this.btn(pmDiv, t, this.newHour, ['hr','hr' + String(i + 12)], lab + ' ' + t);
            }

            shownFields++;

          } // if ( askHour )

          if (askMinute) {
            this.dM = $('<div class="AnyTime-mins"/>');
            this.dT.append(this.dM);

            lab = options.labelMinute || 'Minute';
            this.dM.append($('<h6 class="AnyTime-lbl AnyTime-lbl-min">' + lab + '</h6>'));
            tensDiv = $('<ul class="AnyTime-mins-tens"/>');
            this.dM.append(tensDiv);

            for (i = 0; i < 6; i++)
              this.btn(tensDiv, i,
                      function(event) {
                        var elem = $(event.target);
                        if (elem.hasClass("AnyTime-out-btn"))
                          return;
                        var t = new Date(this.time.getTime());
                        t.setMinutes((Number(elem.text()) * 10) + (this.time.getMinutes() % 10));
                        this.set(t);
                        this.upd(elem);
                      },
                      ['min-ten','min' + i + '0'], lab + ' ' + i + '0');
            for (; i < 12; i++)
              this.btn(tensDiv, '&#160;', $.noop, ['min-ten','min' + i + '0'], lab + ' ' + i + '0').addClass('AnyTime-min-ten-btn-empty ui-state-default ui-state-disabled');

            onesDiv = $('<ul class="AnyTime-mins-ones"/>');
            this.dM.append(onesDiv);
            for (i = 0; i < 10; i++)
              this.btn(onesDiv, i,
                      function(event) {
                        var elem = $(event.target);
                        if (elem.hasClass("AnyTime-out-btn"))
                          return;
                        var t = new Date(this.time.getTime());
                        t.setMinutes((Math.floor(this.time.getMinutes() / 10) * 10) + Number(elem.text()));
                        this.set(t);
                        this.upd(elem);
                      },
                      ['min-one','min' + i], lab + ' ' + i);
            for (; i < 12; i++)
              this.btn(onesDiv, '&#160;', $.noop, ['min-one','min' + i + '0'], lab + ' ' + i).addClass('AnyTime-min-one-btn-empty ui-state-default ui-state-disabled');

            shownFields++;

          } // if ( askMinute )

          if (askSec) {
            this.dS = $('<div class="AnyTime-secs"/>');
            this.dT.append(this.dS);
            lab = options.labelSecond || 'Second';
            this.dS.append($('<h6 class="AnyTime-lbl AnyTime-lbl-sec">' + lab + '</h6>'));
            tensDiv = $('<ul class="AnyTime-secs-tens"/>');
            this.dS.append(tensDiv);

            for (i = 0; i < 6; i++)
              this.btn(tensDiv, i,
                      function(event) {
                        var elem = $(event.target);
                        if (elem.hasClass("AnyTime-out-btn"))
                          return;
                        var t = new Date(this.time.getTime());
                        t.setSeconds((Number(elem.text()) * 10) + (this.time.getSeconds() % 10));
                        this.set(t);
                        this.upd(elem);
                      },
                      ['sec-ten','sec' + i + '0'], lab + ' ' + i + '0');
            for (; i < 12; i++)
              this.btn(tensDiv, '&#160;', $.noop, ['sec-ten','sec' + i + '0'], lab + ' ' + i + '0').addClass('AnyTime-sec-ten-btn-empty ui-state-default ui-state-disabled');

            onesDiv = $('<ul class="AnyTime-secs-ones"/>');
            this.dS.append(onesDiv);
            for (i = 0; i < 10; i++)
              this.btn(onesDiv, i,
                      function(event) {
                        var elem = $(event.target);
                        if (elem.hasClass("AnyTime-out-btn"))
                          return;
                        var t = new Date(this.time.getTime());
                        t.setSeconds((Math.floor(this.time.getSeconds() / 10) * 10) + Number(elem.text()));
                        this.set(t);
                        this.upd(elem);
                      },
                      ['sec-one','sec' + i], lab + ' ' + i);
            for (; i < 12; i++)
              this.btn(onesDiv, '&#160;', $.noop, ['sec-one','sec' + i + '0'], lab + ' ' + i).addClass('AnyTime-sec-one-btn-empty ui-state-default ui-state-disabled');

            shownFields++;

          } // if ( askSec )

          if (askOff) {
            this.dO = $('<div class="AnyTime-offs" />');
            this.dT.append(this.dO);
            this.oMinW = this.dO.outerWidth(true);

            this.oLab = $('<h6 class="AnyTime-lbl AnyTime-lbl-off">' + this.lO + '</h6>');
            this.dO.append(this.oLab);

            var offDiv = $('<ul class="AnyTime-off-list ui-helper-reset" />');
            this.dO.append(offDiv);

            this.oCur = this.btn(offDiv, '', this.newOffset, ['off','off-cur'], lab);
            this.oCur.removeClass('ui-state-default');
            this.oCur.addClass('AnyTime-cur-btn ui-state-default ui-state-highlight');
            this.oCur.css({overflow:"hidden"});

            this.oSel = this.btn(offDiv, '&#177;', this.newOffset, ['off','off-select'], '+/- ' + this.lO);
            this.oListMinW = this.oCur.outerWidth(true) + this.oSel.outerWidth(true);

            shownFields++;
          }

        } // if ( askTime )

        //  Set the title.  If a title option has been specified, use it.
        //  Otherwise, determine a worthy title based on which (and how many)
        //  format fields have been specified.

        if (options.labelTitle)
          this.hTitle.append(options.labelTitle);
        else if (shownFields > 1)
          this.hTitle.append('Select a ' + (askDate ? (askTime ? 'Date and Time' : 'Date') : 'Time'));
        else
          this.hTitle.append('Select');


        //  Initialize the picker's date/time value.

        try {
          this.time = this.conv.parse(this.inp.val());
          this.offMin = this.conv.getUtcParseOffsetCaptured();
          this.offSI = this.conv.getUtcParseOffsetSubIndex();
        }
        catch (e) {
          this.time = new Date();
        }
        this.lastAjax = this.time;


        //  If this is a popup picker, hide it until needed.

        if (this.pop) {
          this.div.hide();
          if (__iframe)
            __iframe.hide();
          this.div.css('position', 'absolute');
        }

        //  Setup event listeners for the input and resize listeners for
        //  the picker.  Add the picker to the instances list (which is used
        //  to hide pickers if the user clicks off of them).

        this.inp.blur(this.hBlur =
                function(e) {
                  _this.inpBlur(e);
                });

        this.inp.click(this.hClick =
                function(e) {
                  _this.showPkr(e);
                });

        this.inp.focus(this.hFocus =
                function(e) {
                  if (_this.lostFocus)
                    _this.showPkr(e);
                  _this.lostFocus = false;
                });

        this.inp.keydown(this.hKeydown =
                function(e) {
                  _this.key(e);
                });

        this.inp.keypress(this.hKeypress =
                function(e) {
                  if ($.browser.opera && _this.denyTab)
                    e.preventDefault();
                });

        this.div.click(
                function(e) {
                  _this.lostFocus = false;
                  _this.inp.focus();
                });

        $(window).resize(
                function(e) {
                  _this.pos(e);
                });

        if (__initialized)
          this.onReady();

      }, // initialize()


      //---------------------------------------------------------------------
      //  .ajax() notifies the server of a value change using Ajax.
      //---------------------------------------------------------------------

      ajax: function() {
        if (this.ajaxOpts && ( this.time.getTime() != this.lastAjax.getTime() )) {
          try {
            var opts = jQuery.extend({}, this.ajaxOpts);
            if (typeof opts.data == 'object')
              opts.data[this.inp[0].name || this.inp[0].id] = this.inp.val();
            else {
              var opt = (this.inp[0].name || this.inp[0].id) + '=' + encodeURI(this.inp.val());
              if (opts.data)
                opts.data += '&' + opt;
              else
                opts.data = opt;
            }
            $.ajax(opts);
            this.lastAjax = this.time;
          }
          catch(e) {
          }
        }
        return;

      }, // .ajax()

      //---------------------------------------------------------------------
      //  .askOffset() is called by this.newOffset() when the UTC offset or
      //  +- selection button is clicked.
      //---------------------------------------------------------------------

      askOffset: function(event) {
        if (! this.oDiv) {
          this.makeCloak();

          this.oDiv = $('<div class="AnyTime-win AnyTime-off-selector ui-widget ui-widget-content ui-corner-all" style="position:absolute" />');
          this.div.append(this.oDiv);

          // the order here (HDR,BODY,XDIV,TITLE) is important for width calcluation:
          var title = $('<h5 class="AnyTime-hdr AnyTime-hdr-off-selector ui-widget-header ui-corner-top" />');
          this.oDiv.append(title);
          this.oBody = $('<div class="AnyTime-body AnyTime-body-off-selector" style="overflow:auto;white-space:nowrap" />');
          this.oDiv.append(this.oBody);
          var oBHS = this.oBody.AnyTime_height(true); // body spacing
          var oBWS = this.oBody.AnyTime_width(true);
          var oTWS = title.AnyTime_width(true);

          var xDiv = $('<div class="AnyTime-x-btn ui-state-default">' + this.lX + '</div>');
          title.append(xDiv);
          xDiv.click(function(e) {
            _this.dismissODiv(e);
          });
          title.append(this.lO);
          if (__msie6 || __msie7) // IE bugs!
            title.width(String(this.lO.length * 0.8) + "em");
          var oBW = title.AnyTime_width(true) - oBWS; // initial body width

          var cont = $('<ul class="AnyTime-off-off" />');
          var last = null;
          this.oBody.append(cont);
          var useSubIndex = (this.oConv.fmt.indexOf('%@') >= 0);
          var btnW = 0; // determine uniform button width
          if (AnyTime.utcLabel)
            for (var o = -720; o < 720; o++)
              if (AnyTime.utcLabel[o]) {
                this.oConv.setUtcFormatOffsetAlleged(o);
                for (var i = 0; i < AnyTime.utcLabel[o].length; i++) {
                  this.oConv.setUtcFormatOffsetSubIndex(i);
                  last = this.btn(cont, this.oConv.format(this.time), this.newOPos, ['off-off'], o);
                  last[0].AnyTime_offMin = o;
                  last[0].AnyTime_offSI = i;
                  var w = last.width();
                  if (w > btnW)
                    btnW = w;
                  if (! useSubIndex)
                    break; // for
                }
              }

          if (last)
            last.addClass('AnyTime-off-off-last-btn');

          // compute optimal width

          this.oBody.find('.AnyTime-off-off-btn').width(btnW); // set uniform button width
          if (last) {
            var lW = last.AnyTime_width(true);
            if (lW > oBW)
              oBW = lW + 1; // expand body to hold buttons
          }
          this.oBody.width(oBW);
          oBW = this.oBody.AnyTime_width(true);
          this.oDiv.width(oBW);
          if (__msie6 || __msie7) // IE bugs!
            title.width(oBW - oTWS);

          // compute optimal height

          var oH = this.oDiv.AnyTime_height(true);
          var oHmax = this.div.height() * 0.75;
          if (oH > oHmax) {
            oH = oHmax;
            this.oBody.height(oH - (title.AnyTime_height(true) + oBHS));
            this.oBody.width(this.oBody.width() + 20); // add nominal px for scrollbar
            this.oDiv.width(this.oDiv.width() + 20);
            if (__msie6 || __msie7) // IE bugs!
              title.width(this.oBody.AnyTime_width(true) - oTWS);
          }
          if (! __msie7) // IE7 bug!
            this.oDiv.height(String(oH) + 'px');

        } // if ( ! this.oDiv )
        else {
          this.cloak.show();
          this.oDiv.show();
        }
        this.pos(event);
        this.updODiv(null);

        var f = this.oDiv.find('.AnyTime-off-off-btn.AnyTime-cur-btn:first');
        if (! f.length)
          f = this.oDiv.find('.AnyTime-off-off-btn:first');
        this.setFocus(f);

      }, // .askOffset()

      //---------------------------------------------------------------------
      //  .askYear() is called by this.newYear() when the yPast or yAhead
      //  button is clicked.
      //---------------------------------------------------------------------

      askYear: function(event) {
        if (! this.yDiv) {
          this.makeCloak();

          this.yDiv = $('<div class="AnyTime-win AnyTime-yr-selector ui-widget ui-widget-content ui-corner-all" style="position:absolute" />');
          this.div.append(this.yDiv);

          var title = $('<h5 class="AnyTime-hdr AnyTime-hdr-yr-selector ui-widget-header ui-corner-top" />');
          this.yDiv.append(title);

          var xDiv = $('<div class="AnyTime-x-btn ui-state-default">' + this.lX + '</div>');
          title.append(xDiv);
          xDiv.click(function(e) {
            _this.dismissYDiv(e);
          });

          title.append(this.lY);

          var yBody = $('<div class="AnyTime-body AnyTime-body-yr-selector" />');
          var yW = yBody.AnyTime_width(true);
          var yH = 0;
          this.yDiv.append(yBody);

          cont = $('<ul class="AnyTime-yr-mil" />');
          yBody.append(cont);
          this.y0XXX = this.btn(cont, 0, this.newYPos, ['mil','mil0'], this.lY + ' ' + 0 + '000');
          for (i = 1; i < 10; i++)
            this.btn(cont, i, this.newYPos, ['mil','mil' + i], this.lY + ' ' + i + '000');
          yW += cont.AnyTime_width(true);
          if (yH < cont.AnyTime_height(true))
            yH = cont.AnyTime_height(true);

          cont = $('<ul class="AnyTime-yr-cent" />');
          yBody.append(cont);
          for (i = 0; i < 10; i++)
            this.btn(cont, i, this.newYPos, ['cent','cent' + i], this.lY + ' ' + i + '00');
          yW += cont.AnyTime_width(true);
          if (yH < cont.AnyTime_height(true))
            yH = cont.AnyTime_height(true);

          cont = $('<ul class="AnyTime-yr-dec" />');
          yBody.append(cont);
          for (i = 0; i < 10; i++)
            this.btn(cont, i, this.newYPos, ['dec','dec' + i], this.lY + ' ' + i + '0');
          yW += cont.AnyTime_width(true);
          if (yH < cont.AnyTime_height(true))
            yH = cont.AnyTime_height(true);

          cont = $('<ul class="AnyTime-yr-yr" />');
          yBody.append(cont);
          for (i = 0; i < 10; i++)
            this.btn(cont, i, this.newYPos, ['yr','yr' + i], this.lY + ' ' + i);
          yW += cont.AnyTime_width(true);
          if (yH < cont.AnyTime_height(true))
            yH = cont.AnyTime_height(true);

          if (this.askEra) {
            cont = $('<ul class="AnyTime-yr-era" />');
            yBody.append(cont);

            this.btn(cont, this.conv.eAbbr[0],
                    function(event) {
                      var t = new Date(this.time.getTime());
                      var year = t.getFullYear();
                      if (year > 0)
                        t.setFullYear(0 - year);
                      this.set(t);
                      this.updYDiv($(event.target));
                    },
                    ['era','bce'], this.conv.eAbbr[0]);

            this.btn(cont, this.conv.eAbbr[1],
                    function(event) {
                      var t = new Date(this.time.getTime());
                      var year = t.getFullYear();
                      if (year < 0)
                        t.setFullYear(0 - year);
                      this.set(t);
                      this.updYDiv($(event.target));
                    },
                    ['era','ce'], this.conv.eAbbr[1]);

            yW += cont.AnyTime_width(true);
            if (yH < cont.AnyTime_height(true))
              yH = cont.AnyTime_height(true);

          } // if ( this.askEra )

          if ($.browser.msie) // IE8+ThemeUI bug!
            yW += 1;
          else if ($.browser.safari) // Safari small-text bug!
            yW += 2;
          yH += yBody.AnyTime_height(true);
          yBody.css('width', String(yW) + 'px');
          if (! __msie7) // IE7 bug!
            yBody.css('height', String(yH) + 'px');
          if (__msie6 || __msie7) // IE bugs!
            title.width(yBody.outerWidth(true));
          yH += title.AnyTime_height(true);
          if (title.AnyTime_width(true) > yW)
            yW = title.AnyTime_width(true);
          this.yDiv.css('width', String(yW) + 'px');
          if (! __msie7) // IE7 bug!
            this.yDiv.css('height', String(yH) + 'px');

        } // if ( ! this.yDiv )
        else {
          this.cloak.show();
          this.yDiv.show();
        }
        this.pos(event);
        this.updYDiv(null);
        this.setFocus(this.yDiv.find('.AnyTime-yr-btn.AnyTime-cur-btn:first'));

      }, // .askYear()

      //---------------------------------------------------------------------
      //  .inpBlur() is called when a picker's input loses focus to dismiss
      //  the popup.  A 1/3 second delay is necessary to restore focus if
      //  the div is clicked (shorter delays don't always work!)  To prevent
      //  problems cause by scrollbar focus (except in FF), focus is
      //  force-restored if the offset div is visible.
      //---------------------------------------------------------------------

      inpBlur: function(event) {
        if (this.oDiv && this.oDiv.is(":visible")) {
          _this.inp.focus();
          return;
        }
        this.lostFocus = true;
        setTimeout(
                function() {
                  if (_this.lostFocus) {
                    _this.div.find('.AnyTime-focus-btn').removeClass('AnyTime-focus-btn ui-state-focus');
                    if (_this.pop)
                      _this.dismiss(event);
                    else
                      _this.ajax();
                  }
                }, 334);
      },

      //---------------------------------------------------------------------
      //  .btn() is called by AnyTime.picker() to create a <div> element
      //  containing an <a> element.  The elements are given appropriate
      //  classes based on the specified "classes" (an array of strings).
      //  The specified "text" and "title" are used for the <a> element.
      //  The "handler" is bound to click events for the <div>, which will
      //  catch bubbling clicks from the <a> as well.  The button is
      //  appended to the specified parent (jQuery), and the <div> jQuery
      //  is returned.
      //---------------------------------------------------------------------

      btn: function(parent, text, handler, classes, title) {
        var tagName = ( (parent[0].nodeName.toLowerCase() == 'ul') ? 'li' : 'td');
        var div$ = '<' + tagName +
                ' class="AnyTime-btn';
        for (var i = 0; i < classes.length; i++)
          div$ += ' AnyTime-' + classes[i] + '-btn';
        var div = $(div$ + ' ui-state-default">' + text + '</' + tagName + '>');
        parent.append(div);
        div.AnyTime_title = title;

        div.click(
                function(e) {
                  // bind the handler to the picker so "this" is correct
                  _this.tempFunc = handler;
                  _this.tempFunc(e);
                });
        div.dblclick(
                function(e) {
                  var elem = $(this);
                  if (elem.is('.AnyTime-off-off-btn'))
                    _this.dismissODiv(e);
                  else if (elem.is('.AnyTime-mil-btn') || elem.is('.AnyTime-cent-btn') || elem.is('.AnyTime-dec-btn') || elem.is('.AnyTime-yr-btn') || elem.is('.AnyTime-era-btn'))
                    _this.dismissYDiv(e);
                  else if (_this.pop)
                    _this.dismiss(e);
                });
        return div;

      }, // .btn()

      //---------------------------------------------------------------------
      //  .cleanup() destroys the DOM events and elements associated with
      //  the picker so it can be deleted.
      //---------------------------------------------------------------------

      cleanup: function(event) {
        this.inp.unbind('blur', this.hBlur);
        this.inp.unbind('click', this.hClick);
        this.inp.unbind('focus', this.hFocus);
        this.inp.unbind('keydown', this.hKeydown);
        this.inp.unbind('keypress', this.hKeypress);
        this.div.remove();
      },

      //---------------------------------------------------------------------
      //  .dismiss() dismisses a popup picker.
      //---------------------------------------------------------------------

      dismiss: function(event) {
        this.ajax();
        this.div.hide();
        if (__iframe)
          __iframe.hide();
        if (this.yDiv)
          this.dismissYDiv();
        if (this.oDiv)
          this.dismissODiv();
        this.lostFocus = true;
      },

      //---------------------------------------------------------------------
      //  .dismissODiv() dismisses the UTC offset selector popover.
      //---------------------------------------------------------------------

      dismissODiv: function(event) {
        this.oDiv.hide();
        this.cloak.hide();
        this.setFocus(this.oCur);
      },

      //---------------------------------------------------------------------
      //  .dismissYDiv() dismisses the date selector popover.
      //---------------------------------------------------------------------

      dismissYDiv: function(event) {
        this.yDiv.hide();
        this.cloak.hide();
        this.setFocus(this.yCur);
      },

      //---------------------------------------------------------------------
      //  .setFocus() makes a specified psuedo-button appear to get focus.
      //---------------------------------------------------------------------

      setFocus: function(btn) {
        if (! btn.hasClass('AnyTime-focus-btn')) {
          this.div.find('.AnyTime-focus-btn').removeClass('AnyTime-focus-btn ui-state-focus');
          this.fBtn = btn;
          btn.removeClass('ui-state-default ui-state-highlight');
          btn.addClass('AnyTime-focus-btn ui-state-default ui-state-highlight ui-state-focus');
        }
        if (btn.hasClass('AnyTime-off-off-btn')) {
          var oBT = this.oBody.offset().top;
          var btnT = btn.offset().top;
          var btnH = btn.AnyTime_height(true);
          if (btnT - btnH < oBT) // move a page up
            this.oBody.scrollTop(btnT + this.oBody.scrollTop() - ( this.oBody.innerHeight() + oBT ) + ( btnH * 2 ));
          else if (btnT + btnH > oBT + this.oBody.innerHeight()) // move a page down
            this.oBody.scrollTop(( btnT + this.oBody.scrollTop() ) - ( oBT + btnH ));
        }
      },

      //---------------------------------------------------------------------
      //  .key() is invoked when a user presses a key while the picker's
      //  input has focus.  A psuedo-button is considered "in focus" and an
      //  appropriate action is performed according to the WAI-ARIA Authoring
      //  Practices 1.0 for datepicker from
      //  www.w3.org/TR/2009/WD-wai-aria-practices-20091215/#datepicker:
      //
      //  * LeftArrow moves focus left, continued to previous week.
      //  * RightArrow moves focus right, continued to next week.
      //  * UpArrow moves focus to the same weekday in the previous week.
      //  * DownArrow moves focus to same weekday in the next week.
      //  * PageUp moves focus to same day in the previous month.
      //  * PageDown moves focus to same day in the next month.
      //  * Shift+Page Up moves focus to same day in the previous year.
      //  * Shift+Page Down moves focus to same day in the next year.
      //  * Home moves focus to the first day of the month.
      //  * End moves focus to the last day of the month.
      //  * Ctrl+Home moves focus to the first day of the year.
      //  * Ctrl+End moves focus to the last day of the year.
      //  * Esc closes a DatePicker that is opened as a Popup.
      //
      //  The following actions (for multiple-date selection) are NOT
      //  supported:
      //  * Shift+Arrow performs continous selection.
      //  * Ctrl+Space multiple selection of certain days.
      //
      //  The authoring practices do not specify behavior for a time picker,
      //  or for month-and-year pickers that do not have a day-of-the-month,
      //  but AnyTime.picker uses the following behavior to be as consistent
      //  as possible with the defined datepicker functionality:
      //  * LeftArrow moves focus left or up to previous value or field.
      //  * RightArrow moves focus right or down to next value or field.
      //  * UpArrow moves focus up or left to previous value or field.
      //  * DownArrow moves focus down or right to next value or field
      //  * PageUp moves focus to the current value in the previous units
      //    (for example, from ten-minutes to hours or one-minutes to
      //    ten-minutes or months to years).
      //  * PageDown moves focus to the current value in the next units
      //    (for example, from hours to ten-minutes or ten-minutes to
      //    one-minutes or years to months).
      //  * Home moves the focus to the first unit button.
      //  * End moves the focus to the last unit button.
      //
      //  In addition, Tab and Shift+Tab move between units (including to/
      //  from the Day-of-Month table) and also in/out of the picker.
      //
      //  Because AnyTime.picker sets a value as soon as the button receives
      //  focus, SPACE and ENTER are not needed (the WAI-ARIA guidelines use
      //  them to select a value.
      //---------------------------------------------------------------------

      key: function(event) {
        var mo;
        var t = null;
        var elem = this.div.find('.AnyTime-focus-btn');
        var key = event.keyCode || event.which;
        this.denyTab = true;

        if (key == 16) // Shift
        {
        }
        else if (( key == 10 ) || ( key == 13 ) || ( key == 27 )) // Enter & Esc
        {
          if (this.oDiv && this.oDiv.is(':visible'))
            this.dismissODiv(event);
          else if (this.yDiv && this.yDiv.is(':visible'))
            this.dismissYDiv(event);
          else if (this.pop)
            this.dismiss(event);
        }
        else if (( key == 33 ) || ( ( key == 9 ) && event.shiftKey )) // PageUp & Shift+Tab
        {
          if (this.fBtn.hasClass('AnyTime-off-off-btn')) {
            if (key == 9)
              this.dismissODiv(event);
          }
          else if (this.fBtn.hasClass('AnyTime-mil-btn')) {
            if (key == 9)
              this.dismissYDiv(event);
          }
          else if (this.fBtn.hasClass('AnyTime-cent-btn'))
            this.yDiv.find('.AnyTime-mil-btn.AnyTime-cur-btn').triggerHandler('click');
          else if (this.fBtn.hasClass('AnyTime-dec-btn'))
            this.yDiv.find('.AnyTime-cent-btn.AnyTime-cur-btn').triggerHandler('click');
          else if (this.fBtn.hasClass('AnyTime-yr-btn'))
            this.yDiv.find('.AnyTime-dec-btn.AnyTime-cur-btn').triggerHandler('click');
          else if (this.fBtn.hasClass('AnyTime-era-btn'))
            this.yDiv.find('.AnyTime-yr-btn.AnyTime-cur-btn').triggerHandler('click');
          else if (this.fBtn.parents('.AnyTime-yrs').length) {
            if (key == 9) {
              this.denyTab = false;
              return;
            }
          }
          else if (this.fBtn.hasClass('AnyTime-mon-btn')) {
            if (this.dY)
              this.yCur.triggerHandler('click');
            else if (key == 9) {
              this.denyTab = false;
              return;
            }
          }
          else if (this.fBtn.hasClass('AnyTime-dom-btn')) {
            if (( key == 9 ) && event.shiftKey) // Shift+Tab
            {
              this.denyTab = false;
              return;
            }
            else // PageUp
            {
              t = new Date(this.time.getTime());
              if (event.shiftKey)
                t.setFullYear(t.getFullYear() - 1);
              else {
                mo = t.getMonth() - 1;
                if (t.getDate() > __daysIn[mo])
                  t.setDate(__daysIn[mo])
                t.setMonth(mo);
              }
              this.keyDateChange(t);
            }
          }
          else if (this.fBtn.hasClass('AnyTime-hr-btn')) {
            t = this.dDoM || this.dMo;
            if (t)
              t.AnyTime_clickCurrent();
            else if (this.dY)
              this.yCur.triggerHandler('click');
            else if (key == 9) {
              this.denyTab = false;
              return;
            }
          }
          else if (this.fBtn.hasClass('AnyTime-min-ten-btn')) {
            t = this.dH || this.dDoM || this.dMo;
            if (t)
              t.AnyTime_clickCurrent();
            else if (this.dY)
              this.yCur.triggerHandler('click');
            else if (key == 9) {
              this.denyTab = false;
              return;
            }
          }
          else if (this.fBtn.hasClass('AnyTime-min-one-btn'))
            this.dM.AnyTime_clickCurrent();
          else if (this.fBtn.hasClass('AnyTime-sec-ten-btn')) {
            if (this.dM)
              t = this.dM.find('.AnyTime-mins-ones');
            else
              t = this.dH || this.dDoM || this.dMo;
            if (t)
              t.AnyTime_clickCurrent();
            else if (this.dY)
              this.yCur.triggerHandler('click');
            else if (key == 9) {
              this.denyTab = false;
              return;
            }
          }
          else if (this.fBtn.hasClass('AnyTime-sec-one-btn'))
            this.dS.AnyTime_clickCurrent();
          else if (this.fBtn.hasClass('AnyTime-off-btn')) {
            if (this.dS)
              t = this.dS.find('.AnyTime-secs-ones');
            else if (this.dM)
              t = this.dM.find('.AnyTime-mins-ones');
            else
              t = this.dH || this.dDoM || this.dMo;
            if (t)
              t.AnyTime_clickCurrent();
            else if (this.dY)
              this.yCur.triggerHandler('click');
            else if (key == 9) {
              this.denyTab = false;
              return;
            }
          }
        }
        else if (( key == 34 ) || ( key == 9 )) // PageDown or Tab
        {
          if (this.fBtn.hasClass('AnyTime-mil-btn'))
            this.yDiv.find('.AnyTime-cent-btn.AnyTime-cur-btn').triggerHandler('click');
          else if (this.fBtn.hasClass('AnyTime-cent-btn'))
            this.yDiv.find('.AnyTime-dec-btn.AnyTime-cur-btn').triggerHandler('click');
          else if (this.fBtn.hasClass('AnyTime-dec-btn'))
            this.yDiv.find('.AnyTime-yr-btn.AnyTime-cur-btn').triggerHandler('click');
          else if (this.fBtn.hasClass('AnyTime-yr-btn')) {
            t = this.yDiv.find('.AnyTime-era-btn.AnyTime-cur-btn');
            if (t.length)
              t.triggerHandler('click');
            else if (key == 9)
              this.dismissYDiv(event);
          }
          else if (this.fBtn.hasClass('AnyTime-era-btn')) {
            if (key == 9)
              this.dismissYDiv(event);
          }
          else if (this.fBtn.hasClass('AnyTime-off-off-btn')) {
            if (key == 9)
              this.dismissODiv(event);
          }
          else if (this.fBtn.parents('.AnyTime-yrs').length) {
            t = this.dDoM || this.dMo || this.dH || this.dM || this.dS || this.dO;
            if (t)
              t.AnyTime_clickCurrent();
            else if (key == 9) {
              this.denyTab = false;
              return;
            }
          }
          else if (this.fBtn.hasClass('AnyTime-mon-btn')) {
            t = this.dDoM || this.dH || this.dM || this.dS || this.dO;
            if (t)
              t.AnyTime_clickCurrent();
            else if (key == 9) {
              this.denyTab = false;
              return;
            }
          }
          else if (this.fBtn.hasClass('AnyTime-dom-btn')) {
            if (key == 9) // Tab
            {
              t = this.dH || this.dM || this.dS || this.dO;
              if (t)
                t.AnyTime_clickCurrent();
              else {
                this.denyTab = false;
                return;
              }
            }
            else // PageDown
            {
              t = new Date(this.time.getTime());
              if (event.shiftKey)
                t.setFullYear(t.getFullYear() + 1);
              else {
                mo = t.getMonth() + 1;
                if (t.getDate() > __daysIn[mo])
                  t.setDate(__daysIn[mo])
                t.setMonth(mo);
              }
              this.keyDateChange(t);
            }
          }
          else if (this.fBtn.hasClass('AnyTime-hr-btn')) {
            t = this.dM || this.dS || this.dO;
            if (t)
              t.AnyTime_clickCurrent();
            else if (key == 9) {
              this.denyTab = false;
              return;
            }
          }
          else if (this.fBtn.hasClass('AnyTime-min-ten-btn'))
            this.dM.find('.AnyTime-mins-ones .AnyTime-cur-btn').triggerHandler('click');
          else if (this.fBtn.hasClass('AnyTime-min-one-btn')) {
            t = this.dS || this.dO;
            if (t)
              t.AnyTime_clickCurrent();
            else if (key == 9) {
              this.denyTab = false;
              return;
            }
          }
          else if (this.fBtn.hasClass('AnyTime-sec-ten-btn'))
            this.dS.find('.AnyTime-secs-ones .AnyTime-cur-btn').triggerHandler('click');
          else if (this.fBtn.hasClass('AnyTime-sec-one-btn')) {
            if (this.dO)
              this.dO.AnyTime_clickCurrent();
            else if (key == 9) {
              this.denyTab = false;
              return;
            }
          }
          else if (this.fBtn.hasClass('AnyTime-off-btn')) {
            if (key == 9) {
              this.denyTab = false;
              return;
            }
          }
        }
        else if (key == 35) // END
        {
          if (this.fBtn.hasClass('AnyTime-mil-btn') || this.fBtn.hasClass('AnyTime-cent-btn') ||
                  this.fBtn.hasClass('AnyTime-dec-btn') || this.fBtn.hasClass('AnyTime-yr-btn') ||
                  this.fBtn.hasClass('AnyTime-era-btn')) {
            t = this.yDiv.find('.AnyTime-ce-btn');
            if (! t.length)
              t = this.yDiv.find('.AnyTime-yr9-btn');
            t.triggerHandler('click');
          }
          else if (this.fBtn.hasClass('AnyTime-dom-btn')) {
            t = new Date(this.time.getTime());
            t.setDate(1);
            t.setMonth(t.getMonth() + 1);
            t.setDate(t.getDate() - 1);
            if (event.ctrlKey)
              t.setMonth(11);
            this.keyDateChange(t);
          }
          else if (this.dS)
            this.dS.find('.AnyTime-sec9-btn').triggerHandler('click');
          else if (this.dM)
            this.dM.find('.AnyTime-min9-btn').triggerHandler('click');
          else if (this.dH)
            this.dH.find('.AnyTime-hr23-btn').triggerHandler('click');
          else if (this.dDoM)
            this.dDoM.find('.AnyTime-dom-btn-filled:last').triggerHandler('click');
          else if (this.dMo)
            this.dMo.find('.AnyTime-mon12-btn').triggerHandler('click');
          else if (this.dY)
            this.yAhead.triggerHandler('click');
        }
        else if (key == 36) // HOME
        {
          if (this.fBtn.hasClass('AnyTime-mil-btn') || this.fBtn.hasClass('AnyTime-cent-btn') ||
                  this.fBtn.hasClass('AnyTime-dec-btn') || this.fBtn.hasClass('AnyTime-yr-btn') ||
                  this.fBtn.hasClass('AnyTime-era-btn')) {
            this.yDiv.find('.AnyTime-mil0-btn').triggerHandler('click');
          }
          else if (this.fBtn.hasClass('AnyTime-dom-btn')) {
            t = new Date(this.time.getTime());
            t.setDate(1);
            if (event.ctrlKey)
              t.setMonth(0);
            this.keyDateChange(t);
          }
          else if (this.dY)
            this.yCur.triggerHandler('click');
          else if (this.dMo)
            this.dMo.find('.AnyTime-mon1-btn').triggerHandler('click');
          else if (this.dDoM)
            this.dDoM.find('.AnyTime-dom-btn-filled:first').triggerHandler('click');
          else if (this.dH)
            this.dH.find('.AnyTime-hr0-btn').triggerHandler('click');
          else if (this.dM)
            this.dM.find('.AnyTime-min00-btn').triggerHandler('click');
          else if (this.dS)
            this.dS.find('.AnyTime-sec00-btn').triggerHandler('click');
        }
        else if (key == 37) // left arrow
        {
          if (this.fBtn.hasClass('AnyTime-dom-btn'))
            this.keyDateChange(new Date(this.time.getTime() - __oneDay));
          else
            this.keyBack();
        }
        else if (key == 38) // up arrow
        {
          if (this.fBtn.hasClass('AnyTime-dom-btn'))
            this.keyDateChange(new Date(this.time.getTime() - (7 * __oneDay)));
          else
            this.keyBack();
        }
        else if (key == 39) // right arrow
        {
          if (this.fBtn.hasClass('AnyTime-dom-btn'))
            this.keyDateChange(new Date(this.time.getTime() + __oneDay));
          else
            this.keyAhead();
        }
        else if (key == 40) // down arrow
        {
          if (this.fBtn.hasClass('AnyTime-dom-btn'))
            this.keyDateChange(new Date(this.time.getTime() + (7 * __oneDay)));
          else
            this.keyAhead();
        }
        else if (( ( key == 86 ) || ( key == 118 ) ) && event.ctrlKey) {
          this.inp.val("").change();
          var _this = this;
          setTimeout(function() {
            _this.showPkr(null);
          }, 100);
          return;
        }
        else
          this.showPkr(null);

        event.preventDefault();

      }, // .key()

      //---------------------------------------------------------------------
      //  .keyAhead() is called by #key when a user presses the right or
      //  down arrow.  It moves to the next appropriate button.
      //---------------------------------------------------------------------

      keyAhead: function() {
        if (this.fBtn.hasClass('AnyTime-mil9-btn'))
          this.yDiv.find('.AnyTime-cent0-btn').triggerHandler('click');
        else if (this.fBtn.hasClass('AnyTime-cent9-btn'))
          this.yDiv.find('.AnyTime-dec0-btn').triggerHandler('click');
        else if (this.fBtn.hasClass('AnyTime-dec9-btn'))
          this.yDiv.find('.AnyTime-yr0-btn').triggerHandler('click');
        else if (this.fBtn.hasClass('AnyTime-yr9-btn'))
          this.yDiv.find('.AnyTime-bce-btn').triggerHandler('click');
        else if (this.fBtn.hasClass('AnyTime-sec9-btn')) {
        }
        else if (this.fBtn.hasClass('AnyTime-sec50-btn'))
          this.dS.find('.AnyTime-sec0-btn').triggerHandler('click');
        else if (this.fBtn.hasClass('AnyTime-min9-btn')) {
          if (this.dS)
            this.dS.find('.AnyTime-sec00-btn').triggerHandler('click');
        }
        else if (this.fBtn.hasClass('AnyTime-min50-btn'))
          this.dM.find('.AnyTime-min0-btn').triggerHandler('click');
        else if (this.fBtn.hasClass('AnyTime-hr23-btn')) {
          if (this.dM)
            this.dM.find('.AnyTime-min00-btn').triggerHandler('click');
          else if (this.dS)
            this.dS.find('.AnyTime-sec00-btn').triggerHandler('click');
        }
        else if (this.fBtn.hasClass('AnyTime-hr11-btn'))
          this.dH.find('.AnyTime-hr12-btn').triggerHandler('click');
        else if (this.fBtn.hasClass('AnyTime-mon12-btn')) {
          if (this.dDoM)
            this.dDoM.AnyTime_clickCurrent();
          else if (this.dH)
            this.dH.find('.AnyTime-hr0-btn').triggerHandler('click');
          else if (this.dM)
            this.dM.find('.AnyTime-min00-btn').triggerHandler('click');
          else if (this.dS)
            this.dS.find('.AnyTime-sec00-btn').triggerHandler('click');
        }
        else if (this.fBtn.hasClass('AnyTime-yrs-ahead-btn')) {
          if (this.dMo)
            this.dMo.find('.AnyTime-mon1-btn').triggerHandler('click');
          else if (this.dH)
            this.dH.find('.AnyTime-hr0-btn').triggerHandler('click');
          else if (this.dM)
            this.dM.find('.AnyTime-min00-btn').triggerHandler('click');
          else if (this.dS)
            this.dS.find('.AnyTime-sec00-btn').triggerHandler('click');
        }
        else if (this.fBtn.hasClass('AnyTime-yr-cur-btn'))
          this.yNext.triggerHandler('click');
        else
          this.fBtn.next().triggerHandler('click');

      }, // .keyAhead()


      //---------------------------------------------------------------------
      //  .keyBack() is called by #key when a user presses the left or
      //  up arrow. It moves to the previous appropriate button.
      //---------------------------------------------------------------------

      keyBack: function() {
        if (this.fBtn.hasClass('AnyTime-cent0-btn'))
          this.yDiv.find('.AnyTime-mil9-btn').triggerHandler('click');
        else if (this.fBtn.hasClass('AnyTime-dec0-btn'))
          this.yDiv.find('.AnyTime-cent9-btn').triggerHandler('click');
        else if (this.fBtn.hasClass('AnyTime-yr0-btn'))
          this.yDiv.find('.AnyTime-dec9-btn').triggerHandler('click');
        else if (this.fBtn.hasClass('AnyTime-bce-btn'))
          this.yDiv.find('.AnyTime-yr9-btn').triggerHandler('click');
        else if (this.fBtn.hasClass('AnyTime-yr-cur-btn'))
          this.yPrior.triggerHandler('click');
        else if (this.fBtn.hasClass('AnyTime-mon1-btn')) {
          if (this.dY)
            this.yCur.triggerHandler('click');
        }
        else if (this.fBtn.hasClass('AnyTime-hr0-btn')) {
          if (this.dDoM)
            this.dDoM.AnyTime_clickCurrent();
          else if (this.dMo)
            this.dMo.find('.AnyTime-mon12-btn').triggerHandler('click');
          else if (this.dY)
            this.yNext.triggerHandler('click');
        }
        else if (this.fBtn.hasClass('AnyTime-hr12-btn'))
          this.dH.find('.AnyTime-hr11-btn').triggerHandler('click');
        else if (this.fBtn.hasClass('AnyTime-min00-btn')) {
          if (this.dH)
            this.dH.find('.AnyTime-hr23-btn').triggerHandler('click');
          else if (this.dDoM)
            this.dDoM.AnyTime_clickCurrent();
          else if (this.dMo)
            this.dMo.find('.AnyTime-mon12-btn').triggerHandler('click');
          else if (this.dY)
            this.yNext.triggerHandler('click');
        }
        else if (this.fBtn.hasClass('AnyTime-min0-btn'))
          this.dM.find('.AnyTime-min50-btn').triggerHandler('click');
        else if (this.fBtn.hasClass('AnyTime-sec00-btn')) {
          if (this.dM)
            this.dM.find('.AnyTime-min9-btn').triggerHandler('click');
          else if (this.dH)
            this.dH.find('.AnyTime-hr23-btn').triggerHandler('click');
          else if (this.dDoM)
            this.dDoM.AnyTime_clickCurrent();
          else if (this.dMo)
            this.dMo.find('.AnyTime-mon12-btn').triggerHandler('click');
          else if (this.dY)
            this.yNext.triggerHandler('click');
        }
        else if (this.fBtn.hasClass('AnyTime-sec0-btn'))
          this.dS.find('.AnyTime-sec50-btn').triggerHandler('click');
        else
          this.fBtn.prev().triggerHandler('click');

      }, // .keyBack()

      //---------------------------------------------------------------------
      //  .keyDateChange() is called by #key when an direction key
      //  (arrows/page/etc) is pressed while the Day-of-Month calendar has
      //  focus. The current day is adjusted accordingly.
      //---------------------------------------------------------------------

      keyDateChange: function(newDate) {
        if (this.fBtn.hasClass('AnyTime-dom-btn')) {
          this.set(newDate);
          this.upd(null);
          this.setFocus(this.dDoM.find('.AnyTime-cur-btn'));
        }
      },

      //---------------------------------------------------------------------
      //  .makeCloak() is called by .askOffset() and .askYear() to create
      //  a cloak div.
      //---------------------------------------------------------------------

      makeCloak: function() {
        if (! this.cloak) {
          this.cloak = $('<div class="AnyTime-cloak" style="position:absolute" />');
          this.div.append(this.cloak);
          this.cloak.click(
                  function(e) {
                    if (_this.oDiv && _this.oDiv.is(":visible"))
                      _this.dismissODiv(e);
                    else
                      _this.dismissYDiv(e);
                  });
        }
        else
          this.cloak.show();
      },

      //---------------------------------------------------------------------
      //  .newHour() is called when a user clicks an hour value.
      //  It changes the date and updates the text field.
      //---------------------------------------------------------------------

      newHour: function(event) {
        var h;
        var t;
        var elem = $(event.target);
        if (elem.hasClass("AnyTime-out-btn"))
          return;
        if (! this.twelveHr)
          h = Number(elem.text());
        else {
          var str = elem.text();
          t = str.indexOf('a');
          if (t < 0) {
            t = Number(str.substr(0, str.indexOf('p')));
            h = ( (t == 12) ? 12 : (t + 12) );
          }
          else {
            t = Number(str.substr(0, t));
            h = ( (t == 12) ? 0 : t );
          }
        }
        t = new Date(this.time.getTime());
        t.setHours(h);
        this.set(t);
        this.upd(elem);

      }, // .newHour()

      //---------------------------------------------------------------------
      //  .newOffset() is called when a user clicks the UTC offset (timezone)
      //  (or +/- button) to shift the year.  It changes the date and updates
      //  the text field.
      //---------------------------------------------------------------------

      newOffset: function(event) {
        if (event.target == this.oSel[0])
          this.askOffset(event);
        else {
          this.upd(this.oCur);
        }
      },

      //---------------------------------------------------------------------
      //  .newOPos() is called internally whenever a user clicks an offset
      //  selection value.  It changes the date and updates the text field.
      //---------------------------------------------------------------------

      newOPos: function(event) {
        var elem = $(event.target);
        this.offMin = elem[0].AnyTime_offMin;
        this.offSI = elem[0].AnyTime_offSI;
        var t = new Date(this.time.getTime());
        this.set(t);
        this.updODiv(elem);

      }, // .newOPos()

      //---------------------------------------------------------------------
      //  .newYear() is called when a user clicks a year (or one of the
      //  "arrows") to shift the year.  It changes the date and updates the
      //  text field.
      //---------------------------------------------------------------------

      newYear: function(event) {
        var elem = $(event.target);
        if (elem.hasClass("AnyTime-out-btn"))
          return;
        var txt = elem.text();
        if (( txt == '<' ) || ( txt == '&lt;' ))
          this.askYear(event);
        else if (( txt == '>' ) || ( txt == '&gt;' ))
          this.askYear(event);
        else {
          var t = new Date(this.time.getTime());
          t.setFullYear(Number(txt));
          this.set(t);
          this.upd(this.yCur);
        }
      },

      //---------------------------------------------------------------------
      //  .newYPos() is called internally whenever a user clicks a year
      //  selection value.  It changes the date and updates the text field.
      //---------------------------------------------------------------------

      newYPos: function(event) {
        var elem = $(event.target);
        if (elem.hasClass("AnyTime-out-btn"))
          return;

        var era = 1;
        var year = this.time.getFullYear();
        if (year < 0) {
          era = (-1);
          year = 0 - year;
        }
        year = AnyTime.pad(year, 4);
        if (elem.hasClass('AnyTime-mil-btn'))
          year = elem.html() + year.substring(1, 4);
        else if (elem.hasClass('AnyTime-cent-btn'))
          year = year.substring(0, 1) + elem.html() + year.substring(2, 4);
        else if (elem.hasClass('AnyTime-dec-btn'))
          year = year.substring(0, 2) + elem.html() + year.substring(3, 4);
        else
          year = year.substring(0, 3) + elem.html();
        if (year == '0000')
          year = 1;
        var t = new Date(this.time.getTime());
        t.setFullYear(era * year);
        this.set(t);
        this.updYDiv(elem);

      }, // .newYPos()

      //---------------------------------------------------------------------
      //  .onReady() initializes the picker after the page has loaded and,
      //  if IE6, after the iframe has been created.
      //---------------------------------------------------------------------

      onReady: function() {
        this.lostFocus = true;
        if (! this.pop)
          this.upd(null);
        else {
          if (this.div.parent() != document.body)
            this.div.appendTo(document.body);
        }
      },

      //---------------------------------------------------------------------
      //  .pos() positions the picker, such as when it is displayed or
      //  when the window is resized.
      //---------------------------------------------------------------------

      pos: function(event) {
        if (this.pop) {
          var off = this.inp.offset();
          var bodyWidth = $(document.body).outerWidth(true);
          var pickerWidth = this.div.outerWidth(true);
          var left = off.left;
          if (left + pickerWidth > bodyWidth - 20)
            left = bodyWidth - ( pickerWidth + 20 );
          var top = off.top - this.div.outerHeight(true);
          if (top < 0)
            top = off.top + this.inp.outerHeight(true);
          this.div.css({ top: String(top) + 'px', left: String(left < 0 ? 0 : left) + 'px' });
        }

        var wOff = this.div.offset();

        if (this.oDiv && this.oDiv.is(":visible")) {
          var oOff = this.oLab.offset();
          if (this.div.css('position') == 'absolute') {
            oOff.top -= wOff.top;
            oOff.left = oOff.left - wOff.left;
            wOff = { top: 0, left: 0 };
          }
          var oW = this.oDiv.AnyTime_width(true);
          var wW = this.div.AnyTime_width(true);
          if (oOff.left + oW > wOff.left + wW) {
            oOff.left = (wOff.left + wW) - oW;
            if (oOff.left < 2)
              oOff.left = 2;
          }

          var oH = this.oDiv.AnyTime_height(true);
          var wH = this.div.AnyTime_height(true);
          oOff.top += this.oLab.AnyTime_height(true);
          if (oOff.top + oH > wOff.top + wH)
            oOff.top = oOff.top - oH;
          if (oOff.top < wOff.top)
            oOff.top = wOff.top;

          this.oDiv.css({ top: oOff.top + 'px', left: oOff.left + 'px' });
        }

        else if (this.yDiv && this.yDiv.is(":visible")) {
          var yOff = this.yLab.offset();
          if (this.div.css('position') == 'absolute') {
            yOff.top -= wOff.top;
            yOff.left = yOff.left - wOff.left;
            wOff = { top: 0, left: 0 };
          }
          yOff.left += ( (this.yLab.outerWidth(true) - this.yDiv.outerWidth(true)) / 2 );
          this.yDiv.css({ top: yOff.top + 'px', left: yOff.left + 'px' });
        }

        if (this.cloak)
          this.cloak.css({
            top: wOff.top + 'px',
            left: wOff.left + 'px',
            height: String(this.div.outerHeight(true) - 2) + 'px',
            width: String(this.div.outerWidth(!$.browser.safari) - 2) + 'px'
          });

      }, // .pos()

      //---------------------------------------------------------------------
      //  .set() changes the current time.  It returns true if the new
      //  time is within the allowed range (if any).
      //---------------------------------------------------------------------

      set: function(newTime) {
        var t = newTime.getTime();
        if (this.earliest && ( t < this.earliest ))
          this.time = new Date(this.earliest);
        else if (this.latest && ( t > this.latest ))
          this.time = new Date(this.latest);
        else
          this.time = newTime;
      },

      //---------------------------------------------------------------------
      //  .showPkr() displays the picker and sets the focus psuedo-
      //  element. The current value in the input field is used to initialize
      //  the picker.
      //---------------------------------------------------------------------

      showPkr: function(event) {
        try {
          this.time = this.conv.parse(this.inp.val());
          this.offMin = this.conv.getUtcParseOffsetCaptured();
          this.offSI = this.conv.getUtcParseOffsetSubIndex();
        }
        catch (e) {
          this.time = new Date();
        }
        this.set(this.time);
        this.upd(null);

        fBtn = null;
        var cb = '.AnyTime-cur-btn:first';
        if (this.dDoM)
          fBtn = this.dDoM.find(cb);
        else if (this.yCur)
          fBtn = this.yCur;
        else if (this.dMo)
          fBtn = this.dMo.find(cb);
        else if (this.dH)
          fBtn = this.dH.find(cb);
        else if (this.dM)
          fBtn = this.dM.find(cb);
        else if (this.dS)
          fBtn = this.dS.find(cb);

        this.setFocus(fBtn);
        this.pos(event);

        //  IE6 doesn't float popups over <select> elements unless an
        //  <iframe> is inserted between them!  So after the picker is
        //  made visible, move the <iframe> behind it.

        if (this.pop && __iframe)
          setTimeout(
                  function() {
                    var pos = _this.div.offset();
                    __iframe.css({
                      height: String(_this.div.outerHeight(true)) + 'px',
                      left: String(pos.left) + 'px',
                      position: 'absolute',
                      top: String(pos.top) + 'px',
                      width: String(_this.div.outerWidth(true)) + 'px'
                    });
                    __iframe.show();
                  }, 300);

      }, // .showPkr()

      //---------------------------------------------------------------------
      //  .upd() updates the picker's appearance.  It is called after
      //  most events to make the picker reflect the currently-selected
      //  values. fBtn is the psuedo-button to be given focus.
      //---------------------------------------------------------------------

      upd: function(fBtn) {
        var cmpLo = new Date(this.time.getTime());
        cmpLo.setMonth(0, 1);
        cmpLo.setHours(0, 0, 0, 0);
        var cmpHi = new Date(this.time.getTime());
        cmpHi.setMonth(11, 31);
        cmpHi.setHours(23, 59, 59, 999);

        //  Update year.

        var current = this.time.getFullYear();
        if (this.earliest && this.yPast) {
          cmpHi.setYear(current - 2);
          if (cmpHi.getTime() < this.earliest)
            this.yPast.addClass('AnyTime-out-btn ui-state-disabled');
          else
            this.yPast.removeClass('AnyTime-out-btn ui-state-disabled');
        }
        if (this.yPrior) {
          this.yPrior.text(AnyTime.pad((current == 1) ? (-1) : (current - 1), 4));
          if (this.earliest) {
            cmpHi.setYear(current - 1);
            if (cmpHi.getTime() < this.earliest)
              this.yPrior.addClass('AnyTime-out-btn ui-state-disabled');
            else
              this.yPrior.removeClass('AnyTime-out-btn ui-state-disabled');
          }
        }
        if (this.yCur)
          this.yCur.text(AnyTime.pad(current, 4));
        if (this.yNext) {
          this.yNext.text(AnyTime.pad((current == -1) ? 1 : (current + 1), 4));
          if (this.latest) {
            cmpLo.setYear(current + 1);
            if (cmpLo.getTime() > this.latest)
              this.yNext.addClass('AnyTime-out-btn ui-state-disabled');
            else
              this.yNext.removeClass('AnyTime-out-btn ui-state-disabled');
          }
        }
        if (this.latest && this.yAhead) {
          cmpLo.setYear(current + 2);
          if (cmpLo.getTime() > this.latest)
            this.yAhead.addClass('AnyTime-out-btn ui-state-disabled');
          else
            this.yAhead.removeClass('AnyTime-out-btn ui-state-disabled');
        }

        //  Update month.

        cmpLo.setFullYear(this.time.getFullYear());
        cmpHi.setFullYear(this.time.getFullYear());
        var i = 0;
        current = this.time.getMonth();
        $('#' + this.id + ' .AnyTime-mon-btn').each(
                function() {
                  cmpLo.setMonth(i);
                  cmpHi.setDate(1);
                  cmpHi.setMonth(i + 1);
                  cmpHi.setDate(0);
                  $(this).AnyTime_current(i == current,
                          ((!_this.earliest) || (cmpHi.getTime() >= _this.earliest)) &&
                                  ((!_this.latest) || (cmpLo.getTime() <= _this.latest)));
                  i++;
                });

        //  Update days.

        cmpLo.setFullYear(this.time.getFullYear());
        cmpHi.setFullYear(this.time.getFullYear());
        cmpLo.setMonth(this.time.getMonth());
        cmpHi.setMonth(this.time.getMonth(), 1);
        current = this.time.getDate();
        var currentMonth = this.time.getMonth();
        var dow1 = cmpLo.getDay();
        if (this.fDOW > dow1)
          dow1 += 7;
        var wom = 0, dow = 0;
        $('#' + this.id + ' .AnyTime-wk').each(
                function() {
                  dow = _this.fDOW;
                  $(this).children().each(
                          function() {
                            if (dow - _this.fDOW < 7) {
                              var td = $(this);
                              if (((wom == 0) && (dow < dow1)) || (cmpLo.getMonth() != currentMonth)) {
                                td.html('&#160;');
                                td.removeClass('AnyTime-dom-btn-filled AnyTime-cur-btn ui-state-default ui-state-highlight');
                                td.addClass('AnyTime-dom-btn-empty');
                                if (wom) // not first week
                                {
                                  if (( cmpLo.getDate() == 1 ) && ( dow != 0 ))
                                    td.addClass('AnyTime-dom-btn-empty-after-filled');
                                  else
                                    td.removeClass('AnyTime-dom-btn-empty-after-filled');
                                  if (cmpLo.getDate() <= 7)
                                    td.addClass('AnyTime-dom-btn-empty-below-filled');
                                  else
                                    td.removeClass('AnyTime-dom-btn-empty-below-filled');
                                  cmpLo.setDate(cmpLo.getDate() + 1);
                                  cmpHi.setDate(cmpHi.getDate() + 1);
                                }
                                else // first week
                                {
                                  td.addClass('AnyTime-dom-btn-empty-above-filled');
                                  if (dow == dow1 - 1)
                                    td.addClass('AnyTime-dom-btn-empty-before-filled');
                                  else
                                    td.removeClass('AnyTime-dom-btn-empty-before-filled');
                                }
                                td.addClass('ui-state-default ui-state-disabled');
                              }
                              else {
                                i = cmpLo.getDate();
                                td.text(i);
                                td.removeClass('AnyTime-dom-btn-empty AnyTime-dom-btn-empty-above-filled AnyTime-dom-btn-empty-before-filled ' +
                                        'AnyTime-dom-btn-empty-after-filled AnyTime-dom-btn-empty-below-filled ' +
                                        'ui-state-default ui-state-disabled');
                                td.addClass('AnyTime-dom-btn-filled ui-state-default');
                                td.AnyTime_current(i == current,
                                        ((!_this.earliest) || (cmpHi.getTime() >= _this.earliest)) &&
                                                ((!_this.latest) || (cmpLo.getTime() <= _this.latest)));
                                cmpLo.setDate(i + 1);
                                cmpHi.setDate(i + 1);
                              }
                            }
                            dow++;
                          });
                  wom++;
                });

        //  Update hour.

        cmpLo.setFullYear(this.time.getFullYear());
        cmpHi.setFullYear(this.time.getFullYear());
        cmpLo.setMonth(this.time.getMonth(), this.time.getDate());
        cmpHi.setMonth(this.time.getMonth(), this.time.getDate());
        var not12 = ! this.twelveHr;
        var hr = this.time.getHours();
        $('#' + this.id + ' .AnyTime-hr-btn').each(
                function() {
                  var html = this.innerHTML;
                  var i;
                  if (not12)
                    i = Number(html);
                  else {
                    i = Number(html.substring(0, html.length - 2));
                    if (html.charAt(html.length - 2) == 'a') {
                      if (i == 12)
                        i = 0;
                    }
                    else if (i < 12)
                      i += 12;
                  }
                  cmpLo.setHours(i);
                  cmpHi.setHours(i);
                  $(this).AnyTime_current(hr == i,
                          ((!_this.earliest) || (cmpHi.getTime() >= _this.earliest)) &&
                                  ((!_this.latest) || (cmpLo.getTime() <= _this.latest)));
                  if (i < 23)
                    cmpLo.setHours(cmpLo.getHours() + 1);
                });

        //  Update minute.

        cmpLo.setHours(this.time.getHours());
        cmpHi.setHours(this.time.getHours());
        var units = this.time.getMinutes();
        var tens = String(Math.floor(units / 10));
        var ones = String(units % 10);
        $('#' + this.id + ' .AnyTime-min-ten-btn:not(.AnyTime-min-ten-btn-empty)').each(
                function() {
                  $(this).AnyTime_current(this.innerHTML == tens,
                          ((!_this.earliest) || (cmpHi.getTime() >= _this.earliest)) &&
                                  ((!_this.latest) || (cmpLo.getTime() <= _this.latest)));
                  if (cmpLo.getMinutes() < 50) {
                    cmpLo.setMinutes(cmpLo.getMinutes() + 10);
                    cmpHi.setMinutes(cmpHi.getMinutes() + 10);
                  }
                });
        cmpLo.setMinutes(Math.floor(this.time.getMinutes() / 10) * 10);
        cmpHi.setMinutes(Math.floor(this.time.getMinutes() / 10) * 10);
        $('#' + this.id + ' .AnyTime-min-one-btn:not(.AnyTime-min-one-btn-empty)').each(
                function() {
                  $(this).AnyTime_current(this.innerHTML == ones,
                          ((!_this.earliest) || (cmpHi.getTime() >= _this.earliest)) &&
                                  ((!_this.latest) || (cmpLo.getTime() <= _this.latest)));
                  cmpLo.setMinutes(cmpLo.getMinutes() + 1);
                  cmpHi.setMinutes(cmpHi.getMinutes() + 1);
                });

        //  Update second.

        cmpLo.setMinutes(this.time.getMinutes());
        cmpHi.setMinutes(this.time.getMinutes());
        units = this.time.getSeconds();
        tens = String(Math.floor(units / 10));
        ones = String(units % 10);
        $('#' + this.id + ' .AnyTime-sec-ten-btn:not(.AnyTime-sec-ten-btn-empty)').each(
                function() {
                  $(this).AnyTime_current(this.innerHTML == tens,
                          ((!_this.earliest) || (cmpHi.getTime() >= _this.earliest)) &&
                                  ((!_this.latest) || (cmpLo.getTime() <= _this.latest)));
                  if (cmpLo.getSeconds() < 50) {
                    cmpLo.setSeconds(cmpLo.getSeconds() + 10);
                    cmpHi.setSeconds(cmpHi.getSeconds() + 10);
                  }
                });
        cmpLo.setSeconds(Math.floor(this.time.getSeconds() / 10) * 10);
        cmpHi.setSeconds(Math.floor(this.time.getSeconds() / 10) * 10);
        $('#' + this.id + ' .AnyTime-sec-one-btn:not(.AnyTime-sec-one-btn-empty)').each(
                function() {
                  $(this).AnyTime_current(this.innerHTML == ones,
                          ((!_this.earliest) || (cmpHi.getTime() >= _this.earliest)) &&
                                  ((!_this.latest) || (cmpLo.getTime() <= _this.latest)));
                  cmpLo.setSeconds(cmpLo.getSeconds() + 1);
                  cmpHi.setSeconds(cmpHi.getSeconds() + 1);
                });

        //  Update offset (time zone).

        if (this.oConv) {
          this.oConv.setUtcFormatOffsetAlleged(this.offMin);
          this.oConv.setUtcFormatOffsetSubIndex(this.offSI);
          var tzs = this.oConv.format(this.time);
          this.oCur.html(tzs);
        }

        //  Set the focus element, then size the picker according to its
        //  components, show the changes, and invoke Ajax if desired.

        if (fBtn)
          this.setFocus(fBtn);

        this.conv.setUtcFormatOffsetAlleged(this.offMin);
        this.conv.setUtcFormatOffsetSubIndex(this.offSI);
        this.inp.val(this.conv.format(this.time)).change();
        this.div.show();

        var d, totH = 0, totW = 0, dYW = 0, dMoW = 0, dDoMW = 0;
        if (this.dY) {
          totW = dYW = this.dY.outerWidth(true);
          totH = this.yLab.AnyTime_height(true) + this.dY.AnyTime_height(true);
        }
        if (this.dMo) {
          dMoW = this.dMo.outerWidth(true);
          if (dMoW > totW)
            totW = dMoW;
          totH += this.hMo.AnyTime_height(true) + this.dMo.AnyTime_height(true);
        }
        if (this.dDoM) {
          dDoMW = this.dDoM.outerWidth(true);
          if (dDoMW > totW)
            totW = dDoMW;
          if (__msie6 || __msie7) {
            if (dMoW > dDoMW)
              this.dDoM.css('width', String(dMoW) + 'px');
            else if (dYW > dDoMW)
              this.dDoM.css('width', String(dYW) + 'px');
          }
          totH += this.hDoM.AnyTime_height(true) + this.dDoM.AnyTime_height(true);
        }
        if (this.dD) {
          this.dD.css({ width:String(totW) + 'px', height:String(totH) + 'px' });
          totW += this.dMinW;
          totH += this.dMinH;
        }

        var w = 0, h = 0, timeH = 0, timeW = 0;
        if (this.dH) {
          w = this.dH.outerWidth(true);
          timeW += w + 1;
          h = this.dH.AnyTime_height(true);
          if (h > timeH)
            timeH = h;
        }
        if (this.dM) {
          w = this.dM.outerWidth(true);
          timeW += w + 1;
          h = this.dM.AnyTime_height(true);
          if (h > timeH)
            timeH = h;
        }
        if (this.dS) {
          w = this.dS.outerWidth(true);
          timeW += w + 1;
          h = this.dS.AnyTime_height(true);
          if (h > timeH)
            timeH = h;
        }
        if (this.dO) {
          w = this.oMinW;
          if (timeW < w + 1)
            timeW = w + 1;
          timeH += this.dO.AnyTime_height(true);
        }
        if (this.dT) {
          this.dT.css({ width:String(timeW) + 'px', height:String(timeH) + 'px' });
          timeW += this.tMinW + 1;
          timeH += this.tMinH;
          totW += timeW;
          if (timeH > totH)
            totH = timeH;
          if (this.dO) // stretch offset button if possible
          {
            var dOW = this.dT.width() - (this.oMinW + 1);
            this.dO.css({width:String(dOW) + "px"});
            this.oCur.css({width:String(dOW - (this.oListMinW + 4)) + "px"});
          }
        }

        this.dB.css({height:String(totH) + 'px',width:String(totW) + 'px'});

        totH += this.bMinH;
        totW += this.bMinW;
        totH += this.hTitle.AnyTime_height(true) + this.wMinH;
        totW += this.wMinW;
        if (this.hTitle.outerWidth(true) > totW)
          totW = this.hTitle.outerWidth(true); // IE quirk
        this.div.css({height:String(totH) + 'px',width:String(totW) + 'px'});

        if (! this.pop)
          this.ajax();

      }, // .upd()

      //---------------------------------------------------------------------
      //  .updODiv() updates the UTC offset selector's appearance.  It is
      //  called after most events to make the picker reflect the currently-
      //  selected values. fBtn is the psuedo-button to be given focus.
      //---------------------------------------------------------------------

      updODiv: function(fBtn) {
        var cur, matched = false, def = null;
        this.oDiv.find('.AnyTime-off-off-btn').each(
                function() {
                  if (this.AnyTime_offMin == _this.offMin) {
                    if (this.AnyTime_offSI == _this.offSI)
                      $(this).AnyTime_current(matched = true, true);
                    else {
                      $(this).AnyTime_current(false, true);
                      if (def == null)
                        def = $(this);
                    }
                  }
                  else
                    $(this).AnyTime_current(false, true);
                });
        if (( ! matched ) && ( def != null ))
          def.AnyTime_current(true, true);

        //  Show change

        this.conv.setUtcFormatOffsetAlleged(this.offMin);
        this.conv.setUtcFormatOffsetSubIndex(this.offSI);
        this.inp.val(this.conv.format(this.time)).change();
        this.upd(fBtn);

      }, // .updODiv()

      //---------------------------------------------------------------------
      //  .updYDiv() updates the year selector's appearance.  It is
      //  called after most events to make the picker reflect the currently-
      //  selected values. fBtn is the psuedo-button to be given focus.
      //---------------------------------------------------------------------

      updYDiv: function(fBtn) {
        var i, legal;
        var era = 1;
        var yearValue = this.time.getFullYear();
        if (yearValue < 0) {
          era = (-1);
          yearValue = 0 - yearValue;
        }
        yearValue = AnyTime.pad(yearValue, 4);
        var eY = _this.earliest && new Date(_this.earliest).getFullYear();
        var lY = _this.latest && new Date(_this.latest).getFullYear();

        i = 0;
        this.yDiv.find('.AnyTime-mil-btn').each(
                function() {
                  legal = ( ((!_this.earliest) || (era * (i + (era < 0 ? 0 : 999)) >= eY)) && ((!_this.latest) || (era * (i + (era > 0 ? 0 : 999)) <= lY)) );
                  $(this).AnyTime_current(this.innerHTML == yearValue.substring(0, 1), legal);
                  i += 1000;
                });

        i = (Math.floor(yearValue / 1000) * 1000);
        this.yDiv.find('.AnyTime-cent-btn').each(
                function() {
                  legal = ( ((!_this.earliest) || (era * (i + (era < 0 ? 0 : 99)) >= eY)) && ((!_this.latest) || (era * (i + (era > 0 ? 0 : 99)) <= lY)) );
                  $(this).AnyTime_current(this.innerHTML == yearValue.substring(1, 2), legal);
                  i += 100;
                });

        i = (Math.floor(yearValue / 100) * 100);
        this.yDiv.find('.AnyTime-dec-btn').each(
                function() {
                  legal = ( ((!_this.earliest) || (era * (i + (era < 0 ? 0 : 9)) >= eY)) && ((!_this.latest) || (era * (i + (era > 0 ? 0 : 9)) <= lY)) );
                  $(this).AnyTime_current(this.innerHTML == yearValue.substring(2, 3), legal);
                  i += 10;
                });

        i = (Math.floor(yearValue / 10) * 10);
        this.yDiv.find('.AnyTime-yr-btn').each(
                function() {
                  legal = ( ((!_this.earliest) || (era * i >= eY)) && ((!_this.latest) || (era * i <= lY)) );
                  $(this).AnyTime_current(this.innerHTML == yearValue.substring(3), legal);
                  i += 1;
                });

        this.yDiv.find('.AnyTime-bce-btn').each(
                function() {
                  $(this).AnyTime_current(era < 0, (!_this.earliest) || ( _this.earliest < 0 ));
                });
        this.yDiv.find('.AnyTime-ce-btn').each(
                function() {
                  $(this).AnyTime_current(era > 0, (!_this.latest) || ( _this.latest > 0 ));
                });

        //  Show change

        this.conv.setUtcFormatOffsetAlleged(this.offMin);
        this.conv.setUtcFormatOffsetSubIndex(this.offSI);
        this.inp.val(this.conv.format(this.time)).change();
        this.upd(fBtn);

      } // .updYDiv()

    }; // __pickers[id] = ...
    __pickers[id].initialize(id);

  } // AnyTime.picker =

})(jQuery); // function($)...


//
//  END OF FILE
//


/*****************************************************************************
 *  FILE:  anytimetz.js - The Any+Time(TM) JavaScript Library
 *                        Basic Time Zone Support (source)
 *  VERSION: 4.1112
 *
 *  Copyright 2010 Andrew M. Andrews III (www.AMA3.com). Some Rights
 *  Reserved. This work licensed under the Creative Commons Attribution-
 *  Noncommercial-Share Alike 3.0 Unported License except in jurisdicitons
 *  for which the license has been ported by Creative Commons International,
 *  where the work is licensed under the applicable ported license instead.
 *  For a copy of the unported license, visit
 *  http://creativecommons.org/licenses/by-nc-sa/3.0/
 *  or send a letter to Creative Commons, 171 Second Street, Suite 300,
 *  San Francisco, California, 94105, USA.  For ported versions of the
 *  license, visit http://creativecommons.org/international/
 *
 *  Alternative licensing arrangements may be made by contacting the
 *  author at http://www.AMA3.com/contact/
 *
 *  This file adds basic labels for major time zones to the Any+Time(TM)
 *  JavaScript Library.  Time zone support is extremely complicated, and
 *  ECMA-262 (JavaScript) provides little support.  Developers are expected
 *  to tailor this file to meet their needs, mostly by removing lines that
 *  are not required by their users, and/or by removing either abbreviated
 *  (before double-dash) or long (after double-dash) names from the strings.
 *
 *  Note that there is no automatic detection of daylight savings time
 *  (AKA summer time), due to lack of support in JavaScript and the
 *  time-prohibitive complexity of attempting such support in code.
 *  If you want to take a stab at it, let me know; if you want to pay me
 *  large sums of money to add it, again, let me know. :-p
 *
 *  This file should be included AFTER anytime.js (or anytimec.js) in any
 *  HTML page that requires it.
 *
 *  Any+Time is a trademark of Andrew M. Andrews III.
 ****************************************************************************/

//=============================================================================
//  AnyTime.utcLabel is an array of arrays, indexed by UTC offset IN MINUTES
//  (not hours-and-minutes).  This is used by AnyTime.Converter to display
//  time zone labels when the "%@" format specifier is used.  It is also used
//  by AnyTime.widget() to determine which time zone labels to offer as valid
//  choices when a user attempts to change the time zone.  NOTE: Positive
//  indicies are NOT signed.
//
//  Each sub-array contains a series of strings, each of which is a label
//  for a time-zone having the corresponding UTC offset.  The first string in
//  each sub-array is the default label for that UTC offset (the one used by
//  AnyTime.Converter.format() if utcFormatOffsetSubIndex is not specified and
//  setUtcFormatOffsetSubIndex() is not called.
//=============================================================================

AnyTime.utcLabel = [];
AnyTime.utcLabel[-720] = [
  'BIT--Baker Island Time'
];
AnyTime.utcLabel[-660] = [
  'SST--Samoa Standard Time'
];
AnyTime.utcLabel[-600] = [
  'CKT--Cook Island Time'
  ,'HAST--Hawaii-Aleutian Standard Time'
  ,'TAHT--Tahiti Time'
];
AnyTime.utcLabel[-540] = [
  'AKST--Alaska Standard Time'
  ,'GIT--Gambier Island Time'
];
AnyTime.utcLabel[-510] = [
  'MIT--Marquesas Islands Time'
];
AnyTime.utcLabel[-480] = [
  'CIST--Clipperton Island Standard Time'
  ,'PST--Pacific Standard Time (North America)'
];
AnyTime.utcLabel[-420] = [
  'MST--Mountain Standard Time (North America)'
  ,'PDT--Pacific Daylight Time (North America)'
];
AnyTime.utcLabel[-360] = [
  'CST--Central Standard Time (North America)'
  ,'EAST--Easter Island Standard Time'
  ,'GALT--Galapagos Time'
  ,'MDT--Mountain Daylight Time (North America)'
];
AnyTime.utcLabel[-300] = [
  'CDT--Central Daylight Time (North America)'
  ,'COT--Colombia Time'
  ,'ECT--Ecuador Time'
  ,'EST--Eastern Standard Time (North America)'
];
AnyTime.utcLabel[-240] = [
  'AST--Atlantic Standard Time'
  ,'BOT--Bolivia Time'
  ,'CLT--Chile Standard Time'
  ,'COST--Colombia Summer Time'
  ,'ECT--Eastern Caribbean Time'
  ,'EDT--Eastern Daylight Time (North America)'
  ,'FKST--Falkland Islands Standard Time'
  ,'GYT--Guyana Time'
];
AnyTime.utcLabel[-210] = [
  'VET--Venezuelan Standard Time'
];
AnyTime.utcLabel[-180] = [
  'ART--Argentina Time'
  ,'BRT--Brasilia Time'
  ,'CLST--Chile Summer Time'
  ,'GFT--French Guiana Time'
  ,'UYT--Uruguay Standard Time'
];
AnyTime.utcLabel[-150] = [
  'NT--Newfoundland Time'
];
AnyTime.utcLabel[-120] = [
  'GST--South Georgia and the South Sandwich Islands'
  ,'UYST--Uruguay Summer Time'
];
AnyTime.utcLabel[-90] = [
  'NDT--Newfoundland Daylight Time'
];
AnyTime.utcLabel[-60] = [
  'AZOST--Azores Standard Time'
  ,'CVT--Cape Verde Time'
];
AnyTime.utcLabel[0] = [
  'GMT--Greenwich Mean Time'
  ,'WET--Western European Time'
];
AnyTime.utcLabel[60] = [
  'BST--British Summer Time'
  ,'CET--Central European Time'
];
AnyTime.utcLabel[60] = [
  'WAT--West Africa Time'
  ,'WEST--Western European Summer Time'
];
AnyTime.utcLabel[120] = [
  'CAT--Central Africa Time'
  ,'CEST--Central European Summer Time'
  ,'EET--Eastern European Time'
  ,'IST--Israel Standard Time'
  ,'SAST--South African Standard Time'
];
AnyTime.utcLabel[180] = [
  'AST--Arab Standard Time (Kuwait/Riyadh)'
  ,'AST--Arabic Standard Time (Baghdad)'
  ,'EAT--East Africa Time'
  ,'EEST--Eastern European Summer Time'
  ,'MSK--Moscow Standard Time'
];
AnyTime.utcLabel[210] = [
  'IRST--Iran Standard Time'
];
AnyTime.utcLabel[240] = [
  'AMT--Armenia Time'
  ,'AST--Arabian Standard Time (Abu Dhabi/Muscat)'
  ,'AZT--Azerbaijan Time'
  ,'GET--Georgia Standard Time'
  ,'MUT--Mauritius Time'
  ,'RET--Réunion Time'
  ,'SAMT--Samara Time'
  ,'SCT--Seychelles Time'
];
AnyTime.utcLabel[270] = [
  'AFT--Afghanistan Time'
];
AnyTime.utcLabel[300] = [
  'AMST--Armenia Summer Time'
  ,'HMT--Heard and McDonald Islands Time'
  ,'PKT--Pakistan Standard Time'
  ,'YEKT--Yekaterinburg Time'
];
AnyTime.utcLabel[330] = [
  'IST--Indian Standard Time'
  ,'SLT--Sri Lanka Time'
];
AnyTime.utcLabel[345] = [
  'NPT--Nepal Time'
];
AnyTime.utcLabel[360] = [
  'BIOT--British Indian Ocean Time'
  ,'BST--Bangladesh Standard Time'
  ,'BTT--Bhutan Time'
  ,'OMST--Omsk Time'
];
AnyTime.utcLabel[390] = [
  'CCT--Cocos Islands Time'
  ,'MST--Myanmar Standard Time'
];
AnyTime.utcLabel[420] = [
  'CXT--Christmas Island Time'
  ,'KRAT--Krasnoyarsk Time'
  ,'THA--Thailand Standard Time'
];
AnyTime.utcLabel[480] = [
  'ACT--ASEAN Common Time'
  ,'AWST--Australian Western Standard Time'
  ,'BDT--Brunei Time'
  ,'CST--China Standard Time'
  ,'HKT--Hong Kong Time'
  ,'IRKT--Irkutsk Time'
  ,'MST--Malaysian Standard Time'
  ,'PST--Philippine Standard Time'
  ,'SST--Singapore Standard Time'
];
AnyTime.utcLabel[540] = [
  'JST--Japan Standard Time'
  ,'KST--Korea Standard Time'
  ,'YAKT--Yakutsk Time'
];
AnyTime.utcLabel[570] = [
  'ACST--Australian Central Standard Time'
];
AnyTime.utcLabel[600] = [
  'AEST--Australian Eastern Standard Time'
  ,'ChST--Chamorro Standard Time'
  ,'VLAT--Vladivostok Time'
];
AnyTime.utcLabel[630] = [
  'LHST--Lord Howe Standard Time'
];
AnyTime.utcLabel[660] = [
  'MAGT--Magadan Time'
  ,'SBT--Solomon Islands Time'
];
AnyTime.utcLabel[690] = [
  'NFT--Norfolk Time'
];
AnyTime.utcLabel[720] = [
  'FJT--Fiji Time'
  ,'GILT--Gilbert Island Time'
  ,'PETT--Kamchatka Time'
];
AnyTime.utcLabel[765] = [
  'CHAST--Chatham Standard Time'
];
AnyTime.utcLabel[780] = [
  'PHOT--Phoenix Island Time'
];
AnyTime.utcLabel[840] = [
  'LINT--Line Islands Time'
];

//
//END OF FILE
//


/**
 * @preserve
 * FullCalendar v1.5.1
 * http://arshaw.com/fullcalendar/
 *
 * Use fullcalendar.css for basic styling.
 * For event drag & drop, requires jQuery UI draggable.
 * For event resizing, requires jQuery UI resizable.
 *
 * Copyright (c) 2011 Adam Shaw
 * Dual licensed under the MIT and GPL licenses, located in
 * MIT-LICENSE.txt and GPL-LICENSE.txt respectively.
 *
 * Date: Sat Apr 9 14:09:51 2011 -0700
 *
 */

(function($, undefined) {


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
    ignoreTimezone: true,

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
    },

    //selectable: false,
    unselectAuto: true,

    dropAccept: '*'

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


  var fc = $.fullCalendar = { version: "1.5.1" };
  var fcViews = fc.views = {};


  $.fn.fullCalendar = function(options) {


    // method calling
    if (typeof options == 'string') {
      var args = Array.prototype.slice.call(arguments, 1);
      var res;
      this.each(function() {
        var calendar = $.data(this, 'fullCalendar');
        if (calendar && $.isFunction(calendar[options])) {
          var r = calendar[options].apply(calendar, args);
          if (res === undefined) {
            res = r;
          }
          if (options == 'destroy') {
            $.removeData(this, 'fullCalendar');
          }
        }
      });
      if (res !== undefined) {
        return res;
      }
      return this;
    }


    // would like to have this logic in EventManager, but needs to happen before options are recursively extended
    var eventSources = options.eventSources || [];
    delete options.eventSources;
    if (options.events) {
      eventSources.push(options.events);
      delete options.events;
    }


    options = $.extend(true, {},
            defaults,
            (options.isRTL || options.isRTL === undefined && defaults.isRTL) ? rtlDefaults : {},
            options
            );


    this.each(function(i, _element) {
      var element = $(_element);
      var calendar = new Calendar(element, options, eventSources);
      element.data('fullCalendar', calendar); // TODO: look into memory leak implications
      calendar.render();
    });


    return this;

  };


// function for adding/overriding defaults
  function setDefaults(d) {
    $.extend(true, defaults, d);
  }


  function Calendar(element, options, eventSources) {
    var t = this;


    // exports
    t.options = options;
    t.render = render;
    t.destroy = destroy;
    t.refetchEvents = refetchEvents;
    t.reportEvents = reportEvents;
    t.reportEventChange = reportEventChange;
    t.rerenderEvents = rerenderEvents;
    t.changeView = changeView;
    t.select = select;
    t.unselect = unselect;
    t.prev = prev;
    t.next = next;
    t.prevYear = prevYear;
    t.nextYear = nextYear;
    t.today = today;
    t.gotoDate = gotoDate;
    t.incrementDate = incrementDate;
    t.formatDate = function(format, date) {
      return formatDate(format, date, options)
    };
    t.formatDates = function(format, date1, date2) {
      return formatDates(format, date1, date2, options)
    };
    t.getDate = getDate;
    t.getView = getView;
    t.option = option;
    t.trigger = trigger;


    // imports
    EventManager.call(t, options, eventSources);
    var isFetchNeeded = t.isFetchNeeded;
    var fetchEvents = t.fetchEvents;


    // locals
    var _element = element[0];
    var header;
    var headerElement;
    var content;
    var tm; // for making theme classes
    var currentView;
    var viewInstances = {};
    var elementOuterWidth;
    var suggestedViewHeight;
    var absoluteViewElement;
    var resizeUID = 0;
    var ignoreWindowResize = 0;
    var date = new Date();
    var events = [];
    var _dragElement;


    /* Main Rendering
     -----------------------------------------------------------------------------*/


    setYMD(date, options.year, options.month, options.date);


    function render(inc) {
      if (!content) {
        initialRender();
      } else {
        calcSize();
        markSizesDirty();
        markEventsDirty();
        renderView(inc);
      }
    }


    function initialRender() {
      tm = options.theme ? 'ui' : 'fc';
      element.addClass('fc');
      if (options.isRTL) {
        element.addClass('fc-rtl');
      }
      if (options.theme) {
        element.addClass('ui-widget');
      }
      content = $("<div class='fc-content' style='position:relative'/>")
              .prependTo(element);
      header = new Header(t, options);
      headerElement = header.render();
      if (headerElement) {
        element.prepend(headerElement);
      }
      changeView(options.defaultView);
      $(window).resize(windowResize);
      // needed for IE in a 0x0 iframe, b/c when it is resized, never triggers a windowResize
      if (!bodyVisible()) {
        lateRender();
      }
    }


    // called when we know the calendar couldn't be rendered when it was initialized,
    // but we think it's ready now
    function lateRender() {
      setTimeout(function() { // IE7 needs this so dimensions are calculated correctly
        if (!currentView.start && bodyVisible()) { // !currentView.start makes sure this never happens more than once
          renderView();
        }
      }, 0);
    }


    function destroy() {
      $(window).unbind('resize', windowResize);
      header.destroy();
      content.remove();
      element.removeClass('fc fc-rtl ui-widget');
    }


    function elementVisible() {
      return _element.offsetWidth !== 0;
    }


    function bodyVisible() {
      return $('body')[0].offsetWidth !== 0;
    }


    /* View Rendering
     -----------------------------------------------------------------------------*/

    // TODO: improve view switching (still weird transition in IE, and FF has whiteout problem)

    function changeView(newViewName) {
      if (!currentView || newViewName != currentView.name) {
        ignoreWindowResize++; // because setMinHeight might change the height before render (and subsequently setSize) is reached

        unselect();

        var oldView = currentView;
        var newViewElement;

        if (oldView) {
          (oldView.beforeHide || noop)(); // called before changing min-height. if called after, scroll state is reset (in Opera)
          setMinHeight(content, content.height());
          oldView.element.hide();
        } else {
          setMinHeight(content, 1); // needs to be 1 (not 0) for IE7, or else view dimensions miscalculated
        }
        content.css('overflow', 'hidden');

        currentView = viewInstances[newViewName];
        if (currentView) {
          currentView.element.show();
        } else {
          currentView = viewInstances[newViewName] = new fcViews[newViewName](
                  newViewElement = absoluteViewElement =
                          $("<div class='fc-view fc-view-" + newViewName + "' style='position:absolute'/>")
                                  .appendTo(content),
                  t // the calendar object
                  );
        }

        if (oldView) {
          header.deactivateButton(oldView.name);
        }
        header.activateButton(newViewName);

        renderView(); // after height has been set, will make absoluteViewElement's position=relative, then set to null

        content.css('overflow', '');
        if (oldView) {
          setMinHeight(content, 1);
        }

        if (!newViewElement) {
          (currentView.afterShow || noop)(); // called after setting min-height/overflow, so in final scroll state (for Opera)
        }

        ignoreWindowResize--;
      }
    }


    function renderView(inc) {
      if (elementVisible()) {
        ignoreWindowResize++; // because renderEvents might temporarily change the height before setSize is reached

        unselect();

        if (suggestedViewHeight === undefined) {
          calcSize();
        }

        var forceEventRender = false;
        if (!currentView.start || inc || date < currentView.start || date >= currentView.end) {
          // view must render an entire new date range (and refetch/render events)
          currentView.render(date, inc || 0); // responsible for clearing events
          setSize(true);
          forceEventRender = true;
        }
        else if (currentView.sizeDirty) {
          // view must resize (and rerender events)
          currentView.clearEvents();
          setSize();
          forceEventRender = true;
        }
        else if (currentView.eventsDirty) {
          currentView.clearEvents();
          forceEventRender = true;
        }
        currentView.sizeDirty = false;
        currentView.eventsDirty = false;
        updateEvents(forceEventRender);

        elementOuterWidth = element.outerWidth();

        header.updateTitle(currentView.title);
        var today = new Date();
        if (today >= currentView.start && today < currentView.end) {
          header.disableButton('today');
        } else {
          header.enableButton('today');
        }

        ignoreWindowResize--;
        currentView.trigger('viewDisplay', _element);
      }
    }


    /* Resizing
     -----------------------------------------------------------------------------*/


    function updateSize() {
      markSizesDirty();
      if (elementVisible()) {
        calcSize();
        setSize();
        unselect();
        currentView.clearEvents();
        currentView.renderEvents(events);
        currentView.sizeDirty = false;
      }
    }


    function markSizesDirty() {
      $.each(viewInstances, function(i, inst) {
        inst.sizeDirty = true;
      });
    }


    function calcSize() {
      if (options.contentHeight) {
        suggestedViewHeight = options.contentHeight;
      }
      else if (options.height) {
        suggestedViewHeight = options.height - (headerElement ? headerElement.height() : 0) - vsides(content);
      }
      else {
        suggestedViewHeight = Math.round(content.width() / Math.max(options.aspectRatio, .5));
      }
    }


    function setSize(dateChanged) { // todo: dateChanged?
      ignoreWindowResize++;
      currentView.setHeight(suggestedViewHeight, dateChanged);
      if (absoluteViewElement) {
        absoluteViewElement.css('position', 'relative');
        absoluteViewElement = null;
      }
      currentView.setWidth(content.width(), dateChanged);
      ignoreWindowResize--;
    }


    function windowResize() {
      if (!ignoreWindowResize) {
        if (currentView.start) { // view has already been rendered
          var uid = ++resizeUID;
          setTimeout(function() { // add a delay
            if (uid == resizeUID && !ignoreWindowResize && elementVisible()) {
              if (elementOuterWidth != (elementOuterWidth = element.outerWidth())) {
                ignoreWindowResize++; // in case the windowResize callback changes the height
                updateSize();
                currentView.trigger('windowResize', _element);
                ignoreWindowResize--;
              }
            }
          }, 200);
        } else {
          // calendar must have been initialized in a 0x0 iframe that has just been resized
          lateRender();
        }
      }
    }


    /* Event Fetching/Rendering
     -----------------------------------------------------------------------------*/


    // fetches events if necessary, rerenders events if necessary (or if forced)
    function updateEvents(forceRender) {
      if (!options.lazyFetching || isFetchNeeded(currentView.visStart, currentView.visEnd)) {
        refetchEvents();
      }
      else if (forceRender) {
        rerenderEvents();
      }
    }


    function refetchEvents() {
      fetchEvents(currentView.visStart, currentView.visEnd); // will call reportEvents
    }


    // called when event data arrives
    function reportEvents(_events) {
      events = _events;
      rerenderEvents();
    }


    // called when a single event's data has been changed
    function reportEventChange(eventID) {
      rerenderEvents(eventID);
    }


    // attempts to rerenderEvents
    function rerenderEvents(modifiedEventID) {
      markEventsDirty();
      if (elementVisible()) {
        currentView.clearEvents();
        currentView.renderEvents(events, modifiedEventID);
        currentView.eventsDirty = false;
      }
    }


    function markEventsDirty() {
      $.each(viewInstances, function(i, inst) {
        inst.eventsDirty = true;
      });
    }


    /* Selection
     -----------------------------------------------------------------------------*/


    function select(start, end, allDay) {
      currentView.select(start, end, allDay === undefined ? true : allDay);
    }


    function unselect() { // safe to be called before renderView
      if (currentView) {
        currentView.unselect();
      }
    }


    /* Date
     -----------------------------------------------------------------------------*/


    function prev() {
      renderView(-1);
    }


    function next() {
      renderView(1);
    }


    function prevYear() {
      addYears(date, -1);
      renderView();
    }


    function nextYear() {
      addYears(date, 1);
      renderView();
    }


    function today() {
      date = new Date();
      renderView();
    }


    function gotoDate(year, month, dateOfMonth) {
      if (year instanceof Date) {
        date = cloneDate(year); // provided 1 argument, a Date
      } else {
        setYMD(date, year, month, dateOfMonth);
      }
      renderView();
    }


    function incrementDate(years, months, days) {
      if (years !== undefined) {
        addYears(date, years);
      }
      if (months !== undefined) {
        addMonths(date, months);
      }
      if (days !== undefined) {
        addDays(date, days);
      }
      renderView();
    }


    function getDate() {
      return cloneDate(date);
    }


    /* Misc
     -----------------------------------------------------------------------------*/


    function getView() {
      return currentView;
    }


    function option(name, value) {
      if (value === undefined) {
        return options[name];
      }
      if (name == 'height' || name == 'contentHeight' || name == 'aspectRatio') {
        options[name] = value;
        updateSize();
      }
    }


    function trigger(name, thisObj) {
      if (options[name]) {
        return options[name].apply(
                thisObj || _element,
                Array.prototype.slice.call(arguments, 2)
                );
      }
    }


    /* External Dragging
     ------------------------------------------------------------------------*/

    if (options.droppable) {
      $(document)
              .bind('dragstart', function(ev, ui) {
        var _e = ev.target;
        var e = $(_e);
        if (!e.parents('.fc').length) { // not already inside a calendar
          var accept = options.dropAccept;
          if ($.isFunction(accept) ? accept.call(_e, e) : e.is(accept)) {
            _dragElement = _e;
            currentView.dragStart(_dragElement, ev, ui);
          }
        }
      })
              .bind('dragstop', function(ev, ui) {
        if (_dragElement) {
          currentView.dragStop(_dragElement, ev, ui);
          _dragElement = null;
        }
      });
    }


  }

  function Header(calendar, options) {
    var t = this;


    // exports
    t.render = render;
    t.destroy = destroy;
    t.updateTitle = updateTitle;
    t.activateButton = activateButton;
    t.deactivateButton = deactivateButton;
    t.disableButton = disableButton;
    t.enableButton = enableButton;


    // locals
    var element = $([]);
    var tm;


    function render() {
      tm = options.theme ? 'ui' : 'fc';
      var sections = options.header;
      if (sections) {
        element = $("<table class='fc-header' style='width:100%'/>")
                .append(
                $("<tr/>")
                        .append(renderSection('left'))
                        .append(renderSection('center'))
                        .append(renderSection('right'))
                );
        return element;
      }
    }


    function destroy() {
      element.remove();
    }


    function renderSection(position) {
      var e = $("<td class='fc-header-" + position + "'/>");
      var buttonStr = options.header[position];
      if (buttonStr) {
        $.each(buttonStr.split(' '), function(i) {
          if (i > 0) {
            e.append("<span class='fc-header-space'/>");
          }
          var prevButton;
          $.each(this.split(','), function(j, buttonName) {
            if (buttonName == 'title') {
              e.append("<span class='fc-header-title'><h2>&nbsp;</h2></span>");
              if (prevButton) {
                prevButton.addClass(tm + '-corner-right');
              }
              prevButton = null;
            } else {
              var buttonClick;
              if (calendar[buttonName]) {
                buttonClick = calendar[buttonName]; // calendar method
              }
              else if (fcViews[buttonName]) {
                buttonClick = function() {
                  button.removeClass(tm + '-state-hover'); // forget why
                  calendar.changeView(buttonName);
                };
              }
              if (buttonClick) {
                var icon = options.theme ? smartProperty(options.buttonIcons, buttonName) : null; // why are we using smartProperty here?
                var text = smartProperty(options.buttonText, buttonName); // why are we using smartProperty here?
                var button = $(
                        "<span class='fc-button fc-button-" + buttonName + " " + tm + "-state-default'>" +
                                "<span class='fc-button-inner'>" +
                                "<span class='fc-button-content'>" +
                                (icon ?
                                        "<span class='fc-icon-wrap'>" +
                                                "<span class='ui-icon ui-icon-" + icon + "'/>" +
                                                "</span>" :
                                        text
                                        ) +
                                "</span>" +
                                "<span class='fc-button-effect'><span></span></span>" +
                                "</span>" +
                                "</span>"
                        );
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
                          .appendTo(e);
                  if (!prevButton) {
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
      }
      return e;
    }


    function updateTitle(html) {
      element.find('h2')
              .html(html);
    }


    function activateButton(buttonName) {
      element.find('span.fc-button-' + buttonName)
              .addClass(tm + '-state-active');
    }


    function deactivateButton(buttonName) {
      element.find('span.fc-button-' + buttonName)
              .removeClass(tm + '-state-active');
    }


    function disableButton(buttonName) {
      element.find('span.fc-button-' + buttonName)
              .addClass(tm + '-state-disabled');
    }


    function enableButton(buttonName) {
      element.find('span.fc-button-' + buttonName)
              .removeClass(tm + '-state-disabled');
    }


  }

  fc.sourceNormalizers = [];
  fc.sourceFetchers = [];

  var ajaxDefaults = {
    dataType: 'json',
    cache: false
  };

  var eventGUID = 1;


  function EventManager(options, _sources) {
    var t = this;


    // exports
    t.isFetchNeeded = isFetchNeeded;
    t.fetchEvents = fetchEvents;
    t.addEventSource = addEventSource;
    t.removeEventSource = removeEventSource;
    t.updateEvent = updateEvent;
    t.renderEvent = renderEvent;
    t.removeEvents = removeEvents;
    t.clientEvents = clientEvents;
    t.normalizeEvent = normalizeEvent;


    // imports
    var trigger = t.trigger;
    var getView = t.getView;
    var reportEvents = t.reportEvents;


    // locals
    var stickySource = { events: [] };
    var sources = [ stickySource ];
    var rangeStart, rangeEnd;
    var currentFetchID = 0;
    var pendingSourceCnt = 0;
    var loadingLevel = 0;
    var cache = [];


    for (var i = 0; i < _sources.length; i++) {
      _addEventSource(_sources[i]);
    }


    /* Fetching
     -----------------------------------------------------------------------------*/


    function isFetchNeeded(start, end) {
      return !rangeStart || start < rangeStart || end > rangeEnd;
    }


    function fetchEvents(start, end) {
      rangeStart = start;
      rangeEnd = end;
      cache = [];
      var fetchID = ++currentFetchID;
      var len = sources.length;
      pendingSourceCnt = len;
      for (var i = 0; i < len; i++) {
        fetchEventSource(sources[i], fetchID);
      }
    }


    function fetchEventSource(source, fetchID) {
      _fetchEventSource(source, function(events) {
        if (fetchID == currentFetchID) {
          if (events) {
            for (var i = 0; i < events.length; i++) {
              events[i].source = source;
              normalizeEvent(events[i]);
            }
            cache = cache.concat(events);
          }
          pendingSourceCnt--;
          if (!pendingSourceCnt) {
            reportEvents(cache);
          }
        }
      });
    }


    function _fetchEventSource(source, callback) {
      var i;
      var fetchers = fc.sourceFetchers;
      var res;
      for (i = 0; i < fetchers.length; i++) {
        res = fetchers[i](source, rangeStart, rangeEnd, callback);
        if (res === true) {
          // the fetcher is in charge. made its own async request
          return;
        }
        else if (typeof res == 'object') {
          // the fetcher returned a new source. process it
          _fetchEventSource(res, callback);
          return;
        }
      }
      var events = source.events;
      if (events) {
        if ($.isFunction(events)) {
          pushLoading();
          events(cloneDate(rangeStart), cloneDate(rangeEnd), function(events) {
            callback(events);
            popLoading();
          });
        }
        else if ($.isArray(events)) {
          callback(events);
        }
        else {
          callback();
        }
      } else {
        var url = source.url;
        if (url) {
          var success = source.success;
          var error = source.error;
          var complete = source.complete;
          var data = $.extend({}, source.data || {});
          var startParam = firstDefined(source.startParam, options.startParam);
          var endParam = firstDefined(source.endParam, options.endParam);
          if (startParam) {
            data[startParam] = Math.round(+rangeStart / 1000);
          }
          if (endParam) {
            data[endParam] = Math.round(+rangeEnd / 1000);
          }
          pushLoading();
          $.ajax($.extend({}, ajaxDefaults, source, {
            data: data,
            success: function(events) {
              events = events || [];
              var res = applyAll(success, this, arguments);
              if ($.isArray(res)) {
                events = res;
              }
              callback(events);
            },
            error: function() {
              applyAll(error, this, arguments);
              callback();
            },
            complete: function() {
              applyAll(complete, this, arguments);
              popLoading();
            }
          }));
        } else {
          callback();
        }
      }
    }


    /* Sources
     -----------------------------------------------------------------------------*/


    function addEventSource(source) {
      source = _addEventSource(source);
      if (source) {
        pendingSourceCnt++;
        fetchEventSource(source, currentFetchID); // will eventually call reportEvents
      }
    }


    function _addEventSource(source) {
      if ($.isFunction(source) || $.isArray(source)) {
        source = { events: source };
      }
      else if (typeof source == 'string') {
        source = { url: source };
      }
      if (typeof source == 'object') {
        normalizeSource(source);
        sources.push(source);
        return source;
      }
    }


    function removeEventSource(source) {
      sources = $.grep(sources, function(src) {
        return !isSourcesEqual(src, source);
      });
      // remove all client events from that source
      cache = $.grep(cache, function(e) {
        return !isSourcesEqual(e.source, source);
      });
      reportEvents(cache);
    }


    /* Manipulation
     -----------------------------------------------------------------------------*/


    function updateEvent(event) { // update an existing event
      var i, len = cache.length, e,
              defaultEventEnd = getView().defaultEventEnd, // getView???
              startDelta = event.start - event._start,
              endDelta = event.end ?
                      (event.end - (event._end || defaultEventEnd(event))) // event._end would be null if event.end
                      : 0;                                                      // was null and event was just resized
      for (i = 0; i < len; i++) {
        e = cache[i];
        if (e._id == event._id && e != event) {
          e.start = new Date(+e.start + startDelta);
          if (event.end) {
            if (e.end) {
              e.end = new Date(+e.end + endDelta);
            } else {
              e.end = new Date(+defaultEventEnd(e) + endDelta);
            }
          } else {
            e.end = null;
          }
          e.title = event.title;
          e.url = event.url;
          e.allDay = event.allDay;
          e.className = event.className;
          e.editable = event.editable;
          e.color = event.color;
          e.backgroudColor = event.backgroudColor;
          e.borderColor = event.borderColor;
          e.textColor = event.textColor;
          normalizeEvent(e);
        }
      }
      normalizeEvent(event);
      reportEvents(cache);
    }


    function renderEvent(event, stick) {
      normalizeEvent(event);
      if (!event.source) {
        if (stick) {
          stickySource.events.push(event);
          event.source = stickySource;
        }
        cache.push(event);
      }
      reportEvents(cache);
    }


    function removeEvents(filter) {
      if (!filter) { // remove all
        cache = [];
        // clear all array sources
        for (var i = 0; i < sources.length; i++) {
          if ($.isArray(sources[i].events)) {
            sources[i].events = [];
          }
        }
      } else {
        if (!$.isFunction(filter)) { // an event ID
          var id = filter + '';
          filter = function(e) {
            return e._id == id;
          };
        }
        cache = $.grep(cache, filter, true);
        // remove events from array sources
        for (var i = 0; i < sources.length; i++) {
          if ($.isArray(sources[i].events)) {
            sources[i].events = $.grep(sources[i].events, filter, true);
          }
        }
      }
      reportEvents(cache);
    }


    function clientEvents(filter) {
      if ($.isFunction(filter)) {
        return $.grep(cache, filter);
      }
      else if (filter) { // an event ID
        filter += '';
        return $.grep(cache, function(e) {
          return e._id == filter;
        });
      }
      return cache; // else, return all
    }


    /* Loading State
     -----------------------------------------------------------------------------*/


    function pushLoading() {
      if (!loadingLevel++) {
        trigger('loading', null, true);
      }
    }


    function popLoading() {
      if (!--loadingLevel) {
        trigger('loading', null, false);
      }
    }


    /* Event Normalization
     -----------------------------------------------------------------------------*/


    function normalizeEvent(event) {
      var source = event.source || {};
      var ignoreTimezone = firstDefined(source.ignoreTimezone, options.ignoreTimezone);
      event._id = event._id || (event.id === undefined ? '_fc' + eventGUID++ : event.id + '');
      if (event.date) {
        if (!event.start) {
          event.start = event.date;
        }
        delete event.date;
      }
      event._start = cloneDate(event.start = parseDate(event.start, ignoreTimezone));
      event.end = parseDate(event.end, ignoreTimezone);
      if (event.end && event.end <= event.start) {
        event.end = null;
      }
      event._end = event.end ? cloneDate(event.end) : null;
      if (event.allDay === undefined) {
        event.allDay = firstDefined(source.allDayDefault, options.allDayDefault);
      }
      if (event.className) {
        if (typeof event.className == 'string') {
          event.className = event.className.split(/\s+/);
        }
      } else {
        event.className = [];
      }
      // TODO: if there is no start date, return false to indicate an invalid event
    }


    /* Utils
     ------------------------------------------------------------------------------*/


    function normalizeSource(source) {
      if (source.className) {
        // TODO: repeat code, same code for event classNames
        if (typeof source.className == 'string') {
          source.className = source.className.split(/\s+/);
        }
      } else {
        source.className = [];
      }
      var normalizers = fc.sourceNormalizers;
      for (var i = 0; i < normalizers.length; i++) {
        normalizers[i](source);
      }
    }


    function isSourcesEqual(source1, source2) {
      return source1 && source2 && getSourcePrimitive(source1) == getSourcePrimitive(source2);
    }


    function getSourcePrimitive(source) {
      return ((typeof source == 'object') ? (source.events || source.url) : '') || source;
    }


  }


  fc.addDays = addDays;
  fc.cloneDate = cloneDate;
  fc.parseDate = parseDate;
  fc.parseISO8601 = parseISO8601;
  fc.parseTime = parseTime;
  fc.formatDate = formatDate;
  fc.formatDates = formatDates;


  /* Date Math
   -----------------------------------------------------------------------------*/

  var dayIDs = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
          DAY_MS = 86400000,
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
    var i = 0, d;
    do {
      d = new Date(1970, i++, 1);
    } while (d.getHours()); // != 0
    return d;
  }


  function skipWeekend(date, inc, excl) {
    inc = inc || 1;
    while (!date.getDay() || (excl && date.getDay() == 1 || !excl && date.getDay() == 6)) {
      addDays(date, inc);
    }
    return date;
  }


  function dayDiff(d1, d2) { // d1 - d2
    return Math.round((cloneDate(d1, true) - cloneDate(d2, true)) / DAY_MS);
  }


  function setYMD(date, y, m, d) {
    if (y !== undefined && y != date.getFullYear()) {
      date.setDate(1);
      date.setMonth(0);
      date.setFullYear(y);
    }
    if (m !== undefined && m != date.getMonth()) {
      date.setDate(1);
      date.setMonth(m);
    }
    if (d !== undefined) {
      date.setDate(d);
    }
  }


  /* Date Parsing
   -----------------------------------------------------------------------------*/


  function parseDate(s, ignoreTimezone) { // ignoreTimezone defaults to true
    if (typeof s == 'object') { // already a Date object
      return s;
    }
    if (typeof s == 'number') { // a UNIX timestamp
      return new Date(s * 1000);
    }
    if (typeof s == 'string') {
      if (s.match(/^\d+(\.\d+)?$/)) { // a UNIX timestamp
        return new Date(parseFloat(s) * 1000);
      }
      if (ignoreTimezone === undefined) {
        ignoreTimezone = true;
      }
      return parseISO8601(s, ignoreTimezone) || (s ? new Date(s) : null);
    }
    // TODO: never return invalid dates (like from new Date(<string>)), return null instead
    return null;
  }


  function parseISO8601(s, ignoreTimezone) { // ignoreTimezone defaults to false
    // derived from http://delete.me.uk/2005/03/iso8601.html
    // TODO: for a know glitch/feature, read tests/issue_206_parseDate_dst.html
    var m = s.match(/^([0-9]{4})(-([0-9]{2})(-([0-9]{2})([T ]([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?(Z|(([-+])([0-9]{2})(:?([0-9]{2}))?))?)?)?)?$/);
    if (!m) {
      return null;
    }
    var date = new Date(m[1], 0, 1);
    if (ignoreTimezone || !m[14]) {
      var check = new Date(m[1], 0, 1, 9, 0);
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
    } else {
      date.setUTCFullYear(
              m[1],
              m[3] ? m[3] - 1 : 0,
              m[5] || 1
              );
      date.setUTCHours(
              m[7] || 0,
              m[8] || 0,
              m[10] || 0,
              m[12] ? Number("0." + m[12]) * 1000 : 0
              );
      var offset = Number(m[16]) * 60 + (m[18] ? Number(m[18]) : 0);
      offset *= m[15] == '-' ? 1 : -1;
      date = new Date(+date + (offset * 60 * 1000));
    }
    return date;
  }


  function parseTime(s) { // returns minutes since start of day
    if (typeof s == 'number') { // an hour
      return s * 60;
    }
    if (typeof s == 'object') { // a Date object
      return s.getHours() * 60 + s.getMinutes();
    }
    var m = s.match(/(\d+)(?::(\d+))?\s*(\w+)?/);
    if (m) {
      var h = parseInt(m[1], 10);
      if (m[3]) {
        h %= 12;
        if (m[3].toLowerCase().charAt(0) == 'p') {
          h += 12;
        }
      }
      return h * 60 + (m[2] ? parseInt(m[2], 10) : 0);
    }
  }


  /* Date Formatting
   -----------------------------------------------------------------------------*/
// TODO: use same function formatDate(date, [date2], format, [options])


  function formatDate(date, format, options) {
    return formatDates(date, null, format, options);
  }


  function formatDates(date1, date2, format, options) {
    options = options || defaults;
    var date = date1,
            otherDate = date2,
            i, len = format.length, c,
            i2, formatter,
            res = '';
    for (i = 0; i < len; i++) {
      c = format.charAt(i);
      if (c == "'") {
        for (i2 = i + 1; i2 < len; i2++) {
          if (format.charAt(i2) == "'") {
            if (date) {
              if (i2 == i + 1) {
                res += "'";
              } else {
                res += format.substring(i + 1, i2);
              }
              i = i2;
            }
            break;
          }
        }
      }
      else if (c == '(') {
        for (i2 = i + 1; i2 < len; i2++) {
          if (format.charAt(i2) == ')') {
            var subres = formatDate(date, format.substring(i + 1, i2), options);
            if (parseInt(subres.replace(/\D/, ''), 10)) {
              res += subres;
            }
            i = i2;
            break;
          }
        }
      }
      else if (c == '[') {
        for (i2 = i + 1; i2 < len; i2++) {
          if (format.charAt(i2) == ']') {
            var subformat = format.substring(i + 1, i2);
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
        for (i2 = len; i2 > i; i2--) {
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

  ;


  var dateFormatters = {
    s    : function(d) {
      return d.getSeconds()
    },
    ss    : function(d) {
      return zeroPad(d.getSeconds())
    },
    m    : function(d) {
      return d.getMinutes()
    },
    mm    : function(d) {
      return zeroPad(d.getMinutes())
    },
    h    : function(d) {
      return d.getHours() % 12 || 12
    },
    hh    : function(d) {
      return zeroPad(d.getHours() % 12 || 12)
    },
    H    : function(d) {
      return d.getHours()
    },
    HH    : function(d) {
      return zeroPad(d.getHours())
    },
    d    : function(d) {
      return d.getDate()
    },
    dd    : function(d) {
      return zeroPad(d.getDate())
    },
    ddd    : function(d, o) {
      return o.dayNamesShort[d.getDay()]
    },
    dddd: function(d, o) {
      return o.dayNames[d.getDay()]
    },
    M    : function(d) {
      return d.getMonth() + 1
    },
    MM    : function(d) {
      return zeroPad(d.getMonth() + 1)
    },
    MMM    : function(d, o) {
      return o.monthNamesShort[d.getMonth()]
    },
    MMMM: function(d, o) {
      return o.monthNames[d.getMonth()]
    },
    yy    : function(d) {
      return (d.getFullYear() + '').substring(2)
    },
    yyyy: function(d) {
      return d.getFullYear()
    },
    t    : function(d) {
      return d.getHours() < 12 ? 'a' : 'p'
    },
    tt    : function(d) {
      return d.getHours() < 12 ? 'am' : 'pm'
    },
    T    : function(d) {
      return d.getHours() < 12 ? 'A' : 'P'
    },
    TT    : function(d) {
      return d.getHours() < 12 ? 'AM' : 'PM'
    },
    u    : function(d) {
      return formatDate(d, "yyyy-MM-dd'T'HH:mm:ss'Z'")
    },
    S    : function(d) {
      var date = d.getDate();
      if (date > 10 && date < 20) {
        return 'th';
      }
      return ['st', 'nd', 'rd'][date % 10 - 1] || 'th';
    }
  };


  fc.applyAll = applyAll;


  /* Event Date Math
   -----------------------------------------------------------------------------*/


  function exclEndDay(event) {
    if (event.end) {
      return _exclEndDay(event.end, event.allDay);
    } else {
      return addDays(cloneDate(event.start), 1);
    }
  }


  function _exclEndDay(end, allDay) {
    end = cloneDate(end);
    return allDay || end.getHours() || end.getMinutes() ? addDays(end, 1) : clearTime(end);
  }


  function segCmp(a, b) {
    return (b.msLength - a.msLength) * 100 + (a.event.start - b.event.start);
  }


  function segsCollide(seg1, seg2) {
    return seg1.end > seg2.start && seg1.start < seg2.end;
  }


  /* Event Sorting
   -----------------------------------------------------------------------------*/


// event rendering utilities
  function sliceSegs(events, visEventEnds, start, end) {
    var segs = [],
            i, len = events.length, event,
            eventStart, eventEnd,
            segStart, segEnd,
            isStart, isEnd;
    for (i = 0; i < len; i++) {
      event = events[i];
      eventStart = event.start;
      eventEnd = visEventEnds[i];
      if (eventEnd > start && eventStart < end) {
        if (eventStart < start) {
          segStart = cloneDate(start);
          isStart = false;
        } else {
          segStart = eventStart;
          isStart = true;
        }
        if (eventEnd > end) {
          segEnd = cloneDate(end);
          isEnd = false;
        } else {
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


// event rendering calculation utilities
  function stackSegs(segs) {
    var levels = [],
            i, len = segs.length, seg,
            j, collide, k;
    for (i = 0; i < len; i++) {
      seg = segs[i];
      j = 0; // the level index where seg should belong
      while (true) {
        collide = false;
        if (levels[j]) {
          for (k = 0; k < levels[j].length; k++) {
            if (segsCollide(levels[j][k], seg)) {
              collide = true;
              break;
            }
          }
        }
        if (collide) {
          j++;
        } else {
          break;
        }
      }
      if (levels[j]) {
        levels[j].push(seg);
      } else {
        levels[j] = [seg];
      }
    }
    return levels;
  }


  /* Event Element Binding
   -----------------------------------------------------------------------------*/


  function lazySegBind(container, segs, bindHandlers) {
    container.unbind('mouseover').mouseover(function(ev) {
      var parent = ev.target, e,
              i, seg;
      while (parent != this) {
        e = parent;
        parent = parent.parentNode;
      }
      if ((i = e._fci) !== undefined) {
        e._fci = undefined;
        seg = segs[i];
        bindHandlers(seg.event, seg.element, seg);
        $(ev.target).trigger(ev);
      }
      ev.stopPropagation();
    });
  }


  /* Element Dimensions
   -----------------------------------------------------------------------------*/


  function setOuterWidth(element, width, includeMargins) {
    for (var i = 0, e; i < element.length; i++) {
      e = $(element[i]);
      e.width(Math.max(0, width - hsides(e, includeMargins)));
    }
  }


  function setOuterHeight(element, height, includeMargins) {
    for (var i = 0, e; i < element.length; i++) {
      e = $(element[i]);
      e.height(Math.max(0, height - vsides(e, includeMargins)));
    }
  }


// TODO: curCSS has been deprecated (jQuery 1.4.3 - 10/16/2010)


  function hsides(element, includeMargins) {
    return hpadding(element) + hborders(element) + (includeMargins ? hmargins(element) : 0);
  }


  function hpadding(element) {
    return (parseFloat($.curCSS(element[0], 'paddingLeft', true)) || 0) +
            (parseFloat($.curCSS(element[0], 'paddingRight', true)) || 0);
  }


  function hmargins(element) {
    return (parseFloat($.curCSS(element[0], 'marginLeft', true)) || 0) +
            (parseFloat($.curCSS(element[0], 'marginRight', true)) || 0);
  }


  function hborders(element) {
    return (parseFloat($.curCSS(element[0], 'borderLeftWidth', true)) || 0) +
            (parseFloat($.curCSS(element[0], 'borderRightWidth', true)) || 0);
  }


  function vsides(element, includeMargins) {
    return vpadding(element) + vborders(element) + (includeMargins ? vmargins(element) : 0);
  }


  function vpadding(element) {
    return (parseFloat($.curCSS(element[0], 'paddingTop', true)) || 0) +
            (parseFloat($.curCSS(element[0], 'paddingBottom', true)) || 0);
  }


  function vmargins(element) {
    return (parseFloat($.curCSS(element[0], 'marginTop', true)) || 0) +
            (parseFloat($.curCSS(element[0], 'marginBottom', true)) || 0);
  }


  function vborders(element) {
    return (parseFloat($.curCSS(element[0], 'borderTopWidth', true)) || 0) +
            (parseFloat($.curCSS(element[0], 'borderBottomWidth', true)) || 0);
  }


  function setMinHeight(element, height) {
    height = (typeof height == 'number' ? height + 'px' : height);
    element.each(function(i, _element) {
      _element.style.cssText += ';min-height:' + height + ';_height:' + height;
      // why can't we just use .css() ? i forget
    });
  }


  /* Misc Utils
   -----------------------------------------------------------------------------*/


//TODO: arraySlice
//TODO: isFunction, grep ?


  function noop() {
  }


  function cmp(a, b) {
    return a - b;
  }


  function arrayMax(a) {
    return Math.max.apply(Math, a);
  }


  function zeroPad(n) {
    return (n < 10 ? '0' : '') + n;
  }


  function smartProperty(obj, name) { // get a camel-cased/namespaced property of an object
    if (obj[name] !== undefined) {
      return obj[name];
    }
    var parts = name.split(/(?=[A-Z])/),
            i = parts.length - 1, res;
    for (; i >= 0; i--) {
      res = obj[parts[i].toLowerCase()];
      if (res !== undefined) {
        return res;
      }
    }
    return obj[''];
  }


  function htmlEscape(s) {
    return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#039;')
            .replace(/"/g, '&quot;')
            .replace(/\n/g, '<br />');
  }


  function cssKey(_element) {
    return _element.id + '/' + _element.className + '/' + _element.style.cssText.replace(/(^|;)\s*(top|left|width|height)\s*:[^;]*/ig, '');
  }


  function disableTextSelection(element) {
    element
            .attr('unselectable', 'on')
            .css('MozUserSelect', 'none')
            .bind('selectstart.ui', function() {
      return false;
    });
  }


  /*
   function enableTextSelection(element) {
   element
   .attr('unselectable', 'off')
   .css('MozUserSelect', '')
   .unbind('selectstart.ui');
   }
   */


  function markFirstLast(e) {
    e.children()
            .removeClass('fc-first fc-last')
            .filter(':first-child')
            .addClass('fc-first')
            .end()
            .filter(':last-child')
            .addClass('fc-last');
  }


  function setDayID(cell, date) {
    cell.each(function(i, _cell) {
      _cell.className = _cell.className.replace(/^fc-\w*/, 'fc-' + dayIDs[date.getDay()]);
      // TODO: make a way that doesn't rely on order of classes
    });
  }


  function getSkinCss(event, opt) {
    var source = event.source || {};
    var eventColor = event.color;
    var sourceColor = source.color;
    var optionColor = opt('eventColor');
    var backgroundColor =
            event.backgroundColor ||
                    eventColor ||
                    source.backgroundColor ||
                    sourceColor ||
                    opt('eventBackgroundColor') ||
                    optionColor;
    var borderColor =
            event.borderColor ||
                    eventColor ||
                    source.borderColor ||
                    sourceColor ||
                    opt('eventBorderColor') ||
                    optionColor;
    var textColor =
            event.textColor ||
                    source.textColor ||
                    opt('eventTextColor');
    var statements = [];
    if (backgroundColor) {
      statements.push('background-color:' + backgroundColor);
    }
    if (borderColor) {
      statements.push('border-color:' + borderColor);
    }
    if (textColor) {
      statements.push('color:' + textColor);
    }
    return statements.join(';');
  }


  function applyAll(functions, thisObj, args) {
    if ($.isFunction(functions)) {
      functions = [ functions ];
    }
    if (functions) {
      var i;
      var ret;
      for (i = 0; i < functions.length; i++) {
        ret = functions[i].apply(thisObj, args) || ret;
      }
      return ret;
    }
  }


  function firstDefined() {
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] !== undefined) {
        return arguments[i];
      }
    }
  }


  fcViews.month = MonthView;

  function MonthView(element, calendar) {
    var t = this;


    // exports
    t.render = render;


    // imports
    BasicView.call(t, element, calendar, 'month');
    var opt = t.opt;
    var renderBasic = t.renderBasic;
    var formatDate = calendar.formatDate;


    function render(date, delta) {
      if (delta) {
        addMonths(date, delta);
        date.setDate(1);
      }
      var start = cloneDate(date, true);
      start.setDate(1);
      var end = addMonths(cloneDate(start), 1);
      var visStart = cloneDate(start);
      var visEnd = cloneDate(end);
      var firstDay = opt('firstDay');
      var nwe = opt('weekends') ? 0 : 1;
      if (nwe) {
        skipWeekend(visStart);
        skipWeekend(visEnd, -1, true);
      }
      addDays(visStart, -((visStart.getDay() - Math.max(firstDay, nwe) + 7) % 7));
      addDays(visEnd, (7 - visEnd.getDay() + Math.max(firstDay, nwe)) % 7);
      var rowCnt = Math.round((visEnd - visStart) / (DAY_MS * 7));
      if (opt('weekMode') == 'fixed') {
        addDays(visEnd, (6 - rowCnt) * 7);
        rowCnt = 6;
      }
      t.title = formatDate(start, opt('titleFormat'));
      t.start = start;
      t.end = end;
      t.visStart = visStart;
      t.visEnd = visEnd;
      renderBasic(6, rowCnt, nwe ? 5 : 7, true);
    }


  }

  fcViews.basicWeek = BasicWeekView;

  function BasicWeekView(element, calendar) {
    var t = this;


    // exports
    t.render = render;


    // imports
    BasicView.call(t, element, calendar, 'basicWeek');
    var opt = t.opt;
    var renderBasic = t.renderBasic;
    var formatDates = calendar.formatDates;


    function render(date, delta) {
      if (delta) {
        addDays(date, delta * 7);
      }
      var start = addDays(cloneDate(date), -((date.getDay() - opt('firstDay') + 7) % 7));
      var end = addDays(cloneDate(start), 7);
      var visStart = cloneDate(start);
      var visEnd = cloneDate(end);
      var weekends = opt('weekends');
      if (!weekends) {
        skipWeekend(visStart);
        skipWeekend(visEnd, -1, true);
      }
      t.title = formatDates(
              visStart,
              addDays(cloneDate(visEnd), -1),
              opt('titleFormat')
              );
      t.start = start;
      t.end = end;
      t.visStart = visStart;
      t.visEnd = visEnd;
      renderBasic(1, 1, weekends ? 7 : 5, false);
    }


  }

  fcViews.basicDay = BasicDayView;

//TODO: when calendar's date starts out on a weekend, shouldn't happen


  function BasicDayView(element, calendar) {
    var t = this;


    // exports
    t.render = render;


    // imports
    BasicView.call(t, element, calendar, 'basicDay');
    var opt = t.opt;
    var renderBasic = t.renderBasic;
    var formatDate = calendar.formatDate;


    function render(date, delta) {
      if (delta) {
        addDays(date, delta);
        if (!opt('weekends')) {
          skipWeekend(date, delta < 0 ? -1 : 1);
        }
      }
      t.title = formatDate(date, opt('titleFormat'));
      t.start = t.visStart = cloneDate(date, true);
      t.end = t.visEnd = addDays(cloneDate(t.start), 1);
      renderBasic(1, 1, 1, false);
    }


  }

  setDefaults({
    weekMode: 'fixed'
  });


  function BasicView(element, calendar, viewName) {
    var t = this;


    // exports
    t.renderBasic = renderBasic;
    t.setHeight = setHeight;
    t.setWidth = setWidth;
    t.renderDayOverlay = renderDayOverlay;
    t.defaultSelectionEnd = defaultSelectionEnd;
    t.renderSelection = renderSelection;
    t.clearSelection = clearSelection;
    t.reportDayClick = reportDayClick; // for selection (kinda hacky)
    t.dragStart = dragStart;
    t.dragStop = dragStop;
    t.defaultEventEnd = defaultEventEnd;
    t.getHoverListener = function() {
      return hoverListener
    };
    t.colContentLeft = colContentLeft;
    t.colContentRight = colContentRight;
    t.dayOfWeekCol = dayOfWeekCol;
    t.dateCell = dateCell;
    t.cellDate = cellDate;
    t.cellIsAllDay = function() {
      return true
    };
    t.allDayRow = allDayRow;
    t.allDayBounds = allDayBounds;
    t.getRowCnt = function() {
      return rowCnt
    };
    t.getColCnt = function() {
      return colCnt
    };
    t.getColWidth = function() {
      return colWidth
    };
    t.getDaySegmentContainer = function() {
      return daySegmentContainer
    };


    // imports
    View.call(t, element, calendar, viewName);
    OverlayManager.call(t);
    SelectionManager.call(t);
    BasicEventRenderer.call(t);
    var opt = t.opt;
    var trigger = t.trigger;
    var clearEvents = t.clearEvents;
    var renderOverlay = t.renderOverlay;
    var clearOverlays = t.clearOverlays;
    var daySelectionMousedown = t.daySelectionMousedown;
    var formatDate = calendar.formatDate;


    // locals

    var head;
    var headCells;
    var body;
    var bodyRows;
    var bodyCells;
    var bodyFirstCells;
    var bodyCellTopInners;
    var daySegmentContainer;

    var viewWidth;
    var viewHeight;
    var colWidth;

    var rowCnt, colCnt;
    var coordinateGrid;
    var hoverListener;
    var colContentPositions;

    var rtl, dis, dit;
    var firstDay;
    var nwe;
    var tm;
    var colFormat;


    /* Rendering
     ------------------------------------------------------------*/


    disableTextSelection(element.addClass('fc-grid'));


    function renderBasic(maxr, r, c, showNumbers) {
      rowCnt = r;
      colCnt = c;
      updateOptions();
      var firstTime = !body;
      if (firstTime) {
        buildSkeleton(maxr, showNumbers);
      } else {
        clearEvents();
      }
      updateCells(firstTime);
    }


    function updateOptions() {
      rtl = opt('isRTL');
      if (rtl) {
        dis = -1;
        dit = colCnt - 1;
      } else {
        dis = 1;
        dit = 0;
      }
      firstDay = opt('firstDay');
      nwe = opt('weekends') ? 0 : 1;
      tm = opt('theme') ? 'ui' : 'fc';
      colFormat = opt('columnFormat');
    }


    function buildSkeleton(maxRowCnt, showNumbers) {
      var s;
      var headerClass = tm + "-widget-header";
      var contentClass = tm + "-widget-content";
      var i, j;
      var table;

      s =
              "<table class='fc-border-separate' style='width:100%' cellspacing='0'>" +
                      "<thead>" +
                      "<tr>";
      for (i = 0; i < colCnt; i++) {
        s +=
                "<th class='fc- " + headerClass + "'/>"; // need fc- for setDayID
      }
      s +=
              "</tr>" +
                      "</thead>" +
                      "<tbody>";
      for (i = 0; i < maxRowCnt; i++) {
        s +=
                "<tr class='fc-week" + i + "'>";
        for (j = 0; j < colCnt; j++) {
          s +=
                  "<td class='fc- " + contentClass + " fc-day" + (i * colCnt + j) + "'>" + // need fc- for setDayID
                          "<div>" +
                          (showNumbers ?
                                  "<div class='fc-day-number'/>" :
                                  ''
                                  ) +
                          "<div class='fc-day-content'>" +
                          "<div style='position:relative'>&nbsp;</div>" +
                          "</div>" +
                          "</div>" +
                          "</td>";
        }
        s +=
                "</tr>";
      }
      s +=
              "</tbody>" +
                      "</table>";
      table = $(s).appendTo(element);

      head = table.find('thead');
      headCells = head.find('th');
      body = table.find('tbody');
      bodyRows = body.find('tr');
      bodyCells = body.find('td');
      bodyFirstCells = bodyCells.filter(':first-child');
      bodyCellTopInners = bodyRows.eq(0).find('div.fc-day-content div');

      markFirstLast(head.add(head.find('tr'))); // marks first+last tr/th's
      markFirstLast(bodyRows); // marks first+last td's
      bodyRows.eq(0).addClass('fc-first'); // fc-last is done in updateCells

      dayBind(bodyCells);

      daySegmentContainer =
              $("<div style='position:absolute;z-index:8;top:0;left:0'/>")
                      .appendTo(element);
    }


    function updateCells(firstTime) {
      var dowDirty = firstTime || rowCnt == 1; // could the cells' day-of-weeks need updating?
      var month = t.start.getMonth();
      var today = clearTime(new Date());
      var cell;
      var date;
      var row;

      if (dowDirty) {
        headCells.each(function(i, _cell) {
          cell = $(_cell);
          date = indexDate(i);
          cell.html(formatDate(date, colFormat));
          setDayID(cell, date);
        });
      }

      bodyCells.each(function(i, _cell) {
        cell = $(_cell);
        date = indexDate(i);
        if (date.getMonth() == month) {
          cell.removeClass('fc-other-month');
        } else {
          cell.addClass('fc-other-month');
        }
        if (+date == +today) {
          cell.addClass(tm + '-state-highlight fc-today');
        } else {
          cell.removeClass(tm + '-state-highlight fc-today');
        }
        cell.find('div.fc-day-number').text(date.getDate());
        if (dowDirty) {
          setDayID(cell, date);
        }
      });

      bodyRows.each(function(i, _row) {
        row = $(_row);
        if (i < rowCnt) {
          row.show();
          if (i == rowCnt - 1) {
            row.addClass('fc-last');
          } else {
            row.removeClass('fc-last');
          }
        } else {
          row.hide();
        }
      });
    }


    function setHeight(height) {
      viewHeight = height;

      var bodyHeight = viewHeight - head.height();
      var rowHeight;
      var rowHeightLast;
      var cell;

      if (opt('weekMode') == 'variable') {
        rowHeight = rowHeightLast = Math.floor(bodyHeight / (rowCnt == 1 ? 2 : 6));
      } else {
        rowHeight = Math.floor(bodyHeight / rowCnt);
        rowHeightLast = bodyHeight - rowHeight * (rowCnt - 1);
      }

      bodyFirstCells.each(function(i, _cell) {
        if (i < rowCnt) {
          cell = $(_cell);
          setMinHeight(
                  cell.find('> div'),
                  (i == rowCnt - 1 ? rowHeightLast : rowHeight) - vsides(cell)
                  );
        }
      });

    }


    function setWidth(width) {
      viewWidth = width;
      colContentPositions.clear();
      colWidth = Math.floor(viewWidth / colCnt);
      setOuterWidth(headCells.slice(0, -1), colWidth);
    }


    /* Day clicking and binding
     -----------------------------------------------------------*/


    function dayBind(days) {
      days.click(dayClick)
              .mousedown(daySelectionMousedown);
    }


    function dayClick(ev) {
      if (!opt('selectable')) { // if selectable, SelectionManager will worry about dayClick
        var index = parseInt(this.className.match(/fc\-day(\d+)/)[1]); // TODO: maybe use .data
        var date = indexDate(index);
        trigger('dayClick', this, date, true, ev);
      }
    }


    /* Semi-transparent Overlay Helpers
     ------------------------------------------------------*/


    function renderDayOverlay(overlayStart, overlayEnd, refreshCoordinateGrid) { // overlayEnd is exclusive
      if (refreshCoordinateGrid) {
        coordinateGrid.build();
      }
      var rowStart = cloneDate(t.visStart);
      var rowEnd = addDays(cloneDate(rowStart), colCnt);
      for (var i = 0; i < rowCnt; i++) {
        var stretchStart = new Date(Math.max(rowStart, overlayStart));
        var stretchEnd = new Date(Math.min(rowEnd, overlayEnd));
        if (stretchStart < stretchEnd) {
          var colStart, colEnd;
          if (rtl) {
            colStart = dayDiff(stretchEnd, rowStart) * dis + dit + 1;
            colEnd = dayDiff(stretchStart, rowStart) * dis + dit + 1;
          } else {
            colStart = dayDiff(stretchStart, rowStart);
            colEnd = dayDiff(stretchEnd, rowStart);
          }
          dayBind(
                  renderCellOverlay(i, colStart, i, colEnd - 1)
                  );
        }
        addDays(rowStart, 7);
        addDays(rowEnd, 7);
      }
    }


    function renderCellOverlay(row0, col0, row1, col1) { // row1,col1 is inclusive
      var rect = coordinateGrid.rect(row0, col0, row1, col1, element);
      return renderOverlay(rect, element);
    }


    /* Selection
     -----------------------------------------------------------------------*/


    function defaultSelectionEnd(startDate, allDay) {
      return cloneDate(startDate);
    }


    function renderSelection(startDate, endDate, allDay) {
      renderDayOverlay(startDate, addDays(cloneDate(endDate), 1), true); // rebuild every time???
    }


    function clearSelection() {
      clearOverlays();
    }


    function reportDayClick(date, allDay, ev) {
      var cell = dateCell(date);
      var _element = bodyCells[cell.row * colCnt + cell.col];
      trigger('dayClick', _element, date, allDay, ev);
    }


    /* External Dragging
     -----------------------------------------------------------------------*/


    function dragStart(_dragElement, ev, ui) {
      hoverListener.start(function(cell) {
        clearOverlays();
        if (cell) {
          renderCellOverlay(cell.row, cell.col, cell.row, cell.col);
        }
      }, ev);
    }


    function dragStop(_dragElement, ev, ui) {
      var cell = hoverListener.stop();
      clearOverlays();
      if (cell) {
        var d = cellDate(cell);
        trigger('drop', _dragElement, d, true, ev, ui);
      }
    }


    /* Utilities
     --------------------------------------------------------*/


    function defaultEventEnd(event) {
      return cloneDate(event.start);
    }


    coordinateGrid = new CoordinateGrid(function(rows, cols) {
      var e, n, p;
      headCells.each(function(i, _e) {
        e = $(_e);
        n = e.offset().left;
        if (i) {
          p[1] = n;
        }
        p = [n];
        cols[i] = p;
      });
      p[1] = n + e.outerWidth();
      bodyRows.each(function(i, _e) {
        if (i < rowCnt) {
          e = $(_e);
          n = e.offset().top;
          if (i) {
            p[1] = n;
          }
          p = [n];
          rows[i] = p;
        }
      });
      p[1] = n + e.outerHeight();
    });


    hoverListener = new HoverListener(coordinateGrid);


    colContentPositions = new HorizontalPositionCache(function(col) {
      return bodyCellTopInners.eq(col);
    });


    function colContentLeft(col) {
      return colContentPositions.left(col);
    }


    function colContentRight(col) {
      return colContentPositions.right(col);
    }


    function dateCell(date) {
      return {
        row: Math.floor(dayDiff(date, t.visStart) / 7),
        col: dayOfWeekCol(date.getDay())
      };
    }


    function cellDate(cell) {
      return _cellDate(cell.row, cell.col);
    }


    function _cellDate(row, col) {
      return addDays(cloneDate(t.visStart), row * 7 + col * dis + dit);
      // what about weekends in middle of week?
    }


    function indexDate(index) {
      return _cellDate(Math.floor(index / colCnt), index % colCnt);
    }


    function dayOfWeekCol(dayOfWeek) {
      return ((dayOfWeek - Math.max(firstDay, nwe) + colCnt) % colCnt) * dis + dit;
    }


    function allDayRow(i) {
      return bodyRows.eq(i);
    }


    function allDayBounds(i) {
      return {
        left: 0,
        right: viewWidth
      };
    }


  }

  function BasicEventRenderer() {
    var t = this;


    // exports
    t.renderEvents = renderEvents;
    t.compileDaySegs = compileSegs; // for DayEventRenderer
    t.clearEvents = clearEvents;
    t.bindDaySeg = bindDaySeg;


    // imports
    DayEventRenderer.call(t);
    var opt = t.opt;
    var trigger = t.trigger;
    //var setOverflowHidden = t.setOverflowHidden;
    var isEventDraggable = t.isEventDraggable;
    var isEventResizable = t.isEventResizable;
    var reportEvents = t.reportEvents;
    var reportEventClear = t.reportEventClear;
    var eventElementHandlers = t.eventElementHandlers;
    var showEvents = t.showEvents;
    var hideEvents = t.hideEvents;
    var eventDrop = t.eventDrop;
    var getDaySegmentContainer = t.getDaySegmentContainer;
    var getHoverListener = t.getHoverListener;
    var renderDayOverlay = t.renderDayOverlay;
    var clearOverlays = t.clearOverlays;
    var getRowCnt = t.getRowCnt;
    var getColCnt = t.getColCnt;
    var renderDaySegs = t.renderDaySegs;
    var resizableDayEvent = t.resizableDayEvent;


    /* Rendering
     --------------------------------------------------------------------*/


    function renderEvents(events, modifiedEventId) {
      reportEvents(events);
      renderDaySegs(compileSegs(events), modifiedEventId);
    }


    function clearEvents() {
      reportEventClear();
      getDaySegmentContainer().empty();
    }


    function compileSegs(events) {
      var rowCnt = getRowCnt(),
              colCnt = getColCnt(),
              d1 = cloneDate(t.visStart),
              d2 = addDays(cloneDate(d1), colCnt),
              visEventsEnds = $.map(events, exclEndDay),
              i, row,
              j, level,
              k, seg,
              segs = [];
      for (i = 0; i < rowCnt; i++) {
        row = stackSegs(sliceSegs(events, visEventsEnds, d1, d2));
        for (j = 0; j < row.length; j++) {
          level = row[j];
          for (k = 0; k < level.length; k++) {
            seg = level[k];
            seg.row = i;
            seg.level = j; // not needed anymore
            segs.push(seg);
          }
        }
        addDays(d1, 7);
        addDays(d2, 7);
      }
      return segs;
    }


    function bindDaySeg(event, eventElement, seg) {
      if (isEventDraggable(event)) {
        draggableDayEvent(event, eventElement);
      }
      if (seg.isEnd && isEventResizable(event)) {
        resizableDayEvent(event, eventElement, seg);
      }
      eventElementHandlers(event, eventElement);
      // needs to be after, because resizableDayEvent might stopImmediatePropagation on click
    }


    /* Dragging
     ----------------------------------------------------------------------------*/


    function draggableDayEvent(event, eventElement) {
      var hoverListener = getHoverListener();
      var dayDelta;
      eventElement.draggable({
        zIndex: 9,
        delay: 50,
        opacity: opt('dragOpacity'),
        revertDuration: opt('dragRevertDuration'),
        start: function(ev, ui) {
          trigger('eventDragStart', eventElement, event, ev, ui);
          hideEvents(event, eventElement);
          hoverListener.start(function(cell, origCell, rowDelta, colDelta) {
            eventElement.draggable('option', 'revert', !cell || !rowDelta && !colDelta);
            clearOverlays();
            if (cell) {
              //setOverflowHidden(true);
              dayDelta = rowDelta * 7 + colDelta * (opt('isRTL') ? -1 : 1);
              renderDayOverlay(
                      addDays(cloneDate(event.start), dayDelta),
                      addDays(exclEndDay(event), dayDelta)
                      );
            } else {
              //setOverflowHidden(false);
              dayDelta = 0;
            }
          }, ev, 'drag');
        },
        stop: function(ev, ui) {
          hoverListener.stop();
          clearOverlays();
          trigger('eventDragStop', eventElement, event, ev, ui);
          if (dayDelta) {
            eventDrop(this, event, dayDelta, 0, event.allDay, ev, ui);
          } else {
            eventElement.css('filter', ''); // clear IE opacity side-effects
            showEvents(event, eventElement);
          }
          //setOverflowHidden(false);
        }
      });
    }


  }

  fcViews.agendaWeek = AgendaWeekView;

  function AgendaWeekView(element, calendar) {
    var t = this;


    // exports
    t.render = render;


    // imports
    AgendaView.call(t, element, calendar, 'agendaWeek');
    var opt = t.opt;
    var renderAgenda = t.renderAgenda;
    var formatDates = calendar.formatDates;


    function render(date, delta) {
      if (delta) {
        addDays(date, delta * 7);
      }
      var start = addDays(cloneDate(date), -((date.getDay() - opt('firstDay') + 7) % 7));
      var end = addDays(cloneDate(start), 7);
      var visStart = cloneDate(start);
      var visEnd = cloneDate(end);
      var weekends = opt('weekends');
      if (!weekends) {
        skipWeekend(visStart);
        skipWeekend(visEnd, -1, true);
      }
      t.title = formatDates(
              visStart,
              addDays(cloneDate(visEnd), -1),
              opt('titleFormat')
              );
      t.start = start;
      t.end = end;
      t.visStart = visStart;
      t.visEnd = visEnd;
      renderAgenda(weekends ? 7 : 5);
    }


  }

  fcViews.agendaDay = AgendaDayView;

  function AgendaDayView(element, calendar) {
    var t = this;


    // exports
    t.render = render;


    // imports
    AgendaView.call(t, element, calendar, 'agendaDay');
    var opt = t.opt;
    var renderAgenda = t.renderAgenda;
    var formatDate = calendar.formatDate;


    function render(date, delta) {
      if (delta) {
        addDays(date, delta);
        if (!opt('weekends')) {
          skipWeekend(date, delta < 0 ? -1 : 1);
        }
      }
      var start = cloneDate(date, true);
      var end = addDays(cloneDate(start), 1);
      t.title = formatDate(date, opt('titleFormat'));
      t.start = t.visStart = start;
      t.end = t.visEnd = end;
      renderAgenda(1);
    }


  }

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


// TODO: make it work in quirks mode (event corners, all-day height)
// TODO: test liquid width, especially in IE6


  function AgendaView(element, calendar, viewName) {
    var t = this;


    // exports
    t.renderAgenda = renderAgenda;
    t.setWidth = setWidth;
    t.setHeight = setHeight;
    t.beforeHide = beforeHide;
    t.afterShow = afterShow;
    t.defaultEventEnd = defaultEventEnd;
    t.timePosition = timePosition;
    t.dayOfWeekCol = dayOfWeekCol;
    t.dateCell = dateCell;
    t.cellDate = cellDate;
    t.cellIsAllDay = cellIsAllDay;
    t.allDayRow = getAllDayRow;
    t.allDayBounds = allDayBounds;
    t.getHoverListener = function() {
      return hoverListener
    };
    t.colContentLeft = colContentLeft;
    t.colContentRight = colContentRight;
    t.getDaySegmentContainer = function() {
      return daySegmentContainer
    };
    t.getSlotSegmentContainer = function() {
      return slotSegmentContainer
    };
    t.getMinMinute = function() {
      return minMinute
    };
    t.getMaxMinute = function() {
      return maxMinute
    };
    t.getBodyContent = function() {
      return slotContent
    }; // !!??
    t.getRowCnt = function() {
      return 1
    };
    t.getColCnt = function() {
      return colCnt
    };
    t.getColWidth = function() {
      return colWidth
    };
    t.getSlotHeight = function() {
      return slotHeight
    };
    t.defaultSelectionEnd = defaultSelectionEnd;
    t.renderDayOverlay = renderDayOverlay;
    t.renderSelection = renderSelection;
    t.clearSelection = clearSelection;
    t.reportDayClick = reportDayClick; // selection mousedown hack
    t.dragStart = dragStart;
    t.dragStop = dragStop;


    // imports
    View.call(t, element, calendar, viewName);
    OverlayManager.call(t);
    SelectionManager.call(t);
    AgendaEventRenderer.call(t);
    var opt = t.opt;
    var trigger = t.trigger;
    var clearEvents = t.clearEvents;
    var renderOverlay = t.renderOverlay;
    var clearOverlays = t.clearOverlays;
    var reportSelection = t.reportSelection;
    var unselect = t.unselect;
    var daySelectionMousedown = t.daySelectionMousedown;
    var slotSegHtml = t.slotSegHtml;
    var formatDate = calendar.formatDate;


    // locals

    var dayTable;
    var dayHead;
    var dayHeadCells;
    var dayBody;
    var dayBodyCells;
    var dayBodyCellInners;
    var dayBodyFirstCell;
    var dayBodyFirstCellStretcher;
    var slotLayer;
    var daySegmentContainer;
    var allDayTable;
    var allDayRow;
    var slotScroller;
    var slotContent;
    var slotSegmentContainer;
    var slotTable;
    var slotTableFirstInner;
    var axisFirstCells;
    var gutterCells;
    var selectionHelper;

    var viewWidth;
    var viewHeight;
    var axisWidth;
    var colWidth;
    var gutterWidth;
    var slotHeight; // TODO: what if slotHeight changes? (see issue 650)
    var savedScrollTop;

    var colCnt;
    var slotCnt;
    var coordinateGrid;
    var hoverListener;
    var colContentPositions;
    var slotTopCache = {};

    var tm;
    var firstDay;
    var nwe;            // no weekends (int)
    var rtl, dis, dit;  // day index sign / translate
    var minMinute, maxMinute;
    var colFormat;


    /* Rendering
     -----------------------------------------------------------------------------*/


    disableTextSelection(element.addClass('fc-agenda'));


    function renderAgenda(c) {
      colCnt = c;
      updateOptions();
      if (!dayTable) {
        buildSkeleton();
      } else {
        clearEvents();
      }
      updateCells();
    }


    function updateOptions() {
      tm = opt('theme') ? 'ui' : 'fc';
      nwe = opt('weekends') ? 0 : 1;
      firstDay = opt('firstDay');
      if (rtl = opt('isRTL')) {
        dis = -1;
        dit = colCnt - 1;
      } else {
        dis = 1;
        dit = 0;
      }
      minMinute = parseTime(opt('minTime'));
      maxMinute = parseTime(opt('maxTime'));
      colFormat = opt('columnFormat');
    }


    function buildSkeleton() {
      var headerClass = tm + "-widget-header";
      var contentClass = tm + "-widget-content";
      var s;
      var i;
      var d;
      var maxd;
      var minutes;
      var slotNormal = opt('slotMinutes') % 15 == 0;

      s =
              "<table style='width:100%' class='fc-agenda-days fc-border-separate' cellspacing='0'>" +
                      "<thead>" +
                      "<tr>" +
                      "<th class='fc-agenda-axis " + headerClass + "'>&nbsp;</th>";
      for (i = 0; i < colCnt; i++) {
        s +=
                "<th class='fc- fc-col" + i + ' ' + headerClass + "'/>"; // fc- needed for setDayID
      }
      s +=
              "<th class='fc-agenda-gutter " + headerClass + "'>&nbsp;</th>" +
                      "</tr>" +
                      "</thead>" +
                      "<tbody>" +
                      "<tr>" +
                      "<th class='fc-agenda-axis " + headerClass + "'>&nbsp;</th>";
      for (i = 0; i < colCnt; i++) {
        s +=
                "<td class='fc- fc-col" + i + ' ' + contentClass + "'>" + // fc- needed for setDayID
                        "<div>" +
                        "<div class='fc-day-content'>" +
                        "<div style='position:relative'>&nbsp;</div>" +
                        "</div>" +
                        "</div>" +
                        "</td>";
      }
      s +=
              "<td class='fc-agenda-gutter " + contentClass + "'>&nbsp;</td>" +
                      "</tr>" +
                      "</tbody>" +
                      "</table>";
      dayTable = $(s).appendTo(element);
      dayHead = dayTable.find('thead');
      dayHeadCells = dayHead.find('th').slice(1, -1);
      dayBody = dayTable.find('tbody');
      dayBodyCells = dayBody.find('td').slice(0, -1);
      dayBodyCellInners = dayBodyCells.find('div.fc-day-content div');
      dayBodyFirstCell = dayBodyCells.eq(0);
      dayBodyFirstCellStretcher = dayBodyFirstCell.find('> div');

      markFirstLast(dayHead.add(dayHead.find('tr')));
      markFirstLast(dayBody.add(dayBody.find('tr')));

      axisFirstCells = dayHead.find('th:first');
      gutterCells = dayTable.find('.fc-agenda-gutter');

      slotLayer =
              $("<div style='position:absolute;z-index:2;left:0;width:100%'/>")
                      .appendTo(element);

      if (opt('allDaySlot')) {

        daySegmentContainer =
                $("<div style='position:absolute;z-index:8;top:0;left:0'/>")
                        .appendTo(slotLayer);

        s =
                "<table style='width:100%' class='fc-agenda-allday' cellspacing='0'>" +
                        "<tr>" +
                        "<th class='" + headerClass + " fc-agenda-axis'>" + opt('allDayText') + "</th>" +
                        "<td>" +
                        "<div class='fc-day-content'><div style='position:relative'/></div>" +
                        "</td>" +
                        "<th class='" + headerClass + " fc-agenda-gutter'>&nbsp;</th>" +
                        "</tr>" +
                        "</table>";
        allDayTable = $(s).appendTo(slotLayer);
        allDayRow = allDayTable.find('tr');

        dayBind(allDayRow.find('td'));

        axisFirstCells = axisFirstCells.add(allDayTable.find('th:first'));
        gutterCells = gutterCells.add(allDayTable.find('th.fc-agenda-gutter'));

        slotLayer.append(
                "<div class='fc-agenda-divider " + headerClass + "'>" +
                        "<div class='fc-agenda-divider-inner'/>" +
                        "</div>"
                );

      } else {

        daySegmentContainer = $([]); // in jQuery 1.4, we can just do $()

      }

      slotScroller =
              $("<div style='position:absolute;width:100%;overflow-x:hidden;overflow-y:auto'/>")
                      .appendTo(slotLayer);

      slotContent =
              $("<div style='position:relative;width:100%;overflow:hidden'/>")
                      .appendTo(slotScroller);

      slotSegmentContainer =
              $("<div style='position:absolute;z-index:8;top:0;left:0'/>")
                      .appendTo(slotContent);

      s =
              "<table class='fc-agenda-slots' style='width:100%' cellspacing='0'>" +
                      "<tbody>";
      d = zeroDate();
      maxd = addMinutes(cloneDate(d), maxMinute);
      addMinutes(d, minMinute);
      slotCnt = 0;
      for (i = 0; d < maxd; i++) {
        minutes = d.getMinutes();
        s +=
                "<tr class='fc-slot" + i + ' ' + (!minutes ? '' : 'fc-minor') + "'>" +
                        "<th class='fc-agenda-axis " + headerClass + "'>" +
                        ((!slotNormal || !minutes) ? formatDate(d, opt('axisFormat')) : '&nbsp;') +
                        "</th>" +
                        "<td class='" + contentClass + "'>" +
                        "<div style='position:relative'>&nbsp;</div>" +
                        "</td>" +
                        "</tr>";
        addMinutes(d, opt('slotMinutes'));
        slotCnt++;
      }
      s +=
              "</tbody>" +
                      "</table>";
      slotTable = $(s).appendTo(slotContent);
      slotTableFirstInner = slotTable.find('div:first');

      slotBind(slotTable.find('td'));

      axisFirstCells = axisFirstCells.add(slotTable.find('th:first'));
    }


    function updateCells() {
      var i;
      var headCell;
      var bodyCell;
      var date;
      var today = clearTime(new Date());
      for (i = 0; i < colCnt; i++) {
        date = colDate(i);
        headCell = dayHeadCells.eq(i);
        headCell.html(formatDate(date, colFormat));
        bodyCell = dayBodyCells.eq(i);
        if (+date == +today) {
          bodyCell.addClass(tm + '-state-highlight fc-today');
        } else {
          bodyCell.removeClass(tm + '-state-highlight fc-today');
        }
        setDayID(headCell.add(bodyCell), date);
      }
    }


    function setHeight(height, dateChanged) {
      if (height === undefined) {
        height = viewHeight;
      }
      viewHeight = height;
      slotTopCache = {};

      var headHeight = dayBody.position().top;
      var allDayHeight = slotScroller.position().top; // including divider
      var bodyHeight = Math.min(// total body height, including borders
              height - headHeight, // when scrollbars
              slotTable.height() + allDayHeight + 1 // when no scrollbars. +1 for bottom border
              );

      dayBodyFirstCellStretcher
              .height(bodyHeight - vsides(dayBodyFirstCell));

      slotLayer.css('top', headHeight);

      slotScroller.height(bodyHeight - allDayHeight - 1);

      slotHeight = slotTableFirstInner.height() + 1; // +1 for border

      if (dateChanged) {
        resetScroll();
      }
    }


    function setWidth(width) {
      viewWidth = width;
      colContentPositions.clear();

      axisWidth = 0;
      setOuterWidth(
              axisFirstCells
                      .width('')
                      .each(function(i, _cell) {
                axisWidth = Math.max(axisWidth, $(_cell).outerWidth());
              }),
              axisWidth
              );

      var slotTableWidth = slotScroller[0].clientWidth; // needs to be done after axisWidth (for IE7)
      //slotTable.width(slotTableWidth);

      gutterWidth = slotScroller.width() - slotTableWidth;
      if (gutterWidth) {
        setOuterWidth(gutterCells, gutterWidth);
        gutterCells
                .show()
                .prev()
                .removeClass('fc-last');
      } else {
        gutterCells
                .hide()
                .prev()
                .addClass('fc-last');
      }

      colWidth = Math.floor((slotTableWidth - axisWidth) / colCnt);
      setOuterWidth(dayHeadCells.slice(0, -1), colWidth);
    }


    function resetScroll() {
      var d0 = zeroDate();
      var scrollDate = cloneDate(d0);
      scrollDate.setHours(opt('firstHour'));
      var top = timePosition(d0, scrollDate) + 1; // +1 for the border
      function scroll() {
        slotScroller.scrollTop(top);
      }

      scroll();
      setTimeout(scroll, 0); // overrides any previous scroll state made by the browser
    }


    function beforeHide() {
      savedScrollTop = slotScroller.scrollTop();
    }


    function afterShow() {
      slotScroller.scrollTop(savedScrollTop);
    }


    /* Slot/Day clicking and binding
     -----------------------------------------------------------------------*/


    function dayBind(cells) {
      cells.click(slotClick)
              .mousedown(daySelectionMousedown);
    }


    function slotBind(cells) {
      cells.click(slotClick)
              .mousedown(slotSelectionMousedown);
    }


    function slotClick(ev) {
      if (!opt('selectable')) { // if selectable, SelectionManager will worry about dayClick
        var col = Math.min(colCnt - 1, Math.floor((ev.pageX - dayTable.offset().left - axisWidth) / colWidth));
        var date = colDate(col);
        var rowMatch = this.parentNode.className.match(/fc-slot(\d+)/); // TODO: maybe use data
        if (rowMatch) {
          var mins = parseInt(rowMatch[1]) * opt('slotMinutes');
          var hours = Math.floor(mins / 60);
          date.setHours(hours);
          date.setMinutes(mins % 60 + minMinute);
          trigger('dayClick', dayBodyCells[col], date, false, ev);
        } else {
          trigger('dayClick', dayBodyCells[col], date, true, ev);
        }
      }
    }


    /* Semi-transparent Overlay Helpers
     -----------------------------------------------------*/


    function renderDayOverlay(startDate, endDate, refreshCoordinateGrid) { // endDate is exclusive
      if (refreshCoordinateGrid) {
        coordinateGrid.build();
      }
      var visStart = cloneDate(t.visStart);
      var startCol, endCol;
      if (rtl) {
        startCol = dayDiff(endDate, visStart) * dis + dit + 1;
        endCol = dayDiff(startDate, visStart) * dis + dit + 1;
      } else {
        startCol = dayDiff(startDate, visStart);
        endCol = dayDiff(endDate, visStart);
      }
      startCol = Math.max(0, startCol);
      endCol = Math.min(colCnt, endCol);
      if (startCol < endCol) {
        dayBind(
                renderCellOverlay(0, startCol, 0, endCol - 1)
                );
      }
    }


    function renderCellOverlay(row0, col0, row1, col1) { // only for all-day?
      var rect = coordinateGrid.rect(row0, col0, row1, col1, slotLayer);
      return renderOverlay(rect, slotLayer);
    }


    function renderSlotOverlay(overlayStart, overlayEnd) {
      var dayStart = cloneDate(t.visStart);
      var dayEnd = addDays(cloneDate(dayStart), 1);
      for (var i = 0; i < colCnt; i++) {
        var stretchStart = new Date(Math.max(dayStart, overlayStart));
        var stretchEnd = new Date(Math.min(dayEnd, overlayEnd));
        if (stretchStart < stretchEnd) {
          var col = i * dis + dit;
          var rect = coordinateGrid.rect(0, col, 0, col, slotContent); // only use it for horizontal coords
          var top = timePosition(dayStart, stretchStart);
          var bottom = timePosition(dayStart, stretchEnd);
          rect.top = top;
          rect.height = bottom - top;
          slotBind(
                  renderOverlay(rect, slotContent)
                  );
        }
        addDays(dayStart, 1);
        addDays(dayEnd, 1);
      }
    }


    /* Coordinate Utilities
     -----------------------------------------------------------------------------*/


    coordinateGrid = new CoordinateGrid(function(rows, cols) {
      var e, n, p;
      dayHeadCells.each(function(i, _e) {
        e = $(_e);
        n = e.offset().left;
        if (i) {
          p[1] = n;
        }
        p = [n];
        cols[i] = p;
      });
      p[1] = n + e.outerWidth();
      if (opt('allDaySlot')) {
        e = allDayRow;
        n = e.offset().top;
        rows[0] = [n, n + e.outerHeight()];
      }
      var slotTableTop = slotContent.offset().top;
      var slotScrollerTop = slotScroller.offset().top;
      var slotScrollerBottom = slotScrollerTop + slotScroller.outerHeight();

      function constrain(n) {
        return Math.max(slotScrollerTop, Math.min(slotScrollerBottom, n));
      }

      for (var i = 0; i < slotCnt; i++) {
        rows.push([
          constrain(slotTableTop + slotHeight * i),
          constrain(slotTableTop + slotHeight * (i + 1))
        ]);
      }
    });


    hoverListener = new HoverListener(coordinateGrid);


    colContentPositions = new HorizontalPositionCache(function(col) {
      return dayBodyCellInners.eq(col);
    });


    function colContentLeft(col) {
      return colContentPositions.left(col);
    }


    function colContentRight(col) {
      return colContentPositions.right(col);
    }


    function dateCell(date) { // "cell" terminology is now confusing
      return {
        row: Math.floor(dayDiff(date, t.visStart) / 7),
        col: dayOfWeekCol(date.getDay())
      };
    }


    function cellDate(cell) {
      var d = colDate(cell.col);
      var slotIndex = cell.row;
      if (opt('allDaySlot')) {
        slotIndex--;
      }
      if (slotIndex >= 0) {
        addMinutes(d, minMinute + slotIndex * opt('slotMinutes'));
      }
      return d;
    }


    function colDate(col) { // returns dates with 00:00:00
      return addDays(cloneDate(t.visStart), col * dis + dit);
    }


    function cellIsAllDay(cell) {
      return opt('allDaySlot') && !cell.row;
    }


    function dayOfWeekCol(dayOfWeek) {
      return ((dayOfWeek - Math.max(firstDay, nwe) + colCnt) % colCnt) * dis + dit;
    }


    // get the Y coordinate of the given time on the given day (both Date objects)
    function timePosition(day, time) { // both date objects. day holds 00:00 of current day
      day = cloneDate(day, true);
      if (time < addMinutes(cloneDate(day), minMinute)) {
        return 0;
      }
      if (time >= addMinutes(cloneDate(day), maxMinute)) {
        return slotTable.height();
      }
      var slotMinutes = opt('slotMinutes'),
              minutes = time.getHours() * 60 + time.getMinutes() - minMinute,
              slotI = Math.floor(minutes / slotMinutes),
              slotTop = slotTopCache[slotI];
      if (slotTop === undefined) {
        slotTop = slotTopCache[slotI] = slotTable.find('tr:eq(' + slotI + ') td div')[0].offsetTop; //.position().top; // need this optimization???
      }
      return Math.max(0, Math.round(
              slotTop - 1 + slotHeight * ((minutes % slotMinutes) / slotMinutes)
              ));
    }


    function allDayBounds() {
      return {
        left: axisWidth,
        right: viewWidth - gutterWidth
      }
    }


    function getAllDayRow(index) {
      return allDayRow;
    }


    function defaultEventEnd(event) {
      var start = cloneDate(event.start);
      if (event.allDay) {
        return start;
      }
      return addMinutes(start, opt('defaultEventMinutes'));
    }


    /* Selection
     ---------------------------------------------------------------------------------*/


    function defaultSelectionEnd(startDate, allDay) {
      if (allDay) {
        return cloneDate(startDate);
      }
      return addMinutes(cloneDate(startDate), opt('slotMinutes'));
    }


    function renderSelection(startDate, endDate, allDay) { // only for all-day
      if (allDay) {
        if (opt('allDaySlot')) {
          renderDayOverlay(startDate, addDays(cloneDate(endDate), 1), true);
        }
      } else {
        renderSlotSelection(startDate, endDate);
      }
    }


    function renderSlotSelection(startDate, endDate) {
      var helperOption = opt('selectHelper');
      coordinateGrid.build();
      if (helperOption) {
        var col = dayDiff(startDate, t.visStart) * dis + dit;
        if (col >= 0 && col < colCnt) { // only works when times are on same day
          var rect = coordinateGrid.rect(0, col, 0, col, slotContent); // only for horizontal coords
          var top = timePosition(startDate, startDate);
          var bottom = timePosition(startDate, endDate);
          if (bottom > top) { // protect against selections that are entirely before or after visible range
            rect.top = top;
            rect.height = bottom - top;
            rect.left += 2;
            rect.width -= 5;
            if ($.isFunction(helperOption)) {
              var helperRes = helperOption(startDate, endDate);
              if (helperRes) {
                rect.position = 'absolute';
                rect.zIndex = 8;
                selectionHelper = $(helperRes)
                        .css(rect)
                        .appendTo(slotContent);
              }
            } else {
              rect.isStart = true; // conside rect a "seg" now
              rect.isEnd = true;   //
              selectionHelper = $(slotSegHtml(
              {
                title: '',
                start: startDate,
                end: endDate,
                className: ['fc-select-helper'],
                editable: false
              },
                      rect
                      ));
              selectionHelper.css('opacity', opt('dragOpacity'));
            }
            if (selectionHelper) {
              slotBind(selectionHelper);
              slotContent.append(selectionHelper);
              setOuterWidth(selectionHelper, rect.width, true); // needs to be after appended
              setOuterHeight(selectionHelper, rect.height, true);
            }
          }
        }
      } else {
        renderSlotOverlay(startDate, endDate);
      }
    }


    function clearSelection() {
      clearOverlays();
      if (selectionHelper) {
        selectionHelper.remove();
        selectionHelper = null;
      }
    }


    function slotSelectionMousedown(ev) {
      if (ev.which == 1 && opt('selectable')) { // ev.which==1 means left mouse button
        unselect(ev);
        var dates;
        hoverListener.start(function(cell, origCell) {
          clearSelection();
          if (cell && cell.col == origCell.col && !cellIsAllDay(cell)) {
            var d1 = cellDate(origCell);
            var d2 = cellDate(cell);
            dates = [
              d1,
              addMinutes(cloneDate(d1), opt('slotMinutes')),
              d2,
              addMinutes(cloneDate(d2), opt('slotMinutes'))
            ].sort(cmp);
            renderSlotSelection(dates[0], dates[3]);
          } else {
            dates = null;
          }
        }, ev);
        $(document).one('mouseup', function(ev) {
          hoverListener.stop();
          if (dates) {
            if (+dates[0] == +dates[1]) {
              reportDayClick(dates[0], false, ev);
            }
            reportSelection(dates[0], dates[3], false, ev);
          }
        });
      }
    }


    function reportDayClick(date, allDay, ev) {
      trigger('dayClick', dayBodyCells[dayOfWeekCol(date.getDay())], date, allDay, ev);
    }


    /* External Dragging
     --------------------------------------------------------------------------------*/


    function dragStart(_dragElement, ev, ui) {
      hoverListener.start(function(cell) {
        clearOverlays();
        if (cell) {
          if (cellIsAllDay(cell)) {
            renderCellOverlay(cell.row, cell.col, cell.row, cell.col);
          } else {
            var d1 = cellDate(cell);
            var d2 = addMinutes(cloneDate(d1), opt('defaultEventMinutes'));
            renderSlotOverlay(d1, d2);
          }
        }
      }, ev);
    }


    function dragStop(_dragElement, ev, ui) {
      var cell = hoverListener.stop();
      clearOverlays();
      if (cell) {
        trigger('drop', _dragElement, cellDate(cell), cellIsAllDay(cell), ev, ui);
      }
    }


  }

  function AgendaEventRenderer() {
    var t = this;


    // exports
    t.renderEvents = renderEvents;
    t.compileDaySegs = compileDaySegs; // for DayEventRenderer
    t.clearEvents = clearEvents;
    t.slotSegHtml = slotSegHtml;
    t.bindDaySeg = bindDaySeg;


    // imports
    DayEventRenderer.call(t);
    var opt = t.opt;
    var trigger = t.trigger;
    //var setOverflowHidden = t.setOverflowHidden;
    var isEventDraggable = t.isEventDraggable;
    var isEventResizable = t.isEventResizable;
    var eventEnd = t.eventEnd;
    var reportEvents = t.reportEvents;
    var reportEventClear = t.reportEventClear;
    var eventElementHandlers = t.eventElementHandlers;
    var setHeight = t.setHeight;
    var getDaySegmentContainer = t.getDaySegmentContainer;
    var getSlotSegmentContainer = t.getSlotSegmentContainer;
    var getHoverListener = t.getHoverListener;
    var getMaxMinute = t.getMaxMinute;
    var getMinMinute = t.getMinMinute;
    var timePosition = t.timePosition;
    var colContentLeft = t.colContentLeft;
    var colContentRight = t.colContentRight;
    var renderDaySegs = t.renderDaySegs;
    var resizableDayEvent = t.resizableDayEvent; // TODO: streamline binding architecture
    var getColCnt = t.getColCnt;
    var getColWidth = t.getColWidth;
    var getSlotHeight = t.getSlotHeight;
    var getBodyContent = t.getBodyContent;
    var reportEventElement = t.reportEventElement;
    var showEvents = t.showEvents;
    var hideEvents = t.hideEvents;
    var eventDrop = t.eventDrop;
    var eventResize = t.eventResize;
    var renderDayOverlay = t.renderDayOverlay;
    var clearOverlays = t.clearOverlays;
    var calendar = t.calendar;
    var formatDate = calendar.formatDate;
    var formatDates = calendar.formatDates;


    /* Rendering
     ----------------------------------------------------------------------------*/


    function renderEvents(events, modifiedEventId) {
      reportEvents(events);
      var i, len = events.length,
              dayEvents = [],
              slotEvents = [];
      for (i = 0; i < len; i++) {
        if (events[i].allDay) {
          dayEvents.push(events[i]);
        } else {
          slotEvents.push(events[i]);
        }
      }
      if (opt('allDaySlot')) {
        renderDaySegs(compileDaySegs(dayEvents), modifiedEventId);
        setHeight(); // no params means set to viewHeight
      }
      renderSlotSegs(compileSlotSegs(slotEvents), modifiedEventId);
    }


    function clearEvents() {
      reportEventClear();
      getDaySegmentContainer().empty();
      getSlotSegmentContainer().empty();
    }


    function compileDaySegs(events) {
      var levels = stackSegs(sliceSegs(events, $.map(events, exclEndDay), t.visStart, t.visEnd)),
              i, levelCnt = levels.length, level,
              j, seg,
              segs = [];
      for (i = 0; i < levelCnt; i++) {
        level = levels[i];
        for (j = 0; j < level.length; j++) {
          seg = level[j];
          seg.row = 0;
          seg.level = i; // not needed anymore
          segs.push(seg);
        }
      }
      return segs;
    }


    function compileSlotSegs(events) {
      var colCnt = getColCnt(),
              minMinute = getMinMinute(),
              maxMinute = getMaxMinute(),
              d = addMinutes(cloneDate(t.visStart), minMinute),
              visEventEnds = $.map(events, slotEventEnd),
              i, col,
              j, level,
              k, seg,
              segs = [];
      for (i = 0; i < colCnt; i++) {
        col = stackSegs(sliceSegs(events, visEventEnds, d, addMinutes(cloneDate(d), maxMinute - minMinute)));
        countForwardSegs(col);
        for (j = 0; j < col.length; j++) {
          level = col[j];
          for (k = 0; k < level.length; k++) {
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


    function slotEventEnd(event) {
      if (event.end) {
        return cloneDate(event.end);
      } else {
        return addMinutes(cloneDate(event.start), opt('defaultEventMinutes'));
      }
    }


    // renders events in the 'time slots' at the bottom

    function renderSlotSegs(segs, modifiedEventId) {

      var i, segCnt = segs.length, seg,
              event,
              classes,
              top, bottom,
              colI, levelI, forward,
              leftmost,
              availWidth,
              outerWidth,
              left,
              html = '',
              eventElements,
              eventElement,
              triggerRes,
              vsideCache = {},
              hsideCache = {},
              key, val,
              contentElement,
              height,
              slotSegmentContainer = getSlotSegmentContainer(),
              rtl, dis, dit,
              colCnt = getColCnt();

      if (rtl = opt('isRTL')) {
        dis = -1;
        dit = colCnt - 1;
      } else {
        dis = 1;
        dit = 0;
      }

      // calculate position/dimensions, create html
      for (i = 0; i < segCnt; i++) {
        seg = segs[i];
        event = seg.event;
        top = timePosition(seg.start, seg.start);
        bottom = timePosition(seg.start, seg.end);
        colI = seg.col;
        levelI = seg.level;
        forward = seg.forward || 0;
        leftmost = colContentLeft(colI * dis + dit);
        availWidth = colContentRight(colI * dis + dit) - leftmost;
        availWidth = Math.min(availWidth - 6, availWidth * .95); // TODO: move this to CSS
        if (levelI) {
          // indented and thin
          outerWidth = availWidth / (levelI + forward + 1);
        } else {
          if (forward) {
            // moderately wide, aligned left still
            outerWidth = ((availWidth / (forward + 1)) - (12 / 2)) * 2; // 12 is the predicted width of resizer =
          } else {
            // can be entire width, aligned left
            outerWidth = availWidth;
          }
        }
        left = leftmost + // leftmost possible
                (availWidth / (levelI + forward + 1) * levelI) // indentation
                        * dis + (rtl ? availWidth - outerWidth : 0);   // rtl
        seg.top = top;
        seg.left = left;
        seg.outerWidth = outerWidth;
        seg.outerHeight = bottom - top;
        html += slotSegHtml(event, seg);
      }
      slotSegmentContainer[0].innerHTML = html; // faster than html()
      eventElements = slotSegmentContainer.children();

      // retrieve elements, run through eventRender callback, bind event handlers
      for (i = 0; i < segCnt; i++) {
        seg = segs[i];
        event = seg.event;
        eventElement = $(eventElements[i]); // faster than eq()
        triggerRes = trigger('eventRender', event, event, eventElement);
        if (triggerRes === false) {
          eventElement.remove();
        } else {
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
            bindSlotSeg(event, eventElement, seg);
          } else {
            eventElement[0]._fci = i; // for lazySegBind
          }
          reportEventElement(event, eventElement);
        }
      }

      lazySegBind(slotSegmentContainer, segs, bindSlotSeg);

      // record event sides and title positions
      for (i = 0; i < segCnt; i++) {
        seg = segs[i];
        if (eventElement = seg.element) {
          val = vsideCache[key = seg.key = cssKey(eventElement[0])];
          seg.vsides = val === undefined ? (vsideCache[key] = vsides(eventElement, true)) : val;
          val = hsideCache[key];
          seg.hsides = val === undefined ? (hsideCache[key] = hsides(eventElement, true)) : val;
          contentElement = eventElement.find('div.fc-event-content');
          if (contentElement.length) {
            seg.contentTop = contentElement[0].offsetTop;
          }
        }
      }

      // set all positions/dimensions at once
      for (i = 0; i < segCnt; i++) {
        seg = segs[i];
        if (eventElement = seg.element) {
          eventElement[0].style.width = Math.max(0, seg.outerWidth - seg.hsides) + 'px';
          height = Math.max(0, seg.outerHeight - seg.vsides);
          eventElement[0].style.height = height + 'px';
          event = seg.event;
          if (seg.contentTop !== undefined && height - seg.contentTop < 10) {
            // not enough room for title, put it in the time header
            eventElement.find('div.fc-event-time')
                    .text(formatDate(event.start, opt('timeFormat')) + ' - ' + event.title);
            eventElement.find('div.fc-event-title')
                    .remove();
          }
          trigger('eventAfterRender', event, event, eventElement);
        }
      }

    }


    function slotSegHtml(event, seg) {
      var html = "<";
      var url = event.url;
      var skinCss = getSkinCss(event, opt);
      var skinCssAttr = (skinCss ? " style='" + skinCss + "'" : '');
      var classes = ['fc-event', 'fc-event-skin', 'fc-event-vert'];
      if (isEventDraggable(event)) {
        classes.push('fc-event-draggable');
      }
      if (seg.isStart) {
        classes.push('fc-corner-top');
      }
      if (seg.isEnd) {
        classes.push('fc-corner-bottom');
      }
      classes = classes.concat(event.className);
      if (event.source) {
        classes = classes.concat(event.source.className || []);
      }
      if (url) {
        html += "a href='" + htmlEscape(event.url) + "'";
      } else {
        html += "div";
      }
      html +=
              " class='" + classes.join(' ') + "'" +
                      " style='position:absolute;z-index:8;top:" + seg.top + "px;left:" + seg.left + "px;" + skinCss + "'" +
                      ">" +
                      "<div class='fc-event-inner fc-event-skin'" + skinCssAttr + ">" +
                      "<div class='fc-event-head fc-event-skin'" + skinCssAttr + ">" +
                      "<div class='fc-event-time'>" +
                      htmlEscape(formatDates(event.start, event.end, opt('timeFormat'))) +
                      "</div>" +
                      "</div>" +
                      "<div class='fc-event-content'>" +
                      "<div class='fc-event-title'>" +
                      htmlEscape(event.title) +
                      "</div>" +
                      "</div>" +
                      "<div class='fc-event-bg'></div>" +
                      "</div>"; // close inner
      if (seg.isEnd && isEventResizable(event)) {
        html +=
                "<div class='ui-resizable-handle ui-resizable-s'>=</div>";
      }
      html +=
              "</" + (url ? "a" : "div") + ">";
      return html;
    }


    function bindDaySeg(event, eventElement, seg) {
      if (isEventDraggable(event)) {
        draggableDayEvent(event, eventElement, seg.isStart);
      }
      if (seg.isEnd && isEventResizable(event)) {
        resizableDayEvent(event, eventElement, seg);
      }
      eventElementHandlers(event, eventElement);
      // needs to be after, because resizableDayEvent might stopImmediatePropagation on click
    }


    function bindSlotSeg(event, eventElement, seg) {
      var timeElement = eventElement.find('div.fc-event-time');
      if (isEventDraggable(event)) {
        draggableSlotEvent(event, eventElement, timeElement);
      }
      if (seg.isEnd && isEventResizable(event)) {
        resizableSlotEvent(event, eventElement, timeElement);
      }
      eventElementHandlers(event, eventElement);
    }


    /* Dragging
     -----------------------------------------------------------------------------------*/


    // when event starts out FULL-DAY

    function draggableDayEvent(event, eventElement, isStart) {
      var origWidth;
      var revert;
      var allDay = true;
      var dayDelta;
      var dis = opt('isRTL') ? -1 : 1;
      var hoverListener = getHoverListener();
      var colWidth = getColWidth();
      var slotHeight = getSlotHeight();
      var minMinute = getMinMinute();
      eventElement.draggable({
        zIndex: 9,
        opacity: opt('dragOpacity', 'month'), // use whatever the month view was using
        revertDuration: opt('dragRevertDuration'),
        start: function(ev, ui) {
          trigger('eventDragStart', eventElement, event, ev, ui);
          hideEvents(event, eventElement);
          origWidth = eventElement.width();
          hoverListener.start(function(cell, origCell, rowDelta, colDelta) {
            clearOverlays();
            if (cell) {
              //setOverflowHidden(true);
              revert = false;
              dayDelta = colDelta * dis;
              if (!cell.row) {
                // on full-days
                renderDayOverlay(
                        addDays(cloneDate(event.start), dayDelta),
                        addDays(exclEndDay(event), dayDelta)
                        );
                resetElement();
              } else {
                // mouse is over bottom slots
                if (isStart) {
                  if (allDay) {
                    // convert event to temporary slot-event
                    eventElement.width(colWidth - 10); // don't use entire width
                    setOuterHeight(
                            eventElement,
                            slotHeight * Math.round(
                                    (event.end ? ((event.end - event.start) / MINUTE_MS) : opt('defaultEventMinutes'))
                                            / opt('slotMinutes')
                                    )
                            );
                    eventElement.draggable('option', 'grid', [colWidth, 1]);
                    allDay = false;
                  }
                } else {
                  revert = true;
                }
              }
              revert = revert || (allDay && !dayDelta);
            } else {
              resetElement();
              //setOverflowHidden(false);
              revert = true;
            }
            eventElement.draggable('option', 'revert', revert);
          }, ev, 'drag');
        },
        stop: function(ev, ui) {
          hoverListener.stop();
          clearOverlays();
          trigger('eventDragStop', eventElement, event, ev, ui);
          if (revert) {
            // hasn't moved or is out of bounds (draggable has already reverted)
            resetElement();
            eventElement.css('filter', ''); // clear IE opacity side-effects
            showEvents(event, eventElement);
          } else {
            // changed!
            var minuteDelta = 0;
            if (!allDay) {
              minuteDelta = Math.round((eventElement.offset().top - getBodyContent().offset().top) / slotHeight)
                      * opt('slotMinutes')
                      + minMinute
                      - (event.start.getHours() * 60 + event.start.getMinutes());
            }
            eventDrop(this, event, dayDelta, minuteDelta, allDay, ev, ui);
          }
          //setOverflowHidden(false);
        }
      });
      function resetElement() {
        if (!allDay) {
          eventElement
                  .width(origWidth)
                  .height('')
                  .draggable('option', 'grid', null);
          allDay = true;
        }
      }
    }


    // when event starts out IN TIMESLOTS

    function draggableSlotEvent(event, eventElement, timeElement) {
      var origPosition;
      var allDay = false;
      var dayDelta;
      var minuteDelta;
      var prevMinuteDelta;
      var dis = opt('isRTL') ? -1 : 1;
      var hoverListener = getHoverListener();
      var colCnt = getColCnt();
      var colWidth = getColWidth();
      var slotHeight = getSlotHeight();
      eventElement.draggable({
        zIndex: 9,
        scroll: false,
        grid: [colWidth, slotHeight],
        axis: colCnt == 1 ? 'y' : false,
        opacity: opt('dragOpacity'),
        revertDuration: opt('dragRevertDuration'),
        start: function(ev, ui) {
          trigger('eventDragStart', eventElement, event, ev, ui);
          hideEvents(event, eventElement);
          origPosition = eventElement.position();
          minuteDelta = prevMinuteDelta = 0;
          hoverListener.start(function(cell, origCell, rowDelta, colDelta) {
            eventElement.draggable('option', 'revert', !cell);
            clearOverlays();
            if (cell) {
              dayDelta = colDelta * dis;
              if (opt('allDaySlot') && !cell.row) {
                // over full days
                if (!allDay) {
                  // convert to temporary all-day event
                  allDay = true;
                  timeElement.hide();
                  eventElement.draggable('option', 'grid', null);
                }
                renderDayOverlay(
                        addDays(cloneDate(event.start), dayDelta),
                        addDays(exclEndDay(event), dayDelta)
                        );
              } else {
                // on slots
                resetElement();
              }
            }
          }, ev, 'drag');
        },
        drag: function(ev, ui) {
          minuteDelta = Math.round((ui.position.top - origPosition.top) / slotHeight) * opt('slotMinutes');
          if (minuteDelta != prevMinuteDelta) {
            if (!allDay) {
              updateTimeText(minuteDelta);
            }
            prevMinuteDelta = minuteDelta;
          }
        },
        stop: function(ev, ui) {
          var cell = hoverListener.stop();
          clearOverlays();
          trigger('eventDragStop', eventElement, event, ev, ui);
          if (cell && (dayDelta || minuteDelta || allDay)) {
            // changed!
            eventDrop(this, event, dayDelta, allDay ? 0 : minuteDelta, allDay, ev, ui);
          } else {
            // either no change or out-of-bounds (draggable has already reverted)
            resetElement();
            eventElement.css('filter', ''); // clear IE opacity side-effects
            eventElement.css(origPosition); // sometimes fast drags make event revert to wrong position
            updateTimeText(0);
            showEvents(event, eventElement);
          }
        }
      });
      function updateTimeText(minuteDelta) {
        var newStart = addMinutes(cloneDate(event.start), minuteDelta);
        var newEnd;
        if (event.end) {
          newEnd = addMinutes(cloneDate(event.end), minuteDelta);
        }
        timeElement.text(formatDates(newStart, newEnd, opt('timeFormat')));
      }

      function resetElement() {
        // convert back to original slot-event
        if (allDay) {
          timeElement.css('display', ''); // show() was causing display=inline
          eventElement.draggable('option', 'grid', [colWidth, slotHeight]);
          allDay = false;
        }
      }
    }


    /* Resizing
     --------------------------------------------------------------------------------------*/


    function resizableSlotEvent(event, eventElement, timeElement) {
      var slotDelta, prevSlotDelta;
      var slotHeight = getSlotHeight();
      eventElement.resizable({
        handles: {
          s: 'div.ui-resizable-s'
        },
        grid: slotHeight,
        start: function(ev, ui) {
          slotDelta = prevSlotDelta = 0;
          hideEvents(event, eventElement);
          eventElement.css('z-index', 9);
          trigger('eventResizeStart', this, event, ev, ui);
        },
        resize: function(ev, ui) {
          // don't rely on ui.size.height, doesn't take grid into account
          slotDelta = Math.round((Math.max(slotHeight, eventElement.height()) - ui.originalSize.height) / slotHeight);
          if (slotDelta != prevSlotDelta) {
            timeElement.text(
                    formatDates(
                            event.start,
                            (!slotDelta && !event.end) ? null : // no change, so don't display time range
                                    addMinutes(eventEnd(event), opt('slotMinutes') * slotDelta),
                            opt('timeFormat')
                            )
                    );
            prevSlotDelta = slotDelta;
          }
        },
        stop: function(ev, ui) {
          trigger('eventResizeStop', this, event, ev, ui);
          if (slotDelta) {
            eventResize(this, event, 0, opt('slotMinutes') * slotDelta, ev, ui);
          } else {
            eventElement.css('z-index', 8);
            showEvents(event, eventElement);
            // BUG: if event was really short, need to put title back in span
          }
        }
      });
    }


  }


  function countForwardSegs(levels) {
    var i, j, k, level, segForward, segBack;
    for (i = levels.length - 1; i > 0; i--) {
      level = levels[i];
      for (j = 0; j < level.length; j++) {
        segForward = level[j];
        for (k = 0; k < levels[i - 1].length; k++) {
          segBack = levels[i - 1][k];
          if (segsCollide(segForward, segBack)) {
            segBack.forward = Math.max(segBack.forward || 0, (segForward.forward || 0) + 1);
          }
        }
      }
    }
  }


  function View(element, calendar, viewName) {
    var t = this;


    // exports
    t.element = element;
    t.calendar = calendar;
    t.name = viewName;
    t.opt = opt;
    t.trigger = trigger;
    //t.setOverflowHidden = setOverflowHidden;
    t.isEventDraggable = isEventDraggable;
    t.isEventResizable = isEventResizable;
    t.reportEvents = reportEvents;
    t.eventEnd = eventEnd;
    t.reportEventElement = reportEventElement;
    t.reportEventClear = reportEventClear;
    t.eventElementHandlers = eventElementHandlers;
    t.showEvents = showEvents;
    t.hideEvents = hideEvents;
    t.eventDrop = eventDrop;
    t.eventResize = eventResize;
    // t.title
    // t.start, t.end
    // t.visStart, t.visEnd


    // imports
    var defaultEventEnd = t.defaultEventEnd;
    var normalizeEvent = calendar.normalizeEvent; // in EventManager
    var reportEventChange = calendar.reportEventChange;


    // locals
    var eventsByID = {};
    var eventElements = [];
    var eventElementsByID = {};
    var options = calendar.options;


    function opt(name, viewNameOverride) {
      var v = options[name];
      if (typeof v == 'object') {
        return smartProperty(v, viewNameOverride || viewName);
      }
      return v;
    }


    function trigger(name, thisObj) {
      return calendar.trigger.apply(
              calendar,
              [name, thisObj || t].concat(Array.prototype.slice.call(arguments, 2), [t])
              );
    }


    /*
     function setOverflowHidden(bool) {
     element.css('overflow', bool ? 'hidden' : '');
     }
     */


    function isEventDraggable(event) {
      return isEventEditable(event) && !opt('disableDragging');
    }


    function isEventResizable(event) { // but also need to make sure the seg.isEnd == true
      return isEventEditable(event) && !opt('disableResizing');
    }


    function isEventEditable(event) {
      return firstDefined(event.editable, (event.source || {}).editable, opt('editable'));
    }


    /* Event Data
     ------------------------------------------------------------------------------*/


    // report when view receives new events
    function reportEvents(events) { // events are already normalized at this point
      eventsByID = {};
      var i, len = events.length, event;
      for (i = 0; i < len; i++) {
        event = events[i];
        if (eventsByID[event._id]) {
          eventsByID[event._id].push(event);
        } else {
          eventsByID[event._id] = [event];
        }
      }
    }


    // returns a Date object for an event's end
    function eventEnd(event) {
      return event.end ? cloneDate(event.end) : defaultEventEnd(event);
    }


    /* Event Elements
     ------------------------------------------------------------------------------*/


    // report when view creates an element for an event
    function reportEventElement(event, element) {
      eventElements.push(element);
      if (eventElementsByID[event._id]) {
        eventElementsByID[event._id].push(element);
      } else {
        eventElementsByID[event._id] = [element];
      }
    }


    function reportEventClear() {
      eventElements = [];
      eventElementsByID = {};
    }


    // attaches eventClick, eventMouseover, eventMouseout
    function eventElementHandlers(event, eventElement) {
      eventElement
              .click(function(ev) {
        if (!eventElement.hasClass('ui-draggable-dragging') &&
                !eventElement.hasClass('ui-resizable-resizing')) {
          return trigger('eventClick', this, event, ev);
        }
      })
              .hover(
              function(ev) {
                trigger('eventMouseover', this, event, ev);
              },
              function(ev) {
                trigger('eventMouseout', this, event, ev);
              }
              );
      // TODO: don't fire eventMouseover/eventMouseout *while* dragging is occuring (on subject element)
      // TODO: same for resizing
    }


    function showEvents(event, exceptElement) {
      eachEventElement(event, exceptElement, 'show');
    }


    function hideEvents(event, exceptElement) {
      eachEventElement(event, exceptElement, 'hide');
    }


    function eachEventElement(event, exceptElement, funcName) {
      var elements = eventElementsByID[event._id],
              i, len = elements.length;
      for (i = 0; i < len; i++) {
        if (!exceptElement || elements[i][0] != exceptElement[0]) {
          elements[i][funcName]();
        }
      }
    }


    /* Event Modification Reporting
     ---------------------------------------------------------------------------------*/


    function eventDrop(e, event, dayDelta, minuteDelta, allDay, ev, ui) {
      var oldAllDay = event.allDay;
      var eventId = event._id;
      moveEvents(eventsByID[eventId], dayDelta, minuteDelta, allDay);
      trigger(
              'eventDrop',
              e,
              event,
              dayDelta,
              minuteDelta,
              allDay,
              function() {
                // TODO: investigate cases where this inverse technique might not work
                moveEvents(eventsByID[eventId], -dayDelta, -minuteDelta, oldAllDay);
                reportEventChange(eventId);
              },
              ev,
              ui
              );
      reportEventChange(eventId);
    }


    function eventResize(e, event, dayDelta, minuteDelta, ev, ui) {
      var eventId = event._id;
      elongateEvents(eventsByID[eventId], dayDelta, minuteDelta);
      trigger(
              'eventResize',
              e,
              event,
              dayDelta,
              minuteDelta,
              function() {
                // TODO: investigate cases where this inverse technique might not work
                elongateEvents(eventsByID[eventId], -dayDelta, -minuteDelta);
                reportEventChange(eventId);
              },
              ev,
              ui
              );
      reportEventChange(eventId);
    }


    /* Event Modification Math
     ---------------------------------------------------------------------------------*/


    function moveEvents(events, dayDelta, minuteDelta, allDay) {
      minuteDelta = minuteDelta || 0;
      for (var e, len = events.length, i = 0; i < len; i++) {
        e = events[i];
        if (allDay !== undefined) {
          e.allDay = allDay;
        }
        addMinutes(addDays(e.start, dayDelta, true), minuteDelta);
        if (e.end) {
          e.end = addMinutes(addDays(e.end, dayDelta, true), minuteDelta);
        }
        normalizeEvent(e, options);
      }
    }


    function elongateEvents(events, dayDelta, minuteDelta) {
      minuteDelta = minuteDelta || 0;
      for (var e, len = events.length, i = 0; i < len; i++) {
        e = events[i];
        e.end = addMinutes(addDays(eventEnd(e), dayDelta, true), minuteDelta);
        normalizeEvent(e, options);
      }
    }


  }

  function DayEventRenderer() {
    var t = this;


    // exports
    t.renderDaySegs = renderDaySegs;
    t.resizableDayEvent = resizableDayEvent;


    // imports
    var opt = t.opt;
    var trigger = t.trigger;
    var isEventDraggable = t.isEventDraggable;
    var isEventResizable = t.isEventResizable;
    var eventEnd = t.eventEnd;
    var reportEventElement = t.reportEventElement;
    var showEvents = t.showEvents;
    var hideEvents = t.hideEvents;
    var eventResize = t.eventResize;
    var getRowCnt = t.getRowCnt;
    var getColCnt = t.getColCnt;
    var getColWidth = t.getColWidth;
    var allDayRow = t.allDayRow;
    var allDayBounds = t.allDayBounds;
    var colContentLeft = t.colContentLeft;
    var colContentRight = t.colContentRight;
    var dayOfWeekCol = t.dayOfWeekCol;
    var dateCell = t.dateCell;
    var compileDaySegs = t.compileDaySegs;
    var getDaySegmentContainer = t.getDaySegmentContainer;
    var bindDaySeg = t.bindDaySeg; //TODO: streamline this
    var formatDates = t.calendar.formatDates;
    var renderDayOverlay = t.renderDayOverlay;
    var clearOverlays = t.clearOverlays;
    var clearSelection = t.clearSelection;


    /* Rendering
     -----------------------------------------------------------------------------*/


    function renderDaySegs(segs, modifiedEventId) {
      var segmentContainer = getDaySegmentContainer();
      var rowDivs;
      var rowCnt = getRowCnt();
      var colCnt = getColCnt();
      var i = 0;
      var rowI;
      var levelI;
      var colHeights;
      var j;
      var segCnt = segs.length;
      var seg;
      var top;
      var k;
      segmentContainer[0].innerHTML = daySegHTML(segs); // faster than .html()
      daySegElementResolve(segs, segmentContainer.children());
      daySegElementReport(segs);
      daySegHandlers(segs, segmentContainer, modifiedEventId);
      daySegCalcHSides(segs);
      daySegSetWidths(segs);
      daySegCalcHeights(segs);
      rowDivs = getRowDivs();
      // set row heights, calculate event tops (in relation to row top)
      for (rowI = 0; rowI < rowCnt; rowI++) {
        levelI = 0;
        colHeights = [];
        for (j = 0; j < colCnt; j++) {
          colHeights[j] = 0;
        }
        while (i < segCnt && (seg = segs[i]).row == rowI) {
          // loop through segs in a row
          top = arrayMax(colHeights.slice(seg.startCol, seg.endCol));
          seg.top = top;
          top += seg.outerHeight;
          for (k = seg.startCol; k < seg.endCol; k++) {
            colHeights[k] = top;
          }
          i++;
        }
        rowDivs[rowI].height(arrayMax(colHeights));
      }
      daySegSetTops(segs, getRowTops(rowDivs));
    }


    function renderTempDaySegs(segs, adjustRow, adjustTop) {
      var tempContainer = $("<div/>");
      var elements;
      var segmentContainer = getDaySegmentContainer();
      var i;
      var segCnt = segs.length;
      var element;
      tempContainer[0].innerHTML = daySegHTML(segs); // faster than .html()
      elements = tempContainer.children();
      segmentContainer.append(elements);
      daySegElementResolve(segs, elements);
      daySegCalcHSides(segs);
      daySegSetWidths(segs);
      daySegCalcHeights(segs);
      daySegSetTops(segs, getRowTops(getRowDivs()));
      elements = [];
      for (i = 0; i < segCnt; i++) {
        element = segs[i].element;
        if (element) {
          if (segs[i].row === adjustRow) {
            element.css('top', adjustTop);
          }
          elements.push(element[0]);
        }
      }
      return $(elements);
    }


    function daySegHTML(segs) { // also sets seg.left and seg.outerWidth
      var rtl = opt('isRTL');
      var i;
      var segCnt = segs.length;
      var seg;
      var event;
      var url;
      var classes;
      var bounds = allDayBounds();
      var minLeft = bounds.left;
      var maxLeft = bounds.right;
      var leftCol;
      var rightCol;
      var left;
      var right;
      var skinCss;
      var html = '';
      // calculate desired position/dimensions, create html
      for (i = 0; i < segCnt; i++) {
        seg = segs[i];
        event = seg.event;
        classes = ['fc-event', 'fc-event-skin', 'fc-event-hori'];
        if (isEventDraggable(event)) {
          classes.push('fc-event-draggable');
        }
        if (rtl) {
          if (seg.isStart) {
            classes.push('fc-corner-right');
          }
          if (seg.isEnd) {
            classes.push('fc-corner-left');
          }
          leftCol = dayOfWeekCol(seg.end.getDay() - 1);
          rightCol = dayOfWeekCol(seg.start.getDay());
          left = seg.isEnd ? colContentLeft(leftCol) : minLeft;
          right = seg.isStart ? colContentRight(rightCol) : maxLeft;
        } else {
          if (seg.isStart) {
            classes.push('fc-corner-left');
          }
          if (seg.isEnd) {
            classes.push('fc-corner-right');
          }
          leftCol = dayOfWeekCol(seg.start.getDay());
          rightCol = dayOfWeekCol(seg.end.getDay() - 1);
          left = seg.isStart ? colContentLeft(leftCol) : minLeft;
          right = seg.isEnd ? colContentRight(rightCol) : maxLeft;
        }
        classes = classes.concat(event.className);
        if (event.source) {
          classes = classes.concat(event.source.className || []);
        }
        url = event.url;
        skinCss = getSkinCss(event, opt);
        if (url) {
          html += "<a href='" + htmlEscape(url) + "'";
        } else {
          html += "<div";
        }
        html +=
                " class='" + classes.join(' ') + "'" +
                        " style='position:absolute;z-index:8;left:" + left + "px;" + skinCss + "'" +
                        ">" +
                        "<div" +
                        " class='fc-event-inner fc-event-skin'" +
                        (skinCss ? " style='" + skinCss + "'" : '') +
                        ">";
        if (!event.allDay && seg.isStart) {
          html +=
                  "<span class='fc-event-time'>" +
                          htmlEscape(formatDates(event.start, event.end, opt('timeFormat'))) +
                          "</span>";
        }
        html +=
                "<span class='fc-event-title'>" + htmlEscape(event.title) + "</span>" +
                        "</div>";
        if (seg.isEnd && isEventResizable(event)) {
          html +=
                  "<div class='ui-resizable-handle ui-resizable-" + (rtl ? 'w' : 'e') + "'>" +
                          "&nbsp;&nbsp;&nbsp;" + // makes hit area a lot better for IE6/7
                          "</div>";
        }
        html +=
                "</" + (url ? "a" : "div" ) + ">";
        seg.left = left;
        seg.outerWidth = right - left;
        seg.startCol = leftCol;
        seg.endCol = rightCol + 1; // needs to be exclusive
      }
      return html;
    }


    function daySegElementResolve(segs, elements) { // sets seg.element
      var i;
      var segCnt = segs.length;
      var seg;
      var event;
      var element;
      var triggerRes;
      for (i = 0; i < segCnt; i++) {
        seg = segs[i];
        event = seg.event;
        element = $(elements[i]); // faster than .eq()
        triggerRes = trigger('eventRender', event, event, element);
        if (triggerRes === false) {
          element.remove();
        } else {
          if (triggerRes && triggerRes !== true) {
            triggerRes = $(triggerRes)
                    .css({
                           position: 'absolute',
                           left: seg.left
                         });
            element.replaceWith(triggerRes);
            element = triggerRes;
          }
          seg.element = element;
        }
      }
    }


    function daySegElementReport(segs) {
      var i;
      var segCnt = segs.length;
      var seg;
      var element;
      for (i = 0; i < segCnt; i++) {
        seg = segs[i];
        element = seg.element;
        if (element) {
          reportEventElement(seg.event, element);
        }
      }
    }


    function daySegHandlers(segs, segmentContainer, modifiedEventId) {
      var i;
      var segCnt = segs.length;
      var seg;
      var element;
      var event;
      // retrieve elements, run through eventRender callback, bind handlers
      for (i = 0; i < segCnt; i++) {
        seg = segs[i];
        element = seg.element;
        if (element) {
          event = seg.event;
          if (event._id === modifiedEventId) {
            bindDaySeg(event, element, seg);
          } else {
            element[0]._fci = i; // for lazySegBind
          }
        }
      }
      lazySegBind(segmentContainer, segs, bindDaySeg);
    }


    function daySegCalcHSides(segs) { // also sets seg.key
      var i;
      var segCnt = segs.length;
      var seg;
      var element;
      var key, val;
      var hsideCache = {};
      // record event horizontal sides
      for (i = 0; i < segCnt; i++) {
        seg = segs[i];
        element = seg.element;
        if (element) {
          key = seg.key = cssKey(element[0]);
          val = hsideCache[key];
          if (val === undefined) {
            val = hsideCache[key] = hsides(element, true);
          }
          seg.hsides = val;
        }
      }
    }


    function daySegSetWidths(segs) {
      var i;
      var segCnt = segs.length;
      var seg;
      var element;
      for (i = 0; i < segCnt; i++) {
        seg = segs[i];
        element = seg.element;
        if (element) {
          element[0].style.width = Math.max(0, seg.outerWidth - seg.hsides) + 'px';
        }
      }
    }


    function daySegCalcHeights(segs) {
      var i;
      var segCnt = segs.length;
      var seg;
      var element;
      var key, val;
      var vmarginCache = {};
      // record event heights
      for (i = 0; i < segCnt; i++) {
        seg = segs[i];
        element = seg.element;
        if (element) {
          key = seg.key; // created in daySegCalcHSides
          val = vmarginCache[key];
          if (val === undefined) {
            val = vmarginCache[key] = vmargins(element);
          }
          seg.outerHeight = element[0].offsetHeight + val;
        }
      }
    }


    function getRowDivs() {
      var i;
      var rowCnt = getRowCnt();
      var rowDivs = [];
      for (i = 0; i < rowCnt; i++) {
        rowDivs[i] = allDayRow(i)
                .find('td:first div.fc-day-content > div'); // optimal selector?
      }
      return rowDivs;
    }


    function getRowTops(rowDivs) {
      var i;
      var rowCnt = rowDivs.length;
      var tops = [];
      for (i = 0; i < rowCnt; i++) {
        tops[i] = rowDivs[i][0].offsetTop; // !!?? but this means the element needs position:relative if in a table cell!!!!
      }
      return tops;
    }


    function daySegSetTops(segs, rowTops) { // also triggers eventAfterRender
      var i;
      var segCnt = segs.length;
      var seg;
      var element;
      var event;
      for (i = 0; i < segCnt; i++) {
        seg = segs[i];
        element = seg.element;
        if (element) {
          element[0].style.top = rowTops[seg.row] + (seg.top || 0) + 'px';
          event = seg.event;
          trigger('eventAfterRender', event, event, element);
        }
      }
    }


    /* Resizing
     -----------------------------------------------------------------------------------*/


    function resizableDayEvent(event, element, seg) {
      var rtl = opt('isRTL');
      var direction = rtl ? 'w' : 'e';
      var handle = element.find('div.ui-resizable-' + direction);
      var isResizing = false;

      // TODO: look into using jquery-ui mouse widget for this stuff
      disableTextSelection(element); // prevent native <a> selection for IE
      element
              .mousedown(function(ev) { // prevent native <a> selection for others
        ev.preventDefault();
      })
              .click(function(ev) {
        if (isResizing) {
          ev.preventDefault(); // prevent link from being visited (only method that worked in IE6)
          ev.stopImmediatePropagation(); // prevent fullcalendar eventClick handler from being called
          // (eventElementHandlers needs to be bound after resizableDayEvent)
        }
      });

      handle.mousedown(function(ev) {
        if (ev.which != 1) {
          return; // needs to be left mouse button
        }
        isResizing = true;
        var hoverListener = t.getHoverListener();
        var rowCnt = getRowCnt();
        var colCnt = getColCnt();
        var dis = rtl ? -1 : 1;
        var dit = rtl ? colCnt - 1 : 0;
        var elementTop = element.css('top');
        var dayDelta;
        var helpers;
        var eventCopy = $.extend({}, event);
        var minCell = dateCell(event.start);
        clearSelection();
        $('body')
                .css('cursor', direction + '-resize')
                .one('mouseup', mouseup);
        trigger('eventResizeStart', this, event, ev);
        hoverListener.start(function(cell, origCell) {
          if (cell) {
            var r = Math.max(minCell.row, cell.row);
            var c = cell.col;
            if (rowCnt == 1) {
              r = 0; // hack for all-day area in agenda views
            }
            if (r == minCell.row) {
              if (rtl) {
                c = Math.min(minCell.col, c);
              } else {
                c = Math.max(minCell.col, c);
              }
            }
            dayDelta = (r * 7 + c * dis + dit) - (origCell.row * 7 + origCell.col * dis + dit);
            var newEnd = addDays(eventEnd(event), dayDelta, true);
            if (dayDelta) {
              eventCopy.end = newEnd;
              var oldHelpers = helpers;
              helpers = renderTempDaySegs(compileDaySegs([eventCopy]), seg.row, elementTop);
              helpers.find('*').css('cursor', direction + '-resize');
              if (oldHelpers) {
                oldHelpers.remove();
              }
              hideEvents(event);
            } else {
              if (helpers) {
                showEvents(event);
                helpers.remove();
                helpers = null;
              }
            }
            clearOverlays();
            renderDayOverlay(event.start, addDays(cloneDate(newEnd), 1)); // coordinate grid already rebuild at hoverListener.start
          }
        }, ev);

        function mouseup(ev) {
          trigger('eventResizeStop', this, event, ev);
          $('body').css('cursor', '');
          hoverListener.stop();
          clearOverlays();
          if (dayDelta) {
            eventResize(this, event, dayDelta, 0, ev);
            // event redraw will clear helpers
          }
          // otherwise, the drag handler already restored the old events

          setTimeout(function() { // make this happen after the element's click event
            isResizing = false;
          }, 0);
        }

      });
    }


  }

//BUG: unselect needs to be triggered when events are dragged+dropped

  function SelectionManager() {
    var t = this;


    // exports
    t.select = select;
    t.unselect = unselect;
    t.reportSelection = reportSelection;
    t.daySelectionMousedown = daySelectionMousedown;


    // imports
    var opt = t.opt;
    var trigger = t.trigger;
    var defaultSelectionEnd = t.defaultSelectionEnd;
    var renderSelection = t.renderSelection;
    var clearSelection = t.clearSelection;


    // locals
    var selected = false;


    // unselectAuto
    if (opt('selectable') && opt('unselectAuto')) {
      $(document).mousedown(function(ev) {
        var ignore = opt('unselectCancel');
        if (ignore) {
          if ($(ev.target).parents(ignore).length) { // could be optimized to stop after first match
            return;
          }
        }
        unselect(ev);
      });
    }


    function select(startDate, endDate, allDay) {
      unselect();
      if (!endDate) {
        endDate = defaultSelectionEnd(startDate, allDay);
      }
      renderSelection(startDate, endDate, allDay);
      reportSelection(startDate, endDate, allDay);
    }


    function unselect(ev) {
      if (selected) {
        selected = false;
        clearSelection();
        trigger('unselect', null, ev);
      }
    }


    function reportSelection(startDate, endDate, allDay, ev) {
      selected = true;
      trigger('select', null, startDate, endDate, allDay, ev);
    }


    function daySelectionMousedown(ev) { // not really a generic manager method, oh well
      var cellDate = t.cellDate;
      var cellIsAllDay = t.cellIsAllDay;
      var hoverListener = t.getHoverListener();
      var reportDayClick = t.reportDayClick; // this is hacky and sort of weird
      if (ev.which == 1 && opt('selectable')) { // which==1 means left mouse button
        unselect(ev);
        var _mousedownElement = this;
        var dates;
        hoverListener.start(function(cell, origCell) { // TODO: maybe put cellDate/cellIsAllDay info in cell
          clearSelection();
          if (cell && cellIsAllDay(cell)) {
            dates = [ cellDate(origCell), cellDate(cell) ].sort(cmp);
            renderSelection(dates[0], dates[1], true);
          } else {
            dates = null;
          }
        }, ev);
        $(document).one('mouseup', function(ev) {
          hoverListener.stop();
          if (dates) {
            if (+dates[0] == +dates[1]) {
              reportDayClick(dates[0], true, ev);
            }
            reportSelection(dates[0], dates[1], true, ev);
          }
        });
      }
    }


  }

  function OverlayManager() {
    var t = this;


    // exports
    t.renderOverlay = renderOverlay;
    t.clearOverlays = clearOverlays;


    // locals
    var usedOverlays = [];
    var unusedOverlays = [];


    function renderOverlay(rect, parent) {
      var e = unusedOverlays.shift();
      if (!e) {
        e = $("<div class='fc-cell-overlay' style='position:absolute;z-index:3'/>");
      }
      if (e[0].parentNode != parent[0]) {
        e.appendTo(parent);
      }
      usedOverlays.push(e.css(rect).show());
      return e;
    }


    function clearOverlays() {
      var e;
      while (e = usedOverlays.shift()) {
        unusedOverlays.push(e.hide().unbind());
      }
    }


  }

  function CoordinateGrid(buildFunc) {

    var t = this;
    var rows;
    var cols;


    t.build = function() {
      rows = [];
      cols = [];
      buildFunc(rows, cols);
    };


    t.cell = function(x, y) {
      var rowCnt = rows.length;
      var colCnt = cols.length;
      var i, r = -1, c = -1;
      for (i = 0; i < rowCnt; i++) {
        if (y >= rows[i][0] && y < rows[i][1]) {
          r = i;
          break;
        }
      }
      for (i = 0; i < colCnt; i++) {
        if (x >= cols[i][0] && x < cols[i][1]) {
          c = i;
          break;
        }
      }
      return (r >= 0 && c >= 0) ? { row:r, col:c } : null;
    };


    t.rect = function(row0, col0, row1, col1, originElement) { // row1,col1 is inclusive
      var origin = originElement.offset();
      return {
        top: rows[row0][0] - origin.top,
        left: cols[col0][0] - origin.left,
        width: cols[col1][1] - cols[col0][0],
        height: rows[row1][1] - rows[row0][0]
      };
    };

  }

  function HoverListener(coordinateGrid) {


    var t = this;
    var bindType;
    var change;
    var firstCell;
    var cell;


    t.start = function(_change, ev, _bindType) {
      change = _change;
      firstCell = cell = null;
      coordinateGrid.build();
      mouse(ev);
      bindType = _bindType || 'mousemove';
      $(document).bind(bindType, mouse);
    };


    function mouse(ev) {
      var newCell = coordinateGrid.cell(ev.pageX, ev.pageY);
      if (!newCell != !cell || newCell && (newCell.row != cell.row || newCell.col != cell.col)) {
        if (newCell) {
          if (!firstCell) {
            firstCell = newCell;
          }
          change(newCell, firstCell, newCell.row - firstCell.row, newCell.col - firstCell.col);
        } else {
          change(newCell, firstCell);
        }
        cell = newCell;
      }
    }


    t.stop = function() {
      $(document).unbind(bindType, mouse);
      return cell;
    };


  }

  function HorizontalPositionCache(getElement) {

    var t = this,
            elements = {},
            lefts = {},
            rights = {};

    function e(i) {
      return elements[i] = elements[i] || getElement(i);
    }

    t.left = function(i) {
      return lefts[i] = lefts[i] === undefined ? e(i).position().left : lefts[i];
    };

    t.right = function(i) {
      return rights[i] = rights[i] === undefined ? t.left(i) + e(i).width() : rights[i];
    };

    t.clear = function() {
      elements = {};
      lefts = {};
      rights = {};
    };

  }

})(jQuery);

/*
 * FullCalendar v1.5.1 Google Calendar Plugin
 *
 * Copyright (c) 2011 Adam Shaw
 * Dual licensed under the MIT and GPL licenses, located in
 * MIT-LICENSE.txt and GPL-LICENSE.txt respectively.
 *
 * Date: Sat Apr 9 14:09:51 2011 -0700
 *
 */

(function($) {


  var fc = $.fullCalendar;
  var formatDate = fc.formatDate;
  var parseISO8601 = fc.parseISO8601;
  var addDays = fc.addDays;
  var applyAll = fc.applyAll;


  fc.sourceNormalizers.push(function(sourceOptions) {
    if (sourceOptions.dataType == 'gcal' ||
            sourceOptions.dataType === undefined &&
                    (sourceOptions.url || '').match(/^(http|https):\/\/www.google.com\/calendar\/feeds\//)) {
      sourceOptions.dataType = 'gcal';
      if (sourceOptions.editable === undefined) {
        sourceOptions.editable = false;
      }
    }
  });


  fc.sourceFetchers.push(function(sourceOptions, start, end) {
    if (sourceOptions.dataType == 'gcal') {
      return transformOptions(sourceOptions, start, end);
    }
  });


  function transformOptions(sourceOptions, start, end) {

    var success = sourceOptions.success;
    var data = $.extend({}, sourceOptions.data || {}, {
      'start-min': formatDate(start, 'u'),
      'start-max': formatDate(end, 'u'),
      'singleevents': true,
      'max-results': 9999
    });

    var ctz = sourceOptions.currentTimezone;
    if (ctz) {
      data.ctz = ctz = ctz.replace(' ', '_');
    }

    return $.extend({}, sourceOptions, {
      url: sourceOptions.url.replace(/\/basic$/, '/full') + '?alt=json-in-script&callback=?',
      dataType: 'jsonp',
      data: data,
      startParam: false,
      endParam: false,
      success: function(data) {
        var events = [];
        if (data.feed.entry) {
          $.each(data.feed.entry, function(i, entry) {
            var startStr = entry['gd$when'][0]['startTime'];
            var start = parseISO8601(startStr, true);
            var end = parseISO8601(entry['gd$when'][0]['endTime'], true);
            var allDay = startStr.indexOf('T') == -1;
            var url;
            $.each(entry.link, function(i, link) {
              if (link.type == 'text/html') {
                url = link.href;
                if (ctz) {
                  url += (url.indexOf('?') == -1 ? '?' : '&') + 'ctz=' + ctz;
                }
              }
            });
            if (allDay) {
              addDays(end, -1); // make inclusive
            }
            events.push({
              id: entry['gCal$uid']['value'],
              title: entry['title']['$t'],
              url: url,
              start: start,
              end: end,
              allDay: allDay,
              location: entry['gd$where'][0]['valueString'],
              description: entry['content']['$t']
            });
          });
        }
        var args = [events].concat(Array.prototype.slice.call(arguments, 1));
        var res = applyAll(success, this, args);
        if ($.isArray(res)) {
          return res;
        }
        return events;
      }
    });

  }


// legacy
  fc.gcalFeed = function(url, sourceOptions) {
    return $.extend({}, sourceOptions, { url: url, dataType: 'gcal' });
  };


})(jQuery);
