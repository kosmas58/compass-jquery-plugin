/* 
 * jsTree HTML plugin
 * The HTML data store. Datastores are build by replacing the `load_node` and `_is_loaded` functions.
 */
(function ($) {
    $.jstree.plugin("html_data", {
        __init : function () {
            // this used to use html() and clean the whitespace, but this way any attached data was lost
            this.data.html_data.original_container_html = this.get_container().find(" > ul > li").clone(true);
            // remove white space from LI node - otherwise nodes appear a bit to the right
            this.data.html_data.original_container_html.find("li").andSelf().contents().filter(
                                                                                              function() {
                                                                                                  return this.nodeType == 3;
                                                                                              }).remove();
        },
        defaults : {
            data : false,
            ajax : false,
            correct_state : true
        },
        _fn : {
            load_node : function (obj, s_call, e_call) {
                var _this = this;
                this.load_node_html(obj, function () {
                    _this.__callback({ "obj" : _this._get_node(obj) });
                    s_call.call(this);
                }, e_call);
            },
            _is_loaded : function (obj) {
                obj = this._get_node(obj);
                return obj == -1 || !obj || (!this._get_settings().html_data.ajax && !$.isFunction(this._get_settings().html_data.data)) || obj.is(".jstree-open, .jstree-leaf") || obj.children("ul").children("li").size() > 0;
            },
            load_node_html : function (obj, s_call, e_call) {
                var d,
                        s = this.get_settings().html_data,
                        error_func = function () {
                        },
                        success_func = function () {
                        };
                obj = this._get_node(obj);
                if (obj && obj !== -1) {
                    if (obj.data("jstree-is-loading")) {
                        return;
                    }
                    else {
                        obj.data("jstree-is-loading", true);
                    }
                }
                switch (!0) {
                    case ($.isFunction(s.data)):
                        s.data.call(this, obj, $.proxy(function (d) {
                            if (d && d !== "" && d.toString && d.toString().replace(/^[\s\n]+$/, "") !== "") {
                                d = $(d);
                                if (!d.is("ul")) {
                                    d = $("<ul />").append(d);
                                }
                                if (obj == -1 || !obj) {
                                    this.get_container().children("ul").empty().append(d.children()).find("li, a").filter(
                                                                                                                         function () {
                                                                                                                             return !this.firstChild || !this.firstChild.tagName || this.firstChild.tagName !== "INS";
                                                                                                                         }).prepend("<ins class='jstree-icon'>&#160;</ins>").end().filter("a").children("ins:first-child").not(".jstree-icon").addClass("jstree-icon");
                                }
                                else {
                                    obj.children("a.jstree-loading").removeClass("jstree-loading");
                                    obj.append(d).children("ul").find("li, a").filter(
                                                                                     function () {
                                                                                         return !this.firstChild || !this.firstChild.tagName || this.firstChild.tagName !== "INS";
                                                                                     }).prepend("<ins class='jstree-icon'>&#160;</ins>").end().filter("a").children("ins:first-child").not(".jstree-icon").addClass("jstree-icon");
                                    obj.removeData("jstree-is-loading");
                                }
                                this.clean_node(obj);
                                if (s_call) {
                                    s_call.call(this);
                                }
                            }
                            else {
                                if (obj && obj !== -1) {
                                    obj.children("a.jstree-loading").removeClass("jstree-loading");
                                    obj.removeData("jstree-is-loading");
                                    if (s.correct_state) {
                                        this.correct_state(obj);
                                        if (s_call) {
                                            s_call.call(this);
                                        }
                                    }
                                }
                                else {
                                    if (s.correct_state) {
                                        this.get_container().children("ul").empty();
                                        if (s_call) {
                                            s_call.call(this);
                                        }
                                    }
                                }
                            }
                        }, this));
                        break;
                    case (!s.data && !s.ajax):
                        if (!obj || obj == -1) {
                            this.get_container()
                                    .children("ul").empty()
                                    .append(this.data.html_data.original_container_html)
                                    .find("li, a").filter(
                                                         function () {
                                                             return !this.firstChild || !this.firstChild.tagName || this.firstChild.tagName !== "INS";
                                                         }).prepend("<ins class='jstree-icon'>&#160;</ins>").end()
                                    .filter("a").children("ins:first-child").not(".jstree-icon").addClass("jstree-icon");
                            this.clean_node();
                        }
                        if (s_call) {
                            s_call.call(this);
                        }
                        break;
                    case (!!s.data && !s.ajax) || (!!s.data && !!s.ajax && (!obj || obj === -1)):
                        if (!obj || obj == -1) {
                            d = $(s.data);
                            if (!d.is("ul")) {
                                d = $("<ul />").append(d);
                            }
                            this.get_container()
                                    .children("ul").empty().append(d.children())
                                    .find("li, a").filter(
                                                         function () {
                                                             return !this.firstChild || !this.firstChild.tagName || this.firstChild.tagName !== "INS";
                                                         }).prepend("<ins class='jstree-icon'>&#160;</ins>").end()
                                    .filter("a").children("ins:first-child").not(".jstree-icon").addClass("jstree-icon");
                            this.clean_node();
                        }
                        if (s_call) {
                            s_call.call(this);
                        }
                        break;
                    case (!s.data && !!s.ajax) || (!!s.data && !!s.ajax && obj && obj !== -1):
                        obj = this._get_node(obj);
                        error_func = function (x, t, e) {
                            var ef = this.get_settings().html_data.ajax.error;
                            if (ef) {
                                ef.call(this, x, t, e);
                            }
                            if (obj != -1 && obj.length) {
                                obj.children("a.jstree-loading").removeClass("jstree-loading");
                                obj.removeData("jstree-is-loading");
                                if (t === "success" && s.correct_state) {
                                    this.correct_state(obj);
                                }
                            }
                            else {
                                if (t === "success" && s.correct_state) {
                                    this.get_container().children("ul").empty();
                                }
                            }
                            if (e_call) {
                                e_call.call(this);
                            }
                        };
                        success_func = function (d, t, x) {
                            var sf = this.get_settings().html_data.ajax.success;
                            if (sf) {
                                d = sf.call(this, d, t, x) || d;
                            }
                            if (d === "" || (d && d.toString && d.toString().replace(/^[\s\n]+$/, "") === "")) {
                                return error_func.call(this, x, t, "");
                            }
                            if (d) {
                                d = $(d);
                                if (!d.is("ul")) {
                                    d = $("<ul />").append(d);
                                }
                                if (obj == -1 || !obj) {
                                    this.get_container().children("ul").empty().append(d.children()).find("li, a").filter(
                                                                                                                         function () {
                                                                                                                             return !this.firstChild || !this.firstChild.tagName || this.firstChild.tagName !== "INS";
                                                                                                                         }).prepend("<ins class='jstree-icon'>&#160;</ins>").end().filter("a").children("ins:first-child").not(".jstree-icon").addClass("jstree-icon");
                                }
                                else {
                                    obj.children("a.jstree-loading").removeClass("jstree-loading");
                                    obj.append(d).children("ul").find("li, a").filter(
                                                                                     function () {
                                                                                         return !this.firstChild || !this.firstChild.tagName || this.firstChild.tagName !== "INS";
                                                                                     }).prepend("<ins class='jstree-icon'>&#160;</ins>").end().filter("a").children("ins:first-child").not(".jstree-icon").addClass("jstree-icon");
                                    obj.removeData("jstree-is-loading");
                                }
                                this.clean_node(obj);
                                if (s_call) {
                                    s_call.call(this);
                                }
                            }
                            else {
                                if (obj && obj !== -1) {
                                    obj.children("a.jstree-loading").removeClass("jstree-loading");
                                    obj.removeData("jstree-is-loading");
                                    if (s.correct_state) {
                                        this.correct_state(obj);
                                        if (s_call) {
                                            s_call.call(this);
                                        }
                                    }
                                }
                                else {
                                    if (s.correct_state) {
                                        this.get_container().children("ul").empty();
                                        if (s_call) {
                                            s_call.call(this);
                                        }
                                    }
                                }
                            }
                        };
                        s.ajax.context = this;
                        s.ajax.error = error_func;
                        s.ajax.success = success_func;
                        if (!s.ajax.dataType) {
                            s.ajax.dataType = "html";
                        }
                        if ($.isFunction(s.ajax.url)) {
                            s.ajax.url = s.ajax.url.call(this, obj);
                        }
                        if ($.isFunction(s.ajax.data)) {
                            s.ajax.data = s.ajax.data.call(this, obj);
                        }
                        $.ajax(s.ajax);
                        break;
                }
            }
        }
    });
    // include the HTML data plugin by default
    $.jstree.defaults.plugins.push("html_data");
})(jQuery);

