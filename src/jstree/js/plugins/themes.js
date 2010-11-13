/* 
 * jsTree themes plugin
 * Handles loading and setting themes, as well as detecting path to themes, etc.
 */
(function ($) {
  var themes_loaded = [];
  // this variable stores the path to the themes folder - if left as false - it will be autodetected
  $.jstree._themes = false;
  $.jstree.plugin("themes", {
    __init : function () { 
      this.get_container()
        .bind("init.jstree", $.proxy(function () {
            var s = this._get_settings().themes;
            this.data.themes.dots = s.dots; 
            this.data.themes.icons = s.icons; 
            this.set_theme(s.theme, s.url);
          }, this))
        .bind("loaded.jstree", $.proxy(function () {
            // bound here too, as simple HTML tree's won't honor dots & icons otherwise
            if(!this.data.themes.dots) { this.hide_dots(); }
            else { this.show_dots(); }
            if(!this.data.themes.icons) { this.hide_icons(); }
            else { this.show_icons(); }
          }, this));
    },
    defaults : { 
      theme : "default", 
      url : false,
      dots : true,
      icons : true
    },
    _fn : {
      set_theme : function (theme_name, theme_url) {
        if(!theme_name) { return false; }
        if(!theme_url) { theme_url = $.jstree._themes + theme_name + '.css'; }
        if($.inArray(theme_url, themes_loaded) == -1) {
          $.vakata.css.add_sheet({ "url" : theme_url });
          themes_loaded.push(theme_url);
        }
        if(this.data.themes.theme != theme_name) {
          this.get_container().removeClass('jstree-' + this.data.themes.theme);
          this.data.themes.theme = theme_name;
        }
        this.get_container().addClass('jstree-' + theme_name);
        if(!this.data.themes.dots) { this.hide_dots(); }
        else { this.show_dots(); }
        if(!this.data.themes.icons) { this.hide_icons(); }
        else { this.show_icons(); }
        this.__callback();
      },
      get_theme	: function () { return this.data.themes.theme; },

      show_dots	: function () { this.data.themes.dots = true; this.get_container().children("ul").removeClass("jstree-no-dots"); },
      hide_dots	: function () { this.data.themes.dots = false; this.get_container().children("ul").addClass("jstree-no-dots"); },
      toggle_dots	: function () { if(this.data.themes.dots) { this.hide_dots(); } else { this.show_dots(); } },

      show_icons	: function () { this.data.themes.icons = true; this.get_container().children("ul").removeClass("jstree-no-icons"); },
      hide_icons	: function () { this.data.themes.icons = false; this.get_container().children("ul").addClass("jstree-no-icons"); },
      toggle_icons: function () { if(this.data.themes.icons) { this.hide_icons(); } else { this.show_icons(); } }
    }
  });
  // autodetect themes path
  $(function () {
    //  if($.jstree._themes === false) {
    //    $("script").each(function () { 
    //      if(this.src.toString().match(/jquery\.jstree[^\/]*?\.js(\?.*)?$/)) { 
    //        $.jstree._themes = this.src.toString().replace(/jquery\.jstree[^\/]*?\.js(\?.*)?$/, "") + 'themes/'; 
    //        return false; 
    //      }
    //    });
    //  }
    //  if($.jstree._themes === false) { $.jstree._themes = "themes/"; }
    if($.jstree._themes === false) { $.jstree._themes = "/stylesheets/compiled/jquery/jstree/"; }
  });
  // include the themes plugin by default
  $.jstree.defaults.plugins.push("themes");
})(jQuery);
//*/

