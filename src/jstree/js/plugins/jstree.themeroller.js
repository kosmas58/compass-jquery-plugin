/*
 * jsTree themeroller plugin
 * Adds support for jQuery UI themes. Include this at the end of your plugins list, also make sure "themes" is not included.
 */
(function ($) {
  $.jstree.plugin("themeroller", {
    __init : function () {
      var s = this._get_settings().themeroller;
      this.get_container()
              .addClass("ui-widget-content")
              .addClass("jstree-themeroller")
              .delegate("a", "mouseenter.jstree", function (e) {
                if (!$(e.currentTarget).hasClass("jstree-loading")) {
                  $(this).addClass(s.item_h);
                }
              })
              .delegate("a", "mouseleave.jstree", function () {
                $(this).removeClass(s.item_h);
              })
              .bind("init.jstree", $.proxy(function (e, data) {
        data.inst.get_container().find("> ul > li > .jstree-loading > ins").addClass("ui-icon-refresh");
        this._themeroller(data.inst.get_container().find("> ul > li"));
      }, this))
              .bind("open_node.jstree create_node.jstree", $.proxy(function (e, data) {
        this._themeroller(data.rslt.obj);
      }, this))
              .bind("loaded.jstree refresh.jstree", $.proxy(function (e) {
        this._themeroller();
      }, this))
              .bind("close_node.jstree", $.proxy(function (e, data) {
        this._themeroller(data.rslt.obj);
      }, this))
              .bind("delete_node.jstree", $.proxy(function (e, data) {
        this._themeroller(data.rslt.parent);
      }, this))
              .bind("correct_state.jstree", $.proxy(function (e, data) {
        data.rslt.obj
                .children("ins.jstree-icon").removeClass(s.opened + " " + s.closed + " ui-icon").end()
                .find("> a > ins.ui-icon")
                .filter(
                function() {
                  return this.className.toString()
                          .replace(s.item_clsd, "").replace(s.item_open, "").replace(s.item_leaf, "")
                          .indexOf("ui-icon-") === -1;
                }).removeClass(s.item_open + " " + s.item_clsd).addClass(s.item_leaf || "jstree-no-icon");
      }, this))
              .bind("select_node.jstree", $.proxy(function (e, data) {
        data.rslt.obj.children("a").addClass(s.item_a);
      }, this))
              .bind("deselect_node.jstree deselect_all.jstree", $.proxy(function (e, data) {
        this.get_container()
                .find("a." + s.item_a).removeClass(s.item_a).end()
                .find("a.jstree-clicked").addClass(s.item_a);
      }, this))
              .bind("dehover_node.jstree", $.proxy(function (e, data) {
        data.rslt.obj.children("a").removeClass(s.item_h);
      }, this))
              .bind("hover_node.jstree", $.proxy(function (e, data) {
        this.get_container()
                .find("a." + s.item_h).not(data.rslt.obj).removeClass(s.item_h);
        data.rslt.obj.children("a").addClass(s.item_h);
      }, this))
              .bind("move_node.jstree", $.proxy(function (e, data) {
        this._themeroller(data.rslt.o);
        this._themeroller(data.rslt.op);
      }, this));
    },
    __destroy : function () {
      var s = this._get_settings().themeroller,
              c = [ "ui-icon" ];
      $.each(s, function (i, v) {
        v = v.split(" ");
        if (v.length) {
          c = c.concat(v);
        }
      });
      this.get_container()
              .removeClass("ui-widget-content")
              .find("." + c.join(", .")).removeClass(c.join(" "));
    },
    _fn : {
      _themeroller : function (obj) {
        var s = this._get_settings().themeroller;
        obj = !obj || obj == -1 ? this.get_container_ul() : this._get_node(obj).parent();
        obj
                .find("li.jstree-closed")
                .children("ins.jstree-icon").removeClass(s.opened).addClass("ui-icon " + s.closed).end()
                .children("a").addClass(s.item)
                .children("ins.jstree-icon").addClass("ui-icon")
                .filter(
                function() {
                  return this.className.toString()
                          .replace(s.item_clsd, "").replace(s.item_open, "").replace(s.item_leaf, "")
                          .indexOf("ui-icon-") === -1;
                }).removeClass(s.item_leaf + " " + s.item_open).addClass(s.item_clsd || "jstree-no-icon")
                .end()
                .end()
                .end()
                .end()
                .find("li.jstree-open")
                .children("ins.jstree-icon").removeClass(s.closed).addClass("ui-icon " + s.opened).end()
                .children("a").addClass(s.item)
                .children("ins.jstree-icon").addClass("ui-icon")
                .filter(
                function() {
                  return this.className.toString()
                          .replace(s.item_clsd, "").replace(s.item_open, "").replace(s.item_leaf, "")
                          .indexOf("ui-icon-") === -1;
                }).removeClass(s.item_leaf + " " + s.item_clsd).addClass(s.item_open || "jstree-no-icon")
                .end()
                .end()
                .end()
                .end()
                .find("li.jstree-leaf")
                .children("ins.jstree-icon").removeClass(s.closed + " ui-icon " + s.opened).end()
                .children("a").addClass(s.item)
                .children("ins.jstree-icon").addClass("ui-icon")
                .filter(
                function() {
                  return this.className.toString()
                          .replace(s.item_clsd, "").replace(s.item_open, "").replace(s.item_leaf, "")
                          .indexOf("ui-icon-") === -1;
                }).removeClass(s.item_clsd + " " + s.item_open).addClass(s.item_leaf || "jstree-no-icon");
      }
    },
    defaults : {
      "opened"  : "ui-icon-triangle-1-se",
      "closed"  : "ui-icon-triangle-1-e",
      "item"    : "ui-state-default",
      "item_h"  : "ui-state-hover",
      "item_a"  : "ui-state-active",
      "item_open"  : "ui-icon-folder-open",
      "item_clsd"  : "ui-icon-folder-collapsed",
      "item_leaf"  : "ui-icon-document"
    }
  });
  $(function() {
    var css_string = '' +
            '.jstree-themeroller .ui-icon { overflow:visible; } ' +
            '.jstree-themeroller a { padding:0 2px; } ' +
            '.jstree-themeroller .jstree-no-icon { display:none; }';
    $.vakata.css.add_sheet({ str : css_string, title : "jstree" });
  });
})(jQuery);
