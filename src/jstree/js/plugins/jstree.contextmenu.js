/*
 * jsTree contextmenu plugin
 */
(function ($) {
  $.vakata.context = {
    hide_on_mouseleave : false,

    cnt    : $("<div id='vakata-contextmenu' />"),
    vis    : false,
    tgt    : false,
    par    : false,
    func  : false,
    data  : false,
    rtl    : false,
    show  : function (s, t, x, y, d, p, rtl) {
      $.vakata.context.rtl = !!rtl;
      var html = $.vakata.context.parse(s), h, w;
      if (!html) {
        return;
      }
      $.vakata.context.vis = true;
      $.vakata.context.tgt = t;
      $.vakata.context.par = p || t || null;
      $.vakata.context.data = d || null;
      $.vakata.context.cnt
              .html(html)
              .css({ "visibility" : "hidden", "display" : "block", "left" : 0, "top" : 0 });

      if ($.vakata.context.hide_on_mouseleave) {
        $.vakata.context.cnt
                .one("mouseleave", function(e) {
          $.vakata.context.hide();
        });
      }

      h = $.vakata.context.cnt.height();
      w = $.vakata.context.cnt.width();
      if (x + w > $(document).width()) {
        x = $(document).width() - (w + 5);
        $.vakata.context.cnt.find("li > ul").addClass("right");
      }
      if (y + h > $(document).height()) {
        y = y - (h + t[0].offsetHeight);
        $.vakata.context.cnt.find("li > ul").addClass("bottom");
      }

      $.vakata.context.cnt
              .css({ "left" : x, "top" : y })
              .find("li:has(ul)")
              .bind("mouseenter", function (e) {
                var w = $(document).width(),
                        h = $(document).height(),
                        ul = $(this).children("ul").show();
                if (w !== $(document).width()) {
                  ul.toggleClass("right");
                }
                if (h !== $(document).height()) {
                  ul.toggleClass("bottom");
                }
              })
              .bind("mouseleave", function (e) {
                $(this).children("ul").hide();
              })
              .end()
              .css({ "visibility" : "visible" })
              .show();
      $(document).triggerHandler("context_show.vakata");
    },
    hide  : function () {
      $.vakata.context.vis = false;
      $.vakata.context.cnt.attr("class", "").css({ "visibility" : "hidden" });
      $(document).triggerHandler("context_hide.vakata");
    },
    parse  : function (s, is_callback) {
      if (!s) {
        return false;
      }
      var str = "",
              tmp = false,
              was_sep = true;
      if (!is_callback) {
        $.vakata.context.func = {};
      }
      str += "<ul>";
      $.each(s, function (i, val) {
        if (!val) {
          return true;
        }
        $.vakata.context.func[i] = val.action;
        if (!was_sep && val.separator_before) {
          str += "<li class='vakata-separator vakata-separator-before'></li>";
        }
        was_sep = false;
        str += "<li class='" + (val._class || "") + (val._disabled ? " jstree-contextmenu-disabled " : "") + "'><ins ";
        if (val.icon && val.icon.indexOf("/") === -1) {
          str += " class='" + val.icon + "' ";
        }
        if (val.icon && val.icon.indexOf("/") !== -1) {
          str += " style='background:url(" + val.icon + ") center center no-repeat;' ";
        }
        str += ">&#160;</ins><a href='#' rel='" + i + "'>";
        if (val.submenu) {
          str += "<span style='float:" + ($.vakata.context.rtl ? "left" : "right") + ";'>&raquo;</span>";
        }
        str += val.label + "</a>";
        if (val.submenu) {
          tmp = $.vakata.context.parse(val.submenu, true);
          if (tmp) {
            str += tmp;
          }
        }
        str += "</li>";
        if (val.separator_after) {
          str += "<li class='vakata-separator vakata-separator-after'></li>";
          was_sep = true;
        }
      });
      str = str.replace(/<li class\='vakata-separator vakata-separator-after'\><\/li\>$/, "");
      str += "</ul>";
      $(document).triggerHandler("context_parse.vakata");
      return str.length > 10 ? str : false;
    },
    exec  : function (i) {
      if ($.isFunction($.vakata.context.func[i])) {
        // if is string - eval and call it!
        $.vakata.context.func[i].call($.vakata.context.data, $.vakata.context.par);
        return true;
      }
      else {
        return false;
      }
    }
  };
  $(function () {
    var css_string = '' +
            '#vakata-contextmenu { display:block; visibility:hidden; left:0; top:-200px; position:absolute; margin:0; padding:0; min-width:180px; background:#ebebeb; border:1px solid silver; z-index:10000; *width:180px; } ' +
            '#vakata-contextmenu ul { min-width:180px; *width:180px; } ' +
            '#vakata-contextmenu ul, #vakata-contextmenu li { margin:0; padding:0; list-style-type:none; display:block; } ' +
            '#vakata-contextmenu li { line-height:20px; min-height:20px; position:relative; padding:0px; } ' +
            '#vakata-contextmenu li a { padding:1px 6px; line-height:17px; display:block; text-decoration:none; margin:1px 1px 0 1px; } ' +
            '#vakata-contextmenu li ins { float:left; width:16px; height:16px; text-decoration:none; margin-right:2px; } ' +
            '#vakata-contextmenu li a:hover, #vakata-contextmenu li.vakata-hover > a { background:gray; color:white; } ' +
            '#vakata-contextmenu li ul { display:none; position:absolute; top:-2px; left:100%; background:#ebebeb; border:1px solid gray; } ' +
            '#vakata-contextmenu .right { right:100%; left:auto; } ' +
            '#vakata-contextmenu .bottom { bottom:-1px; top:auto; } ' +
            '#vakata-contextmenu li.vakata-separator { min-height:0; height:1px; line-height:1px; font-size:1px; overflow:hidden; margin:0 2px; background:silver; /* border-top:1px solid #fefefe; */ padding:0; } ';
    $.vakata.css.add_sheet({ str : css_string, title : "vakata" });
    $.vakata.context.cnt
            .delegate("a", "click", function (e) {
      e.preventDefault();
    })
            .delegate("a", "mouseup", function (e) {
              if (!$(this).parent().hasClass("jstree-contextmenu-disabled") && $.vakata.context.exec($(this).attr("rel"))) {
                $.vakata.context.hide();
              }
              else {
                $(this).blur();
              }
            })
            .delegate("a", "mouseover", function () {
              $.vakata.context.cnt.find(".vakata-hover").removeClass("vakata-hover");
            })
            .appendTo("body");
    $(document).bind("mousedown", function (e) {
      if ($.vakata.context.vis && !$.contains($.vakata.context.cnt[0], e.target)) {
        $.vakata.context.hide();
      }
    });
    if (typeof $.hotkeys !== "undefined") {
      $(document)
              .bind("keydown", "up", function (e) {
                if ($.vakata.context.vis) {
                  var o = $.vakata.context.cnt.find("ul:visible").last().children(".vakata-hover").removeClass("vakata-hover").prevAll("li:not(.vakata-separator)").first();
                  if (!o.length) {
                    o = $.vakata.context.cnt.find("ul:visible").last().children("li:not(.vakata-separator)").last();
                  }
                  o.addClass("vakata-hover");
                  e.stopImmediatePropagation();
                  e.preventDefault();
                }
              })
              .bind("keydown", "down", function (e) {
                if ($.vakata.context.vis) {
                  var o = $.vakata.context.cnt.find("ul:visible").last().children(".vakata-hover").removeClass("vakata-hover").nextAll("li:not(.vakata-separator)").first();
                  if (!o.length) {
                    o = $.vakata.context.cnt.find("ul:visible").last().children("li:not(.vakata-separator)").first();
                  }
                  o.addClass("vakata-hover");
                  e.stopImmediatePropagation();
                  e.preventDefault();
                }
              })
              .bind("keydown", "right", function (e) {
                if ($.vakata.context.vis) {
                  $.vakata.context.cnt.find(".vakata-hover").children("ul").show().children("li:not(.vakata-separator)").removeClass("vakata-hover").first().addClass("vakata-hover");
                  e.stopImmediatePropagation();
                  e.preventDefault();
                }
              })
              .bind("keydown", "left", function (e) {
                if ($.vakata.context.vis) {
                  $.vakata.context.cnt.find(".vakata-hover").children("ul").hide().children(".vakata-separator").removeClass("vakata-hover");
                  e.stopImmediatePropagation();
                  e.preventDefault();
                }
              })
              .bind("keydown", "esc", function (e) {
                $.vakata.context.hide();
                e.preventDefault();
              })
              .bind("keydown", "space", function (e) {
                $.vakata.context.cnt.find(".vakata-hover").last().children("a").click();
                e.preventDefault();
              });
    }
  });

  $.jstree.plugin("contextmenu", {
    __init : function () {
      this.get_container()
              .delegate("a", "contextmenu.jstree", $.proxy(function (e) {
        e.preventDefault();
        if (!$(e.currentTarget).hasClass("jstree-loading")) {
          this.show_contextmenu(e.currentTarget, e.pageX, e.pageY);
        }
      }, this))
              .delegate("a", "click.jstree", $.proxy(function (e) {
        if (this.data.contextmenu) {
          $.vakata.context.hide();
        }
      }, this))
              .bind("destroy.jstree", $.proxy(function () {
        // TODO: move this to descruct method
        if (this.data.contextmenu) {
          $.vakata.context.hide();
        }
      }, this));
      $(document).bind("context_hide.vakata", $.proxy(function () {
        this.data.contextmenu = false;
      }, this));
    },
    defaults : {
      select_node : false, // requires UI plugin
      show_at_node : true,
      items : { // Could be a function that should return an object like this one
        "create" : {
          "separator_before"  : false,
          "separator_after"  : true,
          "label"        : "Create",
          "action"      : function (obj) {
            this.create(obj);
          }
        },
        "rename" : {
          "separator_before"  : false,
          "separator_after"  : false,
          "label"        : "Rename",
          "action"      : function (obj) {
            this.rename(obj);
          }
        },
        "remove" : {
          "separator_before"  : false,
          "icon"        : false,
          "separator_after"  : false,
          "label"        : "Delete",
          "action"      : function (obj) {
            if (this.is_selected(obj)) {
              this.remove();
            } else {
              this.remove(obj);
            }
          }
        },
        "ccp" : {
          "separator_before"  : true,
          "icon"        : false,
          "separator_after"  : false,
          "label"        : "Edit",
          "action"      : false,
          "submenu" : {
            "cut" : {
              "separator_before"  : false,
              "separator_after"  : false,
              "label"        : "Cut",
              "action"      : function (obj) {
                this.cut(obj);
              }
            },
            "copy" : {
              "separator_before"  : false,
              "icon"        : false,
              "separator_after"  : false,
              "label"        : "Copy",
              "action"      : function (obj) {
                this.copy(obj);
              }
            },
            "paste" : {
              "separator_before"  : false,
              "icon"        : false,
              "separator_after"  : false,
              "label"        : "Paste",
              "action"      : function (obj) {
                this.paste(obj);
              }
            }
          }
        }
      }
    },
    _fn : {
      show_contextmenu : function (obj, x, y) {
        obj = this._get_node(obj);
        var s = this.get_settings().contextmenu,
                a = obj.children("a:visible:eq(0)"),
                o = false,
                i = false;
        if (s.select_node && this.data.ui && !this.is_selected(obj)) {
          this.deselect_all();
          this.select_node(obj, true);
        }
        if (s.show_at_node || typeof x === "undefined" || typeof y === "undefined") {
          o = a.offset();
          x = o.left;
          y = o.top + this.data.core.li_height;
        }
        i = obj.data("jstree") && obj.data("jstree").contextmenu ? obj.data("jstree").contextmenu : s.items;
        if ($.isFunction(i)) {
          i = i.call(this, obj);
        }
        this.data.contextmenu = true;
        $.vakata.context.show(i, a, x, y, this, obj, this._get_settings().core.rtl);
        if (this.data.themes) {
          $.vakata.context.cnt.attr("class", "jstree-" + this.data.themes.theme + "-context");
        }
      }
    }
  });
})(jQuery);
