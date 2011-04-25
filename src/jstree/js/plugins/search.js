/*
 * jsTree search plugin
 * Enables both sync and async search on the tree
 * DOES NOT WORK WITH JSON PROGRESSIVE RENDER
 */
(function ($) {
  $.expr[':'].jstree_contains = function(a, i, m) {
    return (a.textContent || a.innerText || "").toLowerCase().indexOf(m[3].toLowerCase()) >= 0;
  };
  $.expr[':'].jstree_title_contains = function(a, i, m) {
    return (a.getAttribute("title") || "").toLowerCase().indexOf(m[3].toLowerCase()) >= 0;
  };
  $.jstree.plugin("search", {
    __init : function () {
      this.data.search.str = "";
      this.data.search.result = $();
      if (this._get_settings().search.show_only_matches) {
        this.get_container()
                .bind("search.jstree", function (e, data) {
          $(this).children("ul").find("li").hide().removeClass("jstree-last");
          data.rslt.nodes.parentsUntil(".jstree").andSelf().show()
                  .filter("ul").each(function () {
            $(this).children("li:visible").eq(-1).addClass("jstree-last");
          });
        })
                .bind("clear_search.jstree", function () {
          $(this).children("ul").find("li").css("display", "").end().jstree("clean_node", -1);
        });
      }
    },
    defaults : {
      ajax : false,
      search_method : "jstree_contains", // for case insensitive - jstree_contains
      show_only_matches : false
    },
    _fn : {
      search : function (str, skip_async) {
        if ($.trim(str) === "") {
          this.clear_search();
          return;
        }
        var s = this.get_settings().search,
                t = this,
                error_func = function () {
                },
                success_func = function () {
                };
        this.data.search.str = str;

        if (!skip_async && s.ajax !== false && this.get_container_ul().find("li.jstree-closed:not(:has(ul)):eq(0)").length > 0) {
          this.search.supress_callback = true;
          error_func = function () {
          };
          success_func = function (d, t, x) {
            var sf = this.get_settings().search.ajax.success;
            if (sf) {
              d = sf.call(this, d, t, x) || d;
            }
            this.data.search.to_open = d;
            this._search_open();
          };
          s.ajax.context = this;
          s.ajax.error = error_func;
          s.ajax.success = success_func;
          if ($.isFunction(s.ajax.url)) {
            s.ajax.url = s.ajax.url.call(this, str);
          }
          if ($.isFunction(s.ajax.data)) {
            s.ajax.data = s.ajax.data.call(this, str);
          }
          if (!s.ajax.data) {
            s.ajax.data = { "search_string" : str };
          }
          if (!s.ajax.dataType || /^json/.exec(s.ajax.dataType)) {
            s.ajax.dataType = "json";
          }
          $.ajax(s.ajax);
          return;
        }
        if (this.data.search.result.length) {
          this.clear_search();
        }
        this.data.search.result = this.get_container().find("a" + (this.data.languages ? "." + this.get_lang() : "" ) + ":" + (s.search_method) + "(" + this.data.search.str + ")");
        this.data.search.result.addClass("jstree-search").parent().parents(".jstree-closed").each(function () {
          t.open_node(this, false, true);
        });
        this.__callback({ nodes : this.data.search.result, str : str });
      },
      clear_search : function (str) {
        this.data.search.result.removeClass("jstree-search");
        this.__callback(this.data.search.result);
        this.data.search.result = $();
      },
      _search_open : function (is_callback) {
        var _this = this,
                done = true,
                current = [],
                remaining = [];
        if (this.data.search.to_open.length) {
          $.each(this.data.search.to_open, function (i, val) {
            if (val == "#") {
              return true;
            }
            if ($(val).length && $(val).is(".jstree-closed")) {
              current.push(val);
            }
            else {
              remaining.push(val);
            }
          });
          if (current.length) {
            this.data.search.to_open = remaining;
            $.each(current, function (i, val) {
              _this.open_node(val, function () {
                _this._search_open(true);
              });
            });
            done = false;
          }
        }
        if (done) {
          this.search(this.data.search.str, true);
        }
      }
    }
  });
})(jQuery);

