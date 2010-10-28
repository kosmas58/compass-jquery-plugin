/*
 * jsTree sort plugin
 * Sorts items alphabetically (or using any other function)
 */
(function ($) {
    $.jstree.plugin("sort", {
        __init : function () {
            this.get_container()
                .bind("load_node.jstree", $.proxy(function (e, data) {
                        var obj = this._get_node(data.rslt.obj);
                        obj = obj === -1 ? this.get_container().children("ul") : obj.children("ul");
                        this.sort(obj);
                    }, this))
                .bind("rename_node.jstree create_node.jstree create.jstree", $.proxy(function (e, data) {
                        this.sort(data.rslt.obj.parent());
                    }, this))
                .bind("move_node.jstree", $.proxy(function (e, data) {
                        var m = data.rslt.np == -1 ? this.get_container() : data.rslt.np;
                        this.sort(m.children("ul"));
                    }, this));
        },
        defaults : function (a, b) { return this.get_text(a) > this.get_text(b) ? 1 : -1; },
        _fn : {
            sort : function (obj) {
                var s = this._get_settings().sort,
                    t = this;
                obj.append($.makeArray(obj.children("li")).sort($.proxy(s, t)));
                obj.find("> li > ul").each(function() { t.sort($(this)); });
                this.clean_node(obj);
            }
        }
    });
})(jQuery);
