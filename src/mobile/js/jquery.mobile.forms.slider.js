/*
 * jQuery Mobile Framework : "slider" plugin
 * Copyright (c) jQuery Project
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 */
(function($, undefined) {
    $.widget("mobile.slider", $.mobile.widget, {
        options: {
            theme: null,
            trackTheme: null,
            disabled: false
        },
        _create: function() {
            var self = this,

                    control = this.element,

                    parentTheme = control.parents('[class*=ui-bar-],[class*=ui-body-]').eq(0),

                    parentTheme = parentTheme.length ? parentTheme.attr('class').match(/ui-(bar|body)-([a-z])/)[2] : 'c',

                    theme = this.options.theme ? this.options.theme : parentTheme,

                    trackTheme = this.options.trackTheme ? this.options.trackTheme : parentTheme,

                    cType = control[0].nodeName.toLowerCase(),
                    selectClass = (cType == 'select') ? 'ui-slider-switch' : '',
                    controlID = control.attr('id'),
                    labelID = controlID + '-label',
                    label = $('[for=' + controlID + ']').attr('id', labelID),
                    val = function() {
                        return (cType == 'input') ? parseFloat(control.val()) : control[0].selectedIndex;
                    },
                    min = (cType == 'input') ? parseFloat(control.attr('min')) : 0,
                    max = (cType == 'input') ? parseFloat(control.attr('max')) : control.find('option').length - 1,
                    step = window.parseFloat(control.attr('step') || 1),
                    slider = $('<div class="ui-slider ' + selectClass + ' ui-btn-down-' + trackTheme + ' ui-btn-corner-all" role="application"></div>'),
                    handle = $('<a href="#" class="ui-slider-handle"></a>')
                            .appendTo(slider)
                            .buttonMarkup({corners: true, theme: theme, shadow: true})
                            .attr({
                                      'role': 'slider',
                                      'aria-valuemin': min,
                                      'aria-valuemax': max,
                                      'aria-valuenow': val(),
                                      'aria-valuetext': val(),
                                      'title': val(),
                                      'aria-labelledby': labelID
                                  });

            $.extend(this, {
                slider: slider,
                handle: handle,
                dragging: false,
                beforeStart: null
            });

            if (cType == 'select') {
                slider.wrapInner('<div class="ui-slider-inneroffset"></div>');
                var options = control.find('option');

                control.find('option').each(function(i) {
                    var side = (i == 0) ? 'b' : 'a',
                            corners = (i == 0) ? 'right' : 'left',
                            theme = (i == 0) ? ' ui-btn-down-' + trackTheme : ' ui-btn-active';
                    $('<div class="ui-slider-labelbg ui-slider-labelbg-' + side + theme + ' ui-btn-corner-' + corners + '"></div>').prependTo(slider);
                    $('<span class="ui-slider-label ui-slider-label-' + side + theme + ' ui-btn-corner-' + corners + '" role="img">' + $(this).text() + '</span>').prependTo(handle);
                });

            }

            label.addClass('ui-slider');

            // monitor the input for updated values
            control
                    .addClass((cType == 'input') ? 'ui-slider-input' : 'ui-slider-switch')
                    .change(function() {
                self.refresh(val(), true);
            })
                    .keyup(function() { // necessary?
                self.refresh(val(), true, true);
            })
                    .blur(function() {
                self.refresh(val(), true);
            });

            // prevent screen drag when slider activated
            $(document).bind("vmousemove", function(event) {
                if (self.dragging) {
                    self.refresh(event);
                    return false;
                }
            });

            slider
                    .bind("vmousedown", function(event) {
                self.dragging = true;
                if (cType === "select") {
                    self.beforeStart = control[0].selectedIndex;
                }
                self.refresh(event);
                return false;
            });

            slider
                    .add(document)
                    .bind("vmouseup", function() {
                if (self.dragging) {
                    self.dragging = false;
                    if (cType === "select") {
                        if (self.beforeStart === control[0].selectedIndex) {
                            //tap occurred, but value didn't change. flip it!
                            self.refresh(self.beforeStart === 0 ? 1 : 0);
                        }
                        var curval = val();
                        var snapped = Math.round(curval / (max - min) * 100);
                        handle
                                .addClass("ui-slider-handle-snapping")
                                .css("left", snapped + "%")
                                .animationComplete(function() {
                            handle.removeClass("ui-slider-handle-snapping");
                        });
                    }
                    return false;
                }
            });

            slider.insertAfter(control);

            // NOTE force focus on handle
            this.handle
                    .bind("vmousedown", function() {
                $(this).focus();
            });

            this.handle
                    .bind("keydown", function(event) {
                var index = val();

                if (self.options.disabled) {
                    return;
                }

                // In all cases prevent the default and mark the handle as active
                switch (event.keyCode) {
                    case $.mobile.keyCode.HOME:
                    case $.mobile.keyCode.END:
                    case $.mobile.keyCode.PAGE_UP:
                    case $.mobile.keyCode.PAGE_DOWN:
                    case $.mobile.keyCode.UP:
                    case $.mobile.keyCode.RIGHT:
                    case $.mobile.keyCode.DOWN:
                    case $.mobile.keyCode.LEFT:
                        event.preventDefault();

                        if (!self._keySliding) {
                            self._keySliding = true;
                            $(this).addClass("ui-state-active");
                        }
                        break;
                }

                // move the slider according to the keypress
                switch (event.keyCode) {
                    case $.mobile.keyCode.HOME:
                        self.refresh(min);
                        break;
                    case $.mobile.keyCode.END:
                        self.refresh(max);
                        break;
                    case $.mobile.keyCode.PAGE_UP:
                    case $.mobile.keyCode.UP:
                    case $.mobile.keyCode.RIGHT:
                        self.refresh(index + step);
                        break;
                    case $.mobile.keyCode.PAGE_DOWN:
                    case $.mobile.keyCode.DOWN:
                    case $.mobile.keyCode.LEFT:
                        self.refresh(index - step);
                        break;
                }
            })// remove active mark
                    .keyup(function(event) {
                if (self._keySliding) {
                    self._keySliding = false;
                    $(this).removeClass("ui-state-active");
                }
            });

            this.refresh();
        },

        refresh: function(val, isfromControl, preventInputUpdate) {
            if (this.options.disabled) {
                return;
            }

            var control = this.element, percent,
                    cType = control[0].nodeName.toLowerCase(),
                    min = (cType === "input") ? parseFloat(control.attr("min")) : 0,
                    max = (cType === "input") ? parseFloat(control.attr("max")) : control.find("option").length - 1;

            if (typeof val === "object") {
                var data = val,
                    // a slight tolerance helped get to the ends of the slider
                        tol = 8;
                if (!this.dragging
                        || data.pageX < this.slider.offset().left - tol
                        || data.pageX > this.slider.offset().left + this.slider.width() + tol) {
                    return;
                }
                percent = Math.round(((data.pageX - this.slider.offset().left) / this.slider.width() ) * 100);
            } else {
                if (val == null) {
                    val = (cType === "input") ? parseFloat(control.val()) : control[0].selectedIndex;
                }
                percent = (parseFloat(val) - min) / (max - min) * 100;
            }

            if (isNaN(percent)) {
                return;
            }
            if (percent < 0) {
                percent = 0;
            }
            if (percent > 100) {
                percent = 100;
            }

            var newval = Math.round((percent / 100) * (max - min)) + min;
            if (newval < min) {
                newval = min;
            }
            if (newval > max) {
                newval = max;
            }

            //flip the stack of the bg colors
            if (percent > 60 && cType === "select") {

            }
            this.handle.css("left", percent + "%");
            this.handle.attr({
                "aria-valuenow": (cType === "input") ? newval : control.find("option").eq(newval).attr("value"),
                "aria-valuetext": (cType === "input") ? newval : control.find("option").eq(newval).text(),
                title: newval
            });

            // add/remove classes for flip toggle switch
            if (cType === "select") {
                if (newval === 0) {
                    this.slider.addClass("ui-slider-switch-a")
                            .removeClass("ui-slider-switch-b");
                } else {
                    this.slider.addClass("ui-slider-switch-b")
                            .removeClass("ui-slider-switch-a");
                }
            }

            if (!preventInputUpdate) {
                // update control's value
                if (cType === "input") {
                    control.val(newval);
                } else {
                    control[ 0 ].selectedIndex = newval;
                }
                if (!isfromControl) {
                    control.trigger("change");
                }
            }
        },

        enable: function() {
            this.element.attr("disabled", false);
            this.slider.removeClass("ui-disabled").attr("aria-disabled", false);
            return this._setOption("disabled", false);
        },

        disable: function() {
            this.element.attr("disabled", true);
            this.slider.addClass("ui-disabled").attr("aria-disabled", true);
            return this._setOption("disabled", true);
        }

    });
})(jQuery);

