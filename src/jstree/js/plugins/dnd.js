/*
 * jsTree DND plugin
 * Drag and drop plugin for moving/copying nodes
 */
(function ($) {
    var o = false,
        r = false,
        m = false,
        ml = false,
        sli = false,
        sti = false,
        dir1 = false,
        dir2 = false,
        last_pos = false;
    $.vakata.dnd = {
        is_down : false,
        is_drag : false,
        helper : false,
        scroll_spd : 10,
        init_x : 0,
        init_y : 0,
        threshold : 5,
        helper_left : 5,
        helper_top : 10,
        user_data : {},

        drag_start : function (e, data, html) { 
            if($.vakata.dnd.is_drag) { $.vakata.drag_stop({}); }
            try {
                e.currentTarget.unselectable = "on";
                e.currentTarget.onselectstart = function() { return false; };
                if(e.currentTarget.style) { e.currentTarget.style.MozUserSelect = "none"; }
            } catch(err) { }
            $.vakata.dnd.init_x = e.pageX;
            $.vakata.dnd.init_y = e.pageY;
            $.vakata.dnd.user_data = data;
            $.vakata.dnd.is_down = true;
            $.vakata.dnd.helper = $("<div id='vakata-dragged' />").html(html); //.fadeTo(10,0.25);
            $(document).bind("mousemove", $.vakata.dnd.drag);
            $(document).bind("mouseup", $.vakata.dnd.drag_stop);
            return false;
        },
        drag : function (e) { 
            if(!$.vakata.dnd.is_down) { return; }
            if(!$.vakata.dnd.is_drag) {
                if(Math.abs(e.pageX - $.vakata.dnd.init_x) > 5 || Math.abs(e.pageY - $.vakata.dnd.init_y) > 5) { 
                    $.vakata.dnd.helper.appendTo("body");
                    $.vakata.dnd.is_drag = true;
                    $(document).triggerHandler("drag_start.vakata", { "event" : e, "data" : $.vakata.dnd.user_data });
                }
                else { return; }
            }

            // maybe use a scrolling parent element instead of document?
            if(e.type === "mousemove") { // thought of adding scroll in order to move the helper, but mouse poisition is n/a
                var d = $(document), t = d.scrollTop(), l = d.scrollLeft();
                if(e.pageY - t < 20) { 
                    if(sti && dir1 === "down") { clearInterval(sti); sti = false; }
                    if(!sti) { dir1 = "up"; sti = setInterval(function () { $(document).scrollTop($(document).scrollTop() - $.vakata.dnd.scroll_spd); }, 150); }
                }
                else { 
                    if(sti && dir1 === "up") { clearInterval(sti); sti = false; }
                }
                if($(window).height() - (e.pageY - t) < 20) {
                    if(sti && dir1 === "up") { clearInterval(sti); sti = false; }
                    if(!sti) { dir1 = "down"; sti = setInterval(function () { $(document).scrollTop($(document).scrollTop() + $.vakata.dnd.scroll_spd); }, 150); }
                }
                else { 
                    if(sti && dir1 === "down") { clearInterval(sti); sti = false; }
                }

                if(e.pageX - l < 20) {
                    if(sli && dir2 === "right") { clearInterval(sli); sli = false; }
                    if(!sli) { dir2 = "left"; sli = setInterval(function () { $(document).scrollLeft($(document).scrollLeft() - $.vakata.dnd.scroll_spd); }, 150); }
                }
                else { 
                    if(sli && dir2 === "left") { clearInterval(sli); sli = false; }
                }
                if($(window).width() - (e.pageX - l) < 20) {
                    if(sli && dir2 === "left") { clearInterval(sli); sli = false; }
                    if(!sli) { dir2 = "right"; sli = setInterval(function () { $(document).scrollLeft($(document).scrollLeft() + $.vakata.dnd.scroll_spd); }, 150); }
                }
                else { 
                    if(sli && dir2 === "right") { clearInterval(sli); sli = false; }
                }
            }

            $.vakata.dnd.helper.css({ left : (e.pageX + $.vakata.dnd.helper_left) + "px", top : (e.pageY + $.vakata.dnd.helper_top) + "px" });
            $(document).triggerHandler("drag.vakata", { "event" : e, "data" : $.vakata.dnd.user_data });
        },
        drag_stop : function (e) {
            if(sli) { clearInterval(sli); }
            if(sti) { clearInterval(sti); }
            $(document).unbind("mousemove", $.vakata.dnd.drag);
            $(document).unbind("mouseup", $.vakata.dnd.drag_stop);
            $(document).triggerHandler("drag_stop.vakata", { "event" : e, "data" : $.vakata.dnd.user_data });
            $.vakata.dnd.helper.remove();
            $.vakata.dnd.init_x = 0;
            $.vakata.dnd.init_y = 0;
            $.vakata.dnd.user_data = {};
            $.vakata.dnd.is_down = false;
            $.vakata.dnd.is_drag = false;
        }
    };
    $(function() {
        var css_string = '#vakata-dragged { display:block; margin:0 0 0 0; padding:4px 4px 4px 24px; position:absolute; top:-2000px; line-height:16px; z-index:10000; } ';
        $.vakata.css.add_sheet({ str : css_string, title : "vakata" });
    });

    $.jstree.plugin("dnd", {
        __init : function () {
            this.data.dnd = {
                active : false,
                after : false,
                inside : false,
                before : false,
                off : false,
                prepared : false,
                w : 0,
                to1 : false,
                to2 : false,
                cof : false,
                cw : false,
                ch : false,
                i1 : false,
                i2 : false,
                mto : false
            };
            this.get_container()
                .bind("mouseenter.jstree", $.proxy(function (e) {
                        if($.vakata.dnd.is_drag && $.vakata.dnd.user_data.jstree) {
                            if(this.data.themes) {
                                m.attr("class", "jstree-" + this.data.themes.theme); 
                                if(ml) { ml.attr("class", "jstree-" + this.data.themes.theme); }
                                $.vakata.dnd.helper.attr("class", "jstree-dnd-helper jstree-" + this.data.themes.theme);
                            }
                            //if($(e.currentTarget).find("> ul > li").length === 0) {
                            if(e.currentTarget === e.target && $.vakata.dnd.user_data.obj && $($.vakata.dnd.user_data.obj).length && $($.vakata.dnd.user_data.obj).parents(".jstree:eq(0)")[0] !== e.target) { // node should not be from the same tree
                                var tr = $.jstree._reference(e.target), dc;
                                if(tr.data.dnd.foreign) {
                                    dc = tr._get_settings().dnd.drag_check.call(this, { "o" : o, "r" : tr.get_container(), is_root : true });
                                    if(dc === true || dc.inside === true || dc.before === true || dc.after === true) {
                                        $.vakata.dnd.helper.children("ins").attr("class","jstree-ok");
                                    }
                                }
                                else {
                                    tr.prepare_move(o, tr.get_container(), "last");
                                    if(tr.check_move()) {
                                        $.vakata.dnd.helper.children("ins").attr("class","jstree-ok");
                                    }
                                }
                            }
                        }
                    }, this))
                .bind("mouseup.jstree", $.proxy(function (e) {
                        //if($.vakata.dnd.is_drag && $.vakata.dnd.user_data.jstree && $(e.currentTarget).find("> ul > li").length === 0) {
                        if($.vakata.dnd.is_drag && $.vakata.dnd.user_data.jstree && e.currentTarget === e.target && $.vakata.dnd.user_data.obj && $($.vakata.dnd.user_data.obj).length && $($.vakata.dnd.user_data.obj).parents(".jstree:eq(0)")[0] !== e.target) { // node should not be from the same tree
                            var tr = $.jstree._reference(e.currentTarget), dc;
                            if(tr.data.dnd.foreign) {
                                dc = tr._get_settings().dnd.drag_check.call(this, { "o" : o, "r" : tr.get_container(), is_root : true });
                                if(dc === true || dc.inside === true || dc.before === true || dc.after === true) {
                                    tr._get_settings().dnd.drag_finish.call(this, { "o" : o, "r" : tr.get_container(), is_root : true });
                                }
                            }
                            else {
                                tr.move_node(o, tr.get_container(), "last", e[tr._get_settings().dnd.copy_modifier + "Key"]);
                            }
                        }
                    }, this))
                .bind("mouseleave.jstree", $.proxy(function (e) {
                        if(e.relatedTarget && e.relatedTarget.id && e.relatedTarget.id === "jstree-marker-line") {
                            return false; 
                        }
                        if($.vakata.dnd.is_drag && $.vakata.dnd.user_data.jstree) {
                            if(this.data.dnd.i1) { clearInterval(this.data.dnd.i1); }
                            if(this.data.dnd.i2) { clearInterval(this.data.dnd.i2); }
                            if(this.data.dnd.to1) { clearTimeout(this.data.dnd.to1); }
                            if(this.data.dnd.to2) { clearTimeout(this.data.dnd.to2); }
                            if($.vakata.dnd.helper.children("ins").hasClass("jstree-ok")) {
                                $.vakata.dnd.helper.children("ins").attr("class","jstree-invalid");
                            }
                        }
                    }, this))
                .bind("mousemove.jstree", $.proxy(function (e) {
                        if($.vakata.dnd.is_drag && $.vakata.dnd.user_data.jstree) {
                            var cnt = this.get_container()[0];

                            // Horizontal scroll
                            if(e.pageX + 24 > this.data.dnd.cof.left + this.data.dnd.cw) {
                                if(this.data.dnd.i1) { clearInterval(this.data.dnd.i1); }
                                this.data.dnd.i1 = setInterval($.proxy(function () { this.scrollLeft += $.vakata.dnd.scroll_spd; }, cnt), 100);
                            }
                            else if(e.pageX - 24 < this.data.dnd.cof.left) {
                                if(this.data.dnd.i1) { clearInterval(this.data.dnd.i1); }
                                this.data.dnd.i1 = setInterval($.proxy(function () { this.scrollLeft -= $.vakata.dnd.scroll_spd; }, cnt), 100);
                            }
                            else {
                                if(this.data.dnd.i1) { clearInterval(this.data.dnd.i1); }
                            }

                            // Vertical scroll
                            if(e.pageY + 24 > this.data.dnd.cof.top + this.data.dnd.ch) {
                                if(this.data.dnd.i2) { clearInterval(this.data.dnd.i2); }
                                this.data.dnd.i2 = setInterval($.proxy(function () { this.scrollTop += $.vakata.dnd.scroll_spd; }, cnt), 100);
                            }
                            else if(e.pageY - 24 < this.data.dnd.cof.top) {
                                if(this.data.dnd.i2) { clearInterval(this.data.dnd.i2); }
                                this.data.dnd.i2 = setInterval($.proxy(function () { this.scrollTop -= $.vakata.dnd.scroll_spd; }, cnt), 100);
                            }
                            else {
                                if(this.data.dnd.i2) { clearInterval(this.data.dnd.i2); }
                            }

                        }
                    }, this))
                .bind("scroll.jstree", $.proxy(function (e) { 
                        if($.vakata.dnd.is_drag && $.vakata.dnd.user_data.jstree && m && ml) {
                            m.hide();
                            ml.hide();
                        }
                    }, this))
                .delegate("a", "mousedown.jstree", $.proxy(function (e) { 
                        if(e.which === 1) {
                            this.start_drag(e.currentTarget, e);
                            return false;
                        }
                    }, this))
                .delegate("a", "mouseenter.jstree", $.proxy(function (e) { 
                        if($.vakata.dnd.is_drag && $.vakata.dnd.user_data.jstree) {
                            this.dnd_enter(e.currentTarget);
                        }
                    }, this))
                .delegate("a", "mousemove.jstree", $.proxy(function (e) { 
                        if($.vakata.dnd.is_drag && $.vakata.dnd.user_data.jstree) {
                            if(!r || !r.length || r.children("a")[0] !== e.currentTarget) {
                                this.dnd_enter(e.currentTarget);
                            }
                            if(typeof this.data.dnd.off.top === "undefined") { this.data.dnd.off = $(e.target).offset(); }
                            this.data.dnd.w = (e.pageY - (this.data.dnd.off.top || 0)) % this.data.core.li_height;
                            if(this.data.dnd.w < 0) { this.data.dnd.w += this.data.core.li_height; }
                            this.dnd_show();
                        }
                    }, this))
                .delegate("a", "mouseleave.jstree", $.proxy(function (e) { 
                        if($.vakata.dnd.is_drag && $.vakata.dnd.user_data.jstree) {
                            if(e.relatedTarget && e.relatedTarget.id && e.relatedTarget.id === "jstree-marker-line") {
                                return false; 
                            }
                                if(m) { m.hide(); }
                                if(ml) { ml.hide(); }
                            /*
                            var ec = $(e.currentTarget).closest("li"), 
                                er = $(e.relatedTarget).closest("li");
                            if(er[0] !== ec.prev()[0] && er[0] !== ec.next()[0]) {
                                if(m) { m.hide(); }
                                if(ml) { ml.hide(); }
                            }
                            */
                            this.data.dnd.mto = setTimeout( 
                                (function (t) { return function () { t.dnd_leave(e); }; })(this),
                            0);
                        }
                    }, this))
                .delegate("a", "mouseup.jstree", $.proxy(function (e) { 
                        if($.vakata.dnd.is_drag && $.vakata.dnd.user_data.jstree) {
                            this.dnd_finish(e);
                        }
                    }, this));

            $(document)
                .bind("drag_stop.vakata", $.proxy(function () {
                        if(this.data.dnd.to1) { clearTimeout(this.data.dnd.to1); }
                        if(this.data.dnd.to2) { clearTimeout(this.data.dnd.to2); }
                        if(this.data.dnd.i1) { clearInterval(this.data.dnd.i1); }
                        if(this.data.dnd.i2) { clearInterval(this.data.dnd.i2); }
                        this.data.dnd.after		= false;
                        this.data.dnd.before	= false;
                        this.data.dnd.inside	= false;
                        this.data.dnd.off		= false;
                        this.data.dnd.prepared	= false;
                        this.data.dnd.w			= false;
                        this.data.dnd.to1		= false;
                        this.data.dnd.to2		= false;
                        this.data.dnd.i1		= false;
                        this.data.dnd.i2		= false;
                        this.data.dnd.active	= false;
                        this.data.dnd.foreign	= false;
                        if(m) { m.css({ "top" : "-2000px" }); }
                        if(ml) { ml.css({ "top" : "-2000px" }); }
                    }, this))
                .bind("drag_start.vakata", $.proxy(function (e, data) {
                        if(data.data.jstree) { 
                            var et = $(data.event.target);
                            if(et.closest(".jstree").hasClass("jstree-" + this.get_index())) {
                                this.dnd_enter(et);
                            }
                        }
                    }, this));
                /*
                .bind("keydown.jstree-" + this.get_index() + " keyup.jstree-" + this.get_index(), $.proxy(function(e) {
                        if($.vakata.dnd.is_drag && $.vakata.dnd.user_data.jstree && !this.data.dnd.foreign) {
                            var h = $.vakata.dnd.helper.children("ins");
                            if(e[this._get_settings().dnd.copy_modifier + "Key"] && h.hasClass("jstree-ok")) {
                                h.parent().html(h.parent().html().replace(/ \(Copy\)$/, "") + " (Copy)");
                            } 
                            else {
                                h.parent().html(h.parent().html().replace(/ \(Copy\)$/, ""));
                            }
                        }
                    }, this)); */



            var s = this._get_settings().dnd;
            if(s.drag_target) {
                $(document)
                    .delegate(s.drag_target, "mousedown.jstree-" + this.get_index(), $.proxy(function (e) {
                        o = e.target;
                        $.vakata.dnd.drag_start(e, { jstree : true, obj : e.target }, "<ins class='jstree-icon'></ins>" + $(e.target).text() );
                        if(this.data.themes) { 
                            if(m) { m.attr("class", "jstree-" + this.data.themes.theme); }
                            if(ml) { ml.attr("class", "jstree-" + this.data.themes.theme); }
                            $.vakata.dnd.helper.attr("class", "jstree-dnd-helper jstree-" + this.data.themes.theme); 
                        }
                        $.vakata.dnd.helper.children("ins").attr("class","jstree-invalid");
                        var cnt = this.get_container();
                        this.data.dnd.cof = cnt.offset();
                        this.data.dnd.cw = parseInt(cnt.width(),10);
                        this.data.dnd.ch = parseInt(cnt.height(),10);
                        this.data.dnd.foreign = true;
                        e.preventDefault();
                    }, this));
            }
            if(s.drop_target) {
                $(document)
                    .delegate(s.drop_target, "mouseenter.jstree-" + this.get_index(), $.proxy(function (e) {
                            if(this.data.dnd.active && this._get_settings().dnd.drop_check.call(this, { "o" : o, "r" : $(e.target), "e" : e })) {
                                $.vakata.dnd.helper.children("ins").attr("class","jstree-ok");
                            }
                        }, this))
                    .delegate(s.drop_target, "mouseleave.jstree-" + this.get_index(), $.proxy(function (e) {
                            if(this.data.dnd.active) {
                                $.vakata.dnd.helper.children("ins").attr("class","jstree-invalid");
                            }
                        }, this))
                    .delegate(s.drop_target, "mouseup.jstree-" + this.get_index(), $.proxy(function (e) {
                            if(this.data.dnd.active && $.vakata.dnd.helper.children("ins").hasClass("jstree-ok")) {
                                this._get_settings().dnd.drop_finish.call(this, { "o" : o, "r" : $(e.target), "e" : e });
                            }
                        }, this));
            }
        },
        defaults : {
            copy_modifier	: "ctrl",
            check_timeout	: 100,
            open_timeout	: 500,
            drop_target		: ".jstree-drop",
            drop_check		: function (data) { return true; },
            drop_finish		: $.noop,
            drag_target		: ".jstree-draggable",
            drag_finish		: $.noop,
            drag_check		: function (data) { return { after : false, before : false, inside : true }; }
        },
        _fn : {
            dnd_prepare : function () {
                if(!r || !r.length) { return; }
                this.data.dnd.off = r.offset();
                if(this._get_settings().core.rtl) {
                    this.data.dnd.off.right = this.data.dnd.off.left + r.width();
                }
                if(this.data.dnd.foreign) {
                    var a = this._get_settings().dnd.drag_check.call(this, { "o" : o, "r" : r });
                    this.data.dnd.after = a.after;
                    this.data.dnd.before = a.before;
                    this.data.dnd.inside = a.inside;
                    this.data.dnd.prepared = true;
                    return this.dnd_show();
                }
                this.prepare_move(o, r, "before");
                this.data.dnd.before = this.check_move();
                this.prepare_move(o, r, "after");
                this.data.dnd.after = this.check_move();
                if(this._is_loaded(r)) {
                    this.prepare_move(o, r, "inside");
                    this.data.dnd.inside = this.check_move();
                }
                else {
                    this.data.dnd.inside = false;
                }
                this.data.dnd.prepared = true;
                return this.dnd_show();
            },
            dnd_show : function () {
                if(!this.data.dnd.prepared) { return; }
                var o = ["before","inside","after"],
                    r = false,
                    rtl = this._get_settings().core.rtl,
                    pos;
                if(this.data.dnd.w < this.data.core.li_height/3) { o = ["before","inside","after"]; }
                else if(this.data.dnd.w <= this.data.core.li_height*2/3) {
                    o = this.data.dnd.w < this.data.core.li_height/2 ? ["inside","before","after"] : ["inside","after","before"];
                }
                else { o = ["after","inside","before"]; }
                $.each(o, $.proxy(function (i, val) { 
                    if(this.data.dnd[val]) {
                        $.vakata.dnd.helper.children("ins").attr("class","jstree-ok");
                        r = val;
                        return false;
                    }
                }, this));
                if(r === false) { $.vakata.dnd.helper.children("ins").attr("class","jstree-invalid"); }
                
                pos = rtl ? (this.data.dnd.off.right - 18) : (this.data.dnd.off.left + 10);
                switch(r) {
                    case "before":
                        m.css({ "left" : pos + "px", "top" : (this.data.dnd.off.top - 6) + "px" }).show();
                        if(ml) { ml.css({ "left" : (pos + 8) + "px", "top" : (this.data.dnd.off.top - 1) + "px" }).show(); }
                        break;
                    case "after":
                        m.css({ "left" : pos + "px", "top" : (this.data.dnd.off.top + this.data.core.li_height - 6) + "px" }).show();
                        if(ml) { ml.css({ "left" : (pos + 8) + "px", "top" : (this.data.dnd.off.top + this.data.core.li_height - 1) + "px" }).show(); }
                        break;
                    case "inside":
                        m.css({ "left" : pos + ( rtl ? -4 : 4) + "px", "top" : (this.data.dnd.off.top + this.data.core.li_height/2 - 5) + "px" }).show();
                        if(ml) { ml.hide(); }
                        break;
                    default:
                        m.hide();
                        if(ml) { ml.hide(); }
                        break;
                }
                last_pos = r;
                return r;
            },
            dnd_open : function () {
                this.data.dnd.to2 = false;
                this.open_node(r, $.proxy(this.dnd_prepare,this), true);
            },
            dnd_finish : function (e) {
                if(this.data.dnd.foreign) {
                    if(this.data.dnd.after || this.data.dnd.before || this.data.dnd.inside) {
                        this._get_settings().dnd.drag_finish.call(this, { "o" : o, "r" : r, "p" : last_pos });
                    }
                }
                else {
                    this.dnd_prepare();
                    this.move_node(o, r, last_pos, e[this._get_settings().dnd.copy_modifier + "Key"]);
                }
                o = false;
                r = false;
                m.hide();
                if(ml) { ml.hide(); }
            },
            dnd_enter : function (obj) {
                if(this.data.dnd.mto) { 
                    clearTimeout(this.data.dnd.mto);
                    this.data.dnd.mto = false;
                }
                var s = this._get_settings().dnd;
                this.data.dnd.prepared = false;
                r = this._get_node(obj);
                if(s.check_timeout) { 
                    // do the calculations after a minimal timeout (users tend to drag quickly to the desired location)
                    if(this.data.dnd.to1) { clearTimeout(this.data.dnd.to1); }
                    this.data.dnd.to1 = setTimeout($.proxy(this.dnd_prepare, this), s.check_timeout); 
                }
                else { 
                    this.dnd_prepare(); 
                }
                if(s.open_timeout) { 
                    if(this.data.dnd.to2) { clearTimeout(this.data.dnd.to2); }
                    if(r && r.length && r.hasClass("jstree-closed")) { 
                        // if the node is closed - open it, then recalculate
                        this.data.dnd.to2 = setTimeout($.proxy(this.dnd_open, this), s.open_timeout);
                    }
                }
                else {
                    if(r && r.length && r.hasClass("jstree-closed")) { 
                        this.dnd_open();
                    }
                }
            },
            dnd_leave : function (e) {
                this.data.dnd.after		= false;
                this.data.dnd.before	= false;
                this.data.dnd.inside	= false;
                $.vakata.dnd.helper.children("ins").attr("class","jstree-invalid");
                m.hide();
                if(ml) { ml.hide(); }
                if(r && r[0] === e.target.parentNode) {
                    if(this.data.dnd.to1) {
                        clearTimeout(this.data.dnd.to1);
                        this.data.dnd.to1 = false;
                    }
                    if(this.data.dnd.to2) {
                        clearTimeout(this.data.dnd.to2);
                        this.data.dnd.to2 = false;
                    }
                }
            },
            start_drag : function (obj, e) {
                o = this._get_node(obj);
                if(this.data.ui && this.is_selected(o)) { o = this._get_node(null, true); }
                var dt = o.length > 1 ? this._get_string("multiple_selection") : this.get_text(o),
                    cnt = this.get_container();
                if(!this._get_settings().core.html_titles) { dt = dt.replace(/</ig,"&lt;").replace(/>/ig,"&gt;"); }
                $.vakata.dnd.drag_start(e, { jstree : true, obj : o }, "<ins class='jstree-icon'></ins>" + dt );
                if(this.data.themes) { 
                    if(m) { m.attr("class", "jstree-" + this.data.themes.theme); }
                    if(ml) { ml.attr("class", "jstree-" + this.data.themes.theme); }
                    $.vakata.dnd.helper.attr("class", "jstree-dnd-helper jstree-" + this.data.themes.theme); 
                }
                this.data.dnd.cof = cnt.offset();
                this.data.dnd.cw = parseInt(cnt.width(),10);
                this.data.dnd.ch = parseInt(cnt.height(),10);
                this.data.dnd.active = true;
            }
        }
    });
    $(function() {
        var css_string = '' + 
            '#vakata-dragged ins { display:block; text-decoration:none; width:16px; height:16px; margin:0 0 0 0; padding:0; position:absolute; top:4px; left:4px; ' + 
            ' -moz-border-radius:4px; border-radius:4px; -webkit-border-radius:4px; ' +
            '} ' + 
            '#vakata-dragged .jstree-ok { background:green; } ' + 
            '#vakata-dragged .jstree-invalid { background:red; } ' + 
            '#jstree-marker { padding:0; margin:0; font-size:12px; overflow:hidden; height:12px; width:8px; position:absolute; top:-30px; z-index:10001; background-repeat:no-repeat; display:none; background-color:transparent; text-shadow:1px 1px 1px white; color:black; line-height:10px; } ' + 
            '#jstree-marker-line { padding:0; margin:0; line-height:0%; font-size:1px; overflow:hidden; height:1px; width:100px; position:absolute; top:-30px; z-index:10000; background-repeat:no-repeat; display:none; background-color:#456c43; ' + 
            ' cursor:pointer; border:1px solid #eeeeee; border-left:0; -moz-box-shadow: 0px 0px 2px #666; -webkit-box-shadow: 0px 0px 2px #666; box-shadow: 0px 0px 2px #666; ' + 
            ' -moz-border-radius:1px; border-radius:1px; -webkit-border-radius:1px; ' +
            '}' + 
            '';
        $.vakata.css.add_sheet({ str : css_string, title : "jstree" });
        m = $("<div />").attr({ id : "jstree-marker" }).hide().html("&raquo;")
            .bind("mouseleave mouseenter", function (e) { 
                m.hide();
                ml.hide();
                e.preventDefault(); 
                e.stopImmediatePropagation(); 
                return false; 
            })
            .appendTo("body");
        ml = $("<div />").attr({ id : "jstree-marker-line" }).hide()
            .bind("mouseup", function (e) { 
                if(r && r.length) { 
                    r.children("a").trigger(e); 
                    e.preventDefault(); 
                    e.stopImmediatePropagation(); 
                    return false; 
                } 
            })
            .bind("mouseleave", function (e) { 
                var rt = $(e.relatedTarget);
                if(rt.is(".jstree") || rt.closest(".jstree").length === 0) {
                    if(r && r.length) { 
                        r.children("a").trigger(e); 
                        m.hide();
                        ml.hide();
                        e.preventDefault(); 
                        e.stopImmediatePropagation(); 
                        return false; 
                    }
                }
            })
            .appendTo("body");
        $(document).bind("drag_start.vakata", function (e, data) {
            if(data.data.jstree) { m.show(); if(ml) { ml.show(); } }
        });
        $(document).bind("drag_stop.vakata", function (e, data) {
            if(data.data.jstree) { m.hide(); if(ml) { ml.hide(); } }
        });
    });
})(jQuery);
