/*
 * jsTree cookies plugin
 * Stores the currently opened/selected nodes in a cookie and then restores them
 * Depends on the jquery.cookie plugin
 */
(function ($) {
  $.jstree.plugin("cookies", {
    __init : function () {
      if (typeof $.cookie === "undefined") {
        throw "jsTree cookie: jQuery cookie plugin not included.";
      }

      var s = this._get_settings().cookies,
              tmp;
      if (!!s.save_loaded) {
        tmp = $.cookie(s.save_loaded);
        if (tmp && tmp.length) {
          this.data.core.to_load = tmp.split(",");
        }
      }
      if (!!s.save_opened) {
        tmp = $.cookie(s.save_opened);
        if (tmp && tmp.length) {
          this.data.core.to_open = tmp.split(",");
        }
      }
      if (!!s.save_selected) {
        tmp = $.cookie(s.save_selected);
        if (tmp && tmp.length && this.data.ui) {
          this.data.ui.to_select = tmp.split(",");
        }
      }
      this.get_container()
              .one(( this.data.ui ? "reselect" : "reopen" ) + ".jstree", $.proxy(function () {
        this.get_container()
                .bind("open_node.jstree close_node.jstree select_node.jstree deselect_node.jstree", $.proxy(function (e) {
          if (this._get_settings().cookies.auto_save) {
            this.save_cookie((e.handleObj.namespace + e.handleObj.type).replace("jstree", ""));
          }
        }, this));
      }, this));
    },
    defaults : {
      save_loaded    : "jstree_load",
      save_opened    : "jstree_open",
      save_selected  : "jstree_select",
      auto_save    : true,
      cookie_options  : {}
    },
    _fn : {
      save_cookie : function (c) {
        if (this.data.core.refreshing) {
          return;
        }
        var s = this._get_settings().cookies;
        if (!c) { // if called manually and not by event
          if (s.save_loaded) {
            this.save_loaded();
            $.cookie(s.save_loaded, this.data.core.to_load.join(","), s.cookie_options);
          }
          if (s.save_opened) {
            this.save_opened();
            $.cookie(s.save_opened, this.data.core.to_open.join(","), s.cookie_options);
          }
          if (s.save_selected && this.data.ui) {
            this.save_selected();
            $.cookie(s.save_selected, this.data.ui.to_select.join(","), s.cookie_options);
          }
          return;
        }
        switch (c) {
          case "open_node":
          case "close_node":
            if (!!s.save_opened) {
              this.save_opened();
              $.cookie(s.save_opened, this.data.core.to_open.join(","), s.cookie_options);
            }
            if (!!s.save_loaded) {
              this.save_loaded();
              $.cookie(s.save_loaded, this.data.core.to_load.join(","), s.cookie_options);
            }
            break;
          case "select_node":
          case "deselect_node":
            if (!!s.save_selected && this.data.ui) {
              this.save_selected();
              $.cookie(s.save_selected, this.data.ui.to_select.join(","), s.cookie_options);
            }
            break;
        }
      }
    }
  });
  // include cookies by default
  // $.jstree.defaults.plugins.push("cookies");
})(jQuery);
