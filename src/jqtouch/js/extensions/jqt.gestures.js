/*
 * jQTouch Gestures extension
 *
 * Built and maintaned by Tudor M.
 * email: tudor@grokprojects.com
 * stalk me: twitter.com/tudorizer
 *
 */
(function($) {
  if ($.jQTouch) {

    function bindGesture(options) {
      var end_scale, end_rotation, settings, end_scale, rotation = 0;
      settings = {
        element: $('#gesture_test'),
        onGestureStart: null,
        onGestureChange: null,
        onGestureEnd: null,
      };
      settings = $.extend({}, settings, options);

      settings.element
              .bind('gesturestart', function(e) {
        e.originalEvent.preventDefault();
        if (settings.onGestureStart)
          settings.onGestureStart(getScale(e, end_scale), getRotation(e, rotation), e, settings.element);
      })
              .bind('gesturechange', function(e) {
                if (settings.onGestureChange)
                  settings.onGestureChange(getScale(e, end_scale), getRotation(e, rotation), e, settings.element);
              })
              .bind('gestureend', function(e) {
                end_scale = e.originalEvent.scale;
                rotation = (e.originalEvent.rotation + rotation) % 360;
                if (settings.onGestureEnd)
                  settings.onGestureEnd(getScale(e, end_scale), getRotation(e, rotation), e, settings.element);
              });
    }

    function getRotation(event, current_rotation) {
      return event.originalEvent.rotation + current_rotation;
    }

    function getScale(event, current_scale) {
      return event.originalEvent.scale + current_scale;
    }

    // PUBLIC methods
    $.fn.bindGestures = function(obj) {
      obj.element = this;
      bindGesture(obj);
    };
  }
})(jQuery);
