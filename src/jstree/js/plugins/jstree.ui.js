/*
 * jsTree ui plugin
 * This plugins handles selecting/deselecting/hovering/dehovering nodes
 */
(function ($) {
  var scrollbar_width, e1, e2;
  $(function() {
    if (/msie/.test(navigator.userAgent.toLowerCase())) {
      e1 = $('<textarea cols="10" rows="2"></textarea>').css({ position: 'absolute', top: -1000, left: 0 }).appendTo('body');
      e2 = $('<textarea cols="10" rows="2" style="overflow: hidden;"></textarea>').css({ position: 'absolute', top: -1000, left: 0 }).appendTo('body');
      scrollbar_width = e1.width() - e2.width();
      e1.add(e2).remove();
    }
    else {
      e1 = $('<div />').css({ width: 100, height: 100, overflow: 'auto', position: 'absolute', top: -1000, left: 0 })
              .prependTo('body').append('<div />').find('div').css({ width: '100%', height: 200 });
      scrollbar_width = 100 - e1.width();
      e1.parent().remove();
    }
  });
  $.jstree.plugin("ui", {
    __init : function () {
      this.data.ui.selected = $();
      this.data.ui.last_selected = false;
      this.data.ui.hovered = null;
      this.data.ui.to_select = this.get_settings().ui.initially_select;

      this.get_container()
              .delegate("a", "click.jstree", $.proxy(function (event) {
        event.preventDefault();
        event.currentTarget.blur();
        if (!$(event.currentTarget).hasClass("jstree-loading")) {
          this.select_node(event.currentTarget, true, event);
        }
      }, this))
              .delegate("a", "mouseenter.jstree", $.proxy(function (event) {
        if (!$(event.currentTarget).hasClass("jstree-loading")) {
          this.hover_node(event.target);
        }
      }, this))
              .delegate("a", "mouseleave.jstree", $.proxy(function (event) {
        if (!$(event.currentTarget).hasClass("jstree-loading")) {
          this.dehover_node(event.target);
        }
      }, this))
              .bind("reopen.jstree", $.proxy(function () {
        this.reselect();
      }, this))
              .bind("get_rollback.jstree", $.proxy(function () {
        this.dehover_node();
        this.save_selected();
      }, this))
              .bind("set_rollback.jstree", $.proxy(function () {
        this.reselect();
      }, this))
              .bind("close_node.jstree", $.proxy(function (event, data) {
        var s = this._get_settings().ui,
                obj = this._get_node(data.rslt.obj),
                clk = (obj && obj.length) ? obj.children("ul").find("a.jstree-clicked") : $(),
                _this = this;
        if (s.selected_parent_close === false || !clk.length) {
          return;
        }
        clk.each(function () {
          _this.deselect_node(this);
          if (s.selected_parent_close === "select_parent") {
            _this.select_node(obj);
          }
        });
      }, this))
              .bind("delete_node.jstree", $.proxy(function (event, data) {
        var s = this._get_settings().ui.select_prev_on_delete,
                obj = this._get_node(data.rslt.obj),
                clk = (obj && obj.length) ? obj.find("a.jstree-clicked") : [],
                _this = this;
        clk.each(function () {
          _this.deselect_node(this);
        });
        if (s && clk.length) {
          data.rslt.prev.each(function () {
            if (this.parentNode) {
              _this.select_node(this);
              return false;
              /* if return false is removed all prev nodes will be selected */
            }
          });
        }
      }, this))
              .bind("move_node.jstree", $.proxy(function (event, data) {
        if (data.rslt.cy) {
          data.rslt.oc.find("a.jstree-clicked").removeClass("jstree-clicked");
        }
      }, this));
    },
    defaults : {
      select_limit : -1, // 0, 1, 2 ... or -1 for unlimited
      select_multiple_modifier : "ctrl", // on, or ctrl, shift, alt
      select_range_modifier : "shift",
      selected_parent_close : "select_parent", // false, "deselect", "select_parent"
      selected_parent_open : true,
      select_prev_on_delete : true,
      disable_selecting_children : false,
      initially_select : []
    },
    _fn : {
      _get_node : function (obj, allow_multiple) {
        if (typeof obj === "undefined" || obj === null) {
          return allow_multiple ? this.data.ui.selected : this.data.ui.last_selected;
        }
        var $obj = $(obj, this.get_container());
        if ($obj.is(".jstree") || obj == -1) {
          return -1;
        }
        $obj = $obj.closest("li", this.get_container());
        return $obj.length ? $obj : false;
      },
      _ui_notify : function (n, data) {
        if (data.selected) {
          this.select_node(n, false);
        }
      },
      save_selected : function () {
        var _this = this;
        this.data.ui.to_select = [];
        this.data.ui.selected.each(function () {
          if (this.id) {
            _this.data.ui.to_select.push("#" + this.id.toString().replace(/^#/, "").replace(/\\\//g, "/").replace(/\//g, "\\\/").replace(/\\\./g, ".").replace(/\./g, "\\.").replace(/\:/g, "\\:"));
          }
        });
        this.__callback(this.data.ui.to_select);
      },
      reselect : function () {
        var _this = this,
                s = this.data.ui.to_select;
        s = $.map($.makeArray(s), function (n) {
          return "#" + n.toString().replace(/^#/, "").replace(/\\\//g, "/").replace(/\//g, "\\\/").replace(/\\\./g, ".").replace(/\./g, "\\.").replace(/\:/g, "\\:");
        });
        // this.deselect_all(); WHY deselect, breaks plugin state notifier?
        $.each(s, function (i, val) {
          if (val && val !== "#") {
            _this.select_node(val);
          }
        });
        this.data.ui.selected = this.data.ui.selected.filter(function () {
          return this.parentNode;
        });
        this.__callback();
      },
      refresh : function (obj) {
        this.save_selected();
        return this.__call_old();
      },
      hover_node : function (obj) {
        obj = this._get_node(obj);
        if (!obj.length) {
          return false;
        }
        //if(this.data.ui.hovered && obj.get(0) === this.data.ui.hovered.get(0)) { return; }
        if (!obj.hasClass("jstree-hovered")) {
          this.dehover_node();
        }
        this.data.ui.hovered = obj.children("a").addClass("jstree-hovered").parent();
        this._fix_scroll(obj);
        this.__callback({ "obj" : obj });
      },
      dehover_node : function () {
        var obj = this.data.ui.hovered, p;
        if (!obj || !obj.length) {
          return false;
        }
        p = obj.children("a").removeClass("jstree-hovered").parent();
        if (this.data.ui.hovered[0] === p[0]) {
          this.data.ui.hovered = null;
        }
        this.__callback({ "obj" : obj });
      },
      select_node : function (obj, check, e) {
        obj = this._get_node(obj);
        if (obj == -1 || !obj || !obj.length) {
          return false;
        }
        var s = this._get_settings().ui,
                is_multiple = (s.select_multiple_modifier == "on" || (s.select_multiple_modifier !== false && e && e[s.select_multiple_modifier + "Key"])),
                is_range = (s.select_range_modifier !== false && e && e[s.select_range_modifier + "Key"] && this.data.ui.last_selected && this.data.ui.last_selected[0] !== obj[0] && this.data.ui.last_selected.parent()[0] === obj.parent()[0]),
                is_selected = this.is_selected(obj),
                proceed = true,
                t = this;
        if (check) {
          if (s.disable_selecting_children && is_multiple &&
                  (
                          (obj.parentsUntil(".jstree", "li").children("a.jstree-clicked").length) ||
                                  (obj.children("ul").find("a.jstree-clicked:eq(0)").length)
                          )
                  ) {
            return false;
          }
          proceed = false;
          switch (!0) {
            case (is_range):
              this.data.ui.last_selected.addClass("jstree-last-selected");
              obj = obj[ obj.index() < this.data.ui.last_selected.index() ? "nextUntil" : "prevUntil" ](".jstree-last-selected").andSelf();
              if (s.select_limit == -1 || obj.length < s.select_limit) {
                this.data.ui.last_selected.removeClass("jstree-last-selected");
                this.data.ui.selected.each(function () {
                  if (this !== t.data.ui.last_selected[0]) {
                    t.deselect_node(this);
                  }
                });
                is_selected = false;
                proceed = true;
              }
              else {
                proceed = false;
              }
              break;
            case (is_selected && !is_multiple):
              this.deselect_all();
              is_selected = false;
              proceed = true;
              break;
            case (!is_selected && !is_multiple):
              if (s.select_limit == -1 || s.select_limit > 0) {
                this.deselect_all();
                proceed = true;
              }
              break;
            case (is_selected && is_multiple):
              this.deselect_node(obj);
              break;
            case (!is_selected && is_multiple):
              if (s.select_limit == -1 || this.data.ui.selected.length + 1 <= s.select_limit) {
                proceed = true;
              }
              break;
          }
        }
        if (proceed && !is_selected) {
          if (!is_range) {
            this.data.ui.last_selected = obj;
          }
          obj.children("a").addClass("jstree-clicked");
          if (s.selected_parent_open) {
            obj.parents(".jstree-closed").each(function () {
              t.open_node(this, false, true);
            });
          }
          this.data.ui.selected = this.data.ui.selected.add(obj);
          this._fix_scroll(obj.eq(0));
          this.__callback({ "obj" : obj, "e" : e });
        }
      },
      _fix_scroll : function (obj) {
        var c = this.get_container()[0], t;
        if (c.scrollHeight > c.offsetHeight) {
          obj = this._get_node(obj);
          if (!obj || obj === -1 || !obj.length || !obj.is(":visible")) {
            return;
          }
          t = obj.offset().top - this.get_container().offset().top;
          if (t < 0) {
            c.scrollTop = c.scrollTop + t - 1;
          }
          if (t + this.data.core.li_height + (c.scrollWidth > c.offsetWidth ? scrollbar_width : 0) > c.offsetHeight) {
            c.scrollTop = c.scrollTop + (t - c.offsetHeight + this.data.core.li_height + 1 + (c.scrollWidth > c.offsetWidth ? scrollbar_width : 0));
          }
        }
      },
      deselect_node : function (obj) {
        obj = this._get_node(obj);
        if (!obj.length) {
          return false;
        }
        if (this.is_selected(obj)) {
          obj.children("a").removeClass("jstree-clicked");
          this.data.ui.selected = this.data.ui.selected.not(obj);
          if (this.data.ui.last_selected.get(0) === obj.get(0)) {
            this.data.ui.last_selected = this.data.ui.selected.eq(0);
          }
          this.__callback({ "obj" : obj });
        }
      },
      toggle_select : function (obj) {
        obj = this._get_node(obj);
        if (!obj.length) {
          return false;
        }
        if (this.is_selected(obj)) {
          this.deselect_node(obj);
        }
        else {
          this.select_node(obj);
        }
      },
      is_selected : function (obj) {
        return this.data.ui.selected.index(this._get_node(obj)) >= 0;
      },
      get_selected : function (context) {
        return context ? $(context).find("a.jstree-clicked").parent() : this.data.ui.selected;
      },
      deselect_all : function (context) {
        var ret = context ? $(context).find("a.jstree-clicked").parent() : this.get_container().find("a.jstree-clicked").parent();
        ret.children("a.jstree-clicked").removeClass("jstree-clicked");
        this.data.ui.selected = $([]);
        this.data.ui.last_selected = false;
        this.__callback({ "obj" : ret });
      }
    }
  });
  // include the selection plugin by default
  $.jstree.defaults.plugins.push("ui");
})(jQuery);
