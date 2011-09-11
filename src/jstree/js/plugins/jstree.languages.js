/*
 * jsTree languages plugin
 * Adds support for multiple language versions in one tree
 * This basically allows for many titles coexisting in one node, but only one of them being visible at any given time
 * This is useful for maintaining the same structure in many languages (hence the name of the plugin)
 */
(function ($) {
  $.jstree.plugin("languages", {
    __init : function () {
      this._load_css();
    },
    defaults : [],
    _fn : {
      set_lang : function (i) {
        var langs = this._get_settings().languages,
                st = false,
                selector = ".jstree-" + this.get_index() + ' a';
        if (!$.isArray(langs) || langs.length === 0) {
          return false;
        }
        if ($.inArray(i, langs) == -1) {
          if (!!langs[i]) {
            i = langs[i];
          }
          else {
            return false;
          }
        }
        if (i == this.data.languages.current_language) {
          return true;
        }
        st = $.vakata.css.get_css(selector + "." + this.data.languages.current_language, false, this.data.languages.language_css);
        if (st !== false) {
          st.style.display = "none";
        }
        st = $.vakata.css.get_css(selector + "." + i, false, this.data.languages.language_css);
        if (st !== false) {
          st.style.display = "";
        }
        this.data.languages.current_language = i;
        this.__callback(i);
        return true;
      },
      get_lang : function () {
        return this.data.languages.current_language;
      },
      _get_string : function (key, lang) {
        var langs = this._get_settings().languages,
                s = this._get_settings().core.strings;
        if ($.isArray(langs) && langs.length) {
          lang = (lang && $.inArray(lang, langs) != -1) ? lang : this.data.languages.current_language;
        }
        if (s[lang] && s[lang][key]) {
          return s[lang][key];
        }
        if (s[key]) {
          return s[key];
        }
        return key;
      },
      get_text : function (obj, lang) {
        obj = this._get_node(obj) || this.data.ui.last_selected;
        if (!obj.size()) {
          return false;
        }
        var langs = this._get_settings().languages,
                s = this._get_settings().core.html_titles;
        if ($.isArray(langs) && langs.length) {
          lang = (lang && $.inArray(lang, langs) != -1) ? lang : this.data.languages.current_language;
          obj = obj.children("a." + lang);
        }
        else {
          obj = obj.children("a:eq(0)");
        }
        if (s) {
          obj = obj.clone();
          obj.children("INS").remove();
          return obj.html();
        }
        else {
          obj = obj.contents().filter(function() {
            return this.nodeType == 3;
          })[0];
          return obj.nodeValue;
        }
      },
      set_text : function (obj, val, lang) {
        obj = this._get_node(obj) || this.data.ui.last_selected;
        if (!obj.size()) {
          return false;
        }
        var langs = this._get_settings().languages,
                s = this._get_settings().core.html_titles,
                tmp;
        if ($.isArray(langs) && langs.length) {
          lang = (lang && $.inArray(lang, langs) != -1) ? lang : this.data.languages.current_language;
          obj = obj.children("a." + lang);
        }
        else {
          obj = obj.children("a:eq(0)");
        }
        if (s) {
          tmp = obj.children("INS").clone();
          obj.html(val).prepend(tmp);
          this.__callback({ "obj" : obj, "name" : val, "lang" : lang });
          return true;
        }
        else {
          obj = obj.contents().filter(function() {
            return this.nodeType == 3;
          })[0];
          this.__callback({ "obj" : obj, "name" : val, "lang" : lang });
          return (obj.nodeValue = val);
        }
      },
      _load_css : function () {
        var langs = this._get_settings().languages,
                str = "/* languages css */",
                selector = ".jstree-" + this.get_index() + ' a',
                ln;
        if ($.isArray(langs) && langs.length) {
          this.data.languages.current_language = langs[0];
          for (ln = 0; ln < langs.length; ln++) {
            str += selector + "." + langs[ln] + " {";
            if (langs[ln] != this.data.languages.current_language) {
              str += " display:none; ";
            }
            str += " } ";
          }
          this.data.languages.language_css = $.vakata.css.add_sheet({ 'str' : str, 'title' : "jstree-languages" });
        }
      },
      create_node : function (obj, position, js, callback) {
        var t = this.__call_old(true, obj, position, js, function (t) {
          var langs = this._get_settings().languages,
                  a = t.children("a"),
                  ln;
          if ($.isArray(langs) && langs.length) {
            for (ln = 0; ln < langs.length; ln++) {
              if (!a.is("." + langs[ln])) {
                t.append(a.eq(0).clone().removeClass(langs.join(" ")).addClass(langs[ln]));
              }
            }
            a.not("." + langs.join(", .")).remove();
          }
          if (callback) {
            callback.call(this, t);
          }
        });
        return t;
      }
    }
  });
})(jQuery);
