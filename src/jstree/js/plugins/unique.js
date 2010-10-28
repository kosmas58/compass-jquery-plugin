/* 
 * jsTree unique plugin
 * Forces different names amongst siblings (still a bit experimental)
 * NOTE: does not check language versions (it will not be possible to have nodes with the same title, even in different languages)
 */
(function ($) {
    $.jstree.plugin("unique", {
        __init : function () {
            this.get_container()
                .bind("before.jstree", $.proxy(function (e, data) { 
                        var nms = [], res = true, p, t;
                        if(data.func == "move_node") {
                            // obj, ref, position, is_copy, is_prepared, skip_check
                            if(data.args[4] === true) {
                                if(data.args[0].o && data.args[0].o.length) {
                                    data.args[0].o.children("a").each(function () { nms.push($(this).text().replace(/^\s+/g,"")); });
                                    res = this._check_unique(nms, data.args[0].np.find("> ul > li").not(data.args[0].o), "move_node");
                                }
                            }
                        }
                        if(data.func == "create_node") {
                            // obj, position, js, callback, is_loaded
                            if(data.args[4] || this._is_loaded(data.args[0])) {
                                p = this._get_node(data.args[0]);
                                if(data.args[1] && (data.args[1] === "before" || data.args[1] === "after")) {
                                    p = this._get_parent(data.args[0]);
                                    if(!p || p === -1) { p = this.get_container(); }
                                }
                                if(typeof data.args[2] === "string") { nms.push(data.args[2]); }
                                else if(!data.args[2] || !data.args[2].data) { nms.push(this._get_string("new_node")); }
                                else { nms.push(data.args[2].data); }
                                res = this._check_unique(nms, p.find("> ul > li"), "create_node");
                            }
                        }
                        if(data.func == "rename_node") {
                            // obj, val
                            nms.push(data.args[1]);
                            t = this._get_node(data.args[0]);
                            p = this._get_parent(t);
                            if(!p || p === -1) { p = this.get_container(); }
                            res = this._check_unique(nms, p.find("> ul > li").not(t), "rename_node");
                        }
                        if(!res) {
                            e.stopPropagation();
                            return false;
                        }
                    }, this));
        },
        defaults : { 
            error_callback : $.noop
        },
        _fn : { 
            _check_unique : function (nms, p, func) {
                var cnms = [];
                p.children("a").each(function () { cnms.push($(this).text().replace(/^\s+/g,"")); });
                if(!cnms.length || !nms.length) { return true; }
                cnms = cnms.sort().join(",,").replace(/(,|^)([^,]+)(,,\2)+(,|$)/g,"$1$2$4").replace(/,,+/g,",").replace(/,$/,"").split(",");
                if((cnms.length + nms.length) != cnms.concat(nms).sort().join(",,").replace(/(,|^)([^,]+)(,,\2)+(,|$)/g,"$1$2$4").replace(/,,+/g,",").replace(/,$/,"").split(",").length) {
                    this._get_settings().unique.error_callback.call(null, nms, p, func);
                    return false;
                }
                return true;
            },
            check_move : function () {
                if(!this.__call_old()) { return false; }
                var p = this._get_move(), nms = [];
                if(p.o && p.o.length) {
                    p.o.children("a").each(function () { nms.push($(this).text().replace(/^\s+/g,"")); });
                    return this._check_unique(nms, p.np.find("> ul > li").not(p.o), "check_move");
                }
                return true;
            }
        }
    });
})(jQuery);
