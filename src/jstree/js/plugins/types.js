/* 
 * jsTree types plugin
 * Adds support types of nodes
 * You can set an attribute on each li node, that represents its type.
 * According to the type setting the node may get custom icon/validation rules
 */
(function ($) {
    $.jstree.plugin("types", {
        __init : function () {
            var s = this._get_settings().types;
            this.data.types.attach_to = [];
            this.get_container()
                    .bind("init.jstree", $.proxy(function () {
                var types = s.types,
                        attr = s.type_attr,
                        icons_css = "",
                        _this = this;

                $.each(types, function (i, tp) {
                    $.each(tp, function (k, v) {
                        if (!/^(max_depth|max_children|icon|valid_children)$/.test(k)) {
                            _this.data.types.attach_to.push(k);
                        }
                    });
                    if (!tp.icon) {
                        return true;
                    }
                    if (tp.icon.image || tp.icon.position) {
                        if (i == "default") {
                            icons_css += '.jstree-' + _this.get_index() + ' a > .jstree-icon { ';
                        }
                        else {
                            icons_css += '.jstree-' + _this.get_index() + ' li[' + attr + '="' + i + '"] > a > .jstree-icon { ';
                        }
                        if (tp.icon.image) {
                            icons_css += ' background-image:url(' + tp.icon.image + '); ';
                        }
                        if (tp.icon.position) {
                            icons_css += ' background-position:' + tp.icon.position + '; ';
                        }
                        else {
                            icons_css += ' background-position:0 0; ';
                        }
                        icons_css += '} ';
                    }
                });
                if (icons_css !== "") {
                    $.vakata.css.add_sheet({ 'str' : icons_css, title : "jstree-types" });
                }
            }, this))
                    .bind("before.jstree", $.proxy(function (e, data) {
                var s, t,
                        o = this._get_settings().types.use_data ? this._get_node(data.args[0]) : false,
                        d = o && o !== -1 && o.length ? o.data("jstree") : false;
                if (d && d.types && d.types[data.func] === false) {
                    e.stopImmediatePropagation();
                    return false;
                }
                if ($.inArray(data.func, this.data.types.attach_to) !== -1) {
                    if (!data.args[0] || (!data.args[0].tagName && !data.args[0].jquery)) {
                        return;
                    }
                    s = this._get_settings().types.types;
                    t = this._get_type(data.args[0]);
                    if (
                            (
                                    (s[t] && typeof s[t][data.func] !== "undefined") ||
                                            (s["default"] && typeof s["default"][data.func] !== "undefined")
                                    ) && this._check(data.func, data.args[0]) === false
                            ) {
                        e.stopImmediatePropagation();
                        return false;
                    }
                }
            }, this));
            if (is_ie6) {
                this.get_container()
                        .bind("load_node.jstree set_type.jstree", $.proxy(function (e, data) {
                    var r = data && data.rslt && data.rslt.obj && data.rslt.obj !== -1 ? this._get_node(data.rslt.obj).parent() : this.get_container_ul(),
                            c = false,
                            s = this._get_settings().types;
                    $.each(s.types, function (i, tp) {
                        if (tp.icon && (tp.icon.image || tp.icon.position)) {
                            c = i === "default" ? r.find("li > a > .jstree-icon") : r.find("li[" + s.type_attr + "='" + i + "'] > a > .jstree-icon");
                            if (tp.icon.image) {
                                c.css("backgroundImage", "url(" + tp.icon.image + ")");
                            }
                            c.css("backgroundPosition", tp.icon.position || "0 0");
                        }
                    });
                }, this));
            }
        },
        defaults : {
            // defines maximum number of root nodes (-1 means unlimited, -2 means disable max_children checking)
            max_children        : -1,
            // defines the maximum depth of the tree (-1 means unlimited, -2 means disable max_depth checking)
            max_depth            : -1,
            // defines valid node types for the root nodes
            valid_children        : "all",

            // whether to use $.data
            use_data : false,
            // where is the type stores (the rel attribute of the LI element)
            type_attr : "rel",
            // a list of types
            types : {
                // the default type
                "default" : {
                    "max_children"    : -1,
                    "max_depth"        : -1,
                    "valid_children": "all"

                    // Bound functions - you can bind any other function here (using boolean or function)
                    //"select_node"	: true
                }
            }
        },
        _fn : {
            _types_notify : function (n, data) {
                if (data.type && this._get_settings().types.use_data) {
                    this.set_type(data.type, n);
                }
            },
            _get_type : function (obj) {
                obj = this._get_node(obj);
                return (!obj || !obj.length) ? false : obj.attr(this._get_settings().types.type_attr) || "default";
            },
            set_type : function (str, obj) {
                obj = this._get_node(obj);
                var ret = (!obj.length || !str) ? false : obj.attr(this._get_settings().types.type_attr, str);
                if (ret) {
                    this.__callback({ obj : obj, type : str});
                }
                return ret;
            },
            _check : function (rule, obj, opts) {
                obj = this._get_node(obj);
                var v = false, t = this._get_type(obj), d = 0, _this = this, s = this._get_settings().types, data = false;
                if (obj === -1) {
                    if (!!s[rule]) {
                        v = s[rule];
                    }
                    else {
                        return;
                    }
                }
                else {
                    if (t === false) {
                        return;
                    }
                    data = s.use_data ? obj.data("jstree") : false;
                    if (data && data.types && typeof data.types[rule] !== "undefined") {
                        v = data.types[rule];
                    }
                    else if (!!s.types[t] && typeof s.types[t][rule] !== "undefined") {
                        v = s.types[t][rule];
                    }
                    else if (!!s.types["default"] && typeof s.types["default"][rule] !== "undefined") {
                        v = s.types["default"][rule];
                    }
                }
                if ($.isFunction(v)) {
                    v = v.call(this, obj);
                }
                if (rule === "max_depth" && obj !== -1 && opts !== false && s.max_depth !== -2 && v !== 0) {
                    // also include the node itself - otherwise if root node it is not checked
                    obj.children("a:eq(0)").parentsUntil(".jstree", "li").each(function (i) {
                        // check if current depth already exceeds global tree depth
                        if (s.max_depth !== -1 && s.max_depth - (i + 1) <= 0) {
                            v = 0;
                            return false;
                        }
                        d = (i === 0) ? v : _this._check(rule, this, false);
                        // check if current node max depth is already matched or exceeded
                        if (d !== -1 && d - (i + 1) <= 0) {
                            v = 0;
                            return false;
                        }
                        // otherwise - set the max depth to the current value minus current depth
                        if (d >= 0 && (d - (i + 1) < v || v < 0)) {
                            v = d - (i + 1);
                        }
                        // if the global tree depth exists and it minus the nodes calculated so far is less than `v` or `v` is unlimited
                        if (s.max_depth >= 0 && (s.max_depth - (i + 1) < v || v < 0)) {
                            v = s.max_depth - (i + 1);
                        }
                    });
                }
                return v;
            },
            check_move : function () {
                if (!this.__call_old()) {
                    return false;
                }
                var m = this._get_move(),
                        s = m.rt._get_settings().types,
                        mc = m.rt._check("max_children", m.cr),
                        md = m.rt._check("max_depth", m.cr),
                        vc = m.rt._check("valid_children", m.cr),
                        ch = 0, d = 1, t;

                if (vc === "none") {
                    return false;
                }
                if ($.isArray(vc) && m.ot && m.ot._get_type) {
                    m.o.each(function () {
                        if ($.inArray(m.ot._get_type(this), vc) === -1) {
                            d = false;
                            return false;
                        }
                    });
                    if (d === false) {
                        return false;
                    }
                }
                if (s.max_children !== -2 && mc !== -1) {
                    ch = m.cr === -1 ? this.get_container().find("> ul > li").not(m.o).length : m.cr.find("> ul > li").not(m.o).length;
                    if (ch + m.o.length > mc) {
                        return false;
                    }
                }
                if (s.max_depth !== -2 && md !== -1) {
                    d = 0;
                    if (md === 0) {
                        return false;
                    }
                    if (typeof m.o.d === "undefined") {
                        // TODO: deal with progressive rendering and async when checking max_depth (how to know the depth of the moved node)
                        t = m.o;
                        while (t.length > 0) {
                            t = t.find("> ul > li");
                            d ++;
                        }
                        m.o.d = d;
                    }
                    if (md - m.o.d < 0) {
                        return false;
                    }
                }
                return true;
            },
            create_node : function (obj, position, js, callback, is_loaded, skip_check) {
                if (!skip_check && (is_loaded || this._is_loaded(obj))) {
                    var p = (typeof position == "string" && position.match(/^before|after$/i) && obj !== -1) ? this._get_parent(obj) : this._get_node(obj),
                            s = this._get_settings().types,
                            mc = this._check("max_children", p),
                            md = this._check("max_depth", p),
                            vc = this._check("valid_children", p),
                            ch;
                    if (typeof js === "string") {
                        js = { data : js };
                    }
                    if (!js) {
                        js = {};
                    }
                    if (vc === "none") {
                        return false;
                    }
                    if ($.isArray(vc)) {
                        if (!js.attr || !js.attr[s.type_attr]) {
                            if (!js.attr) {
                                js.attr = {};
                            }
                            js.attr[s.type_attr] = vc[0];
                        }
                        else {
                            if ($.inArray(js.attr[s.type_attr], vc) === -1) {
                                return false;
                            }
                        }
                    }
                    if (s.max_children !== -2 && mc !== -1) {
                        ch = p === -1 ? this.get_container().children("> ul > li").length : p.children("> ul > li").length;
                        if (ch + 1 > mc) {
                            return false;
                        }
                    }
                    if (s.max_depth !== -2 && md !== -1 && (md - 1) < 0) {
                        return false;
                    }
                }
                return this.__call_old(true, obj, position, js, callback, is_loaded, skip_check);
            }
        }
    });
})(jQuery);
