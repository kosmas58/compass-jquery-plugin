//
// Adding some animation to flash messages
// Idea from http://stackoverflow.com/questions/316278/timeout-jquery-effects
//
// Copyright (c) 2011 Kosmas Schütz
//

(function($) {

    //   Parameters are:
    //   time for fadeIn
    //   time the message is shown
    //   time for fadeOut

    $.fn.flashMessages = function(timeIn, timeStay, timeOut) {

        var el = $(this.selector + " .success, " + this.selector + " .notice, " + this.selector + " .warning, " + this.selector + " .error");
        el.fadeIn(timeIn);
        el.queue(function() {
            setTimeout(function() {
                el.dequeue();
            }, timeStay);
        });
        el.fadeOut(timeOut);
    };
})(jQuery);