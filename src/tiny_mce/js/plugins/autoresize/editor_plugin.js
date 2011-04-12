(function() {
    tinymce.create("tinymce.plugins.AutoResizePlugin", {init:function(a, c) {
        var d = this,e = 0;
        if (a.getParam("fullscreen_is_enabled")) {
            return
        }
        function b() {
            var i = a.getDoc(),f = i.body,k = i.documentElement,h = tinymce.DOM,j = d.autoresize_min_height,g;
            g = tinymce.isIE ? f.scrollHeight : k.offsetHeight;
            g = d.bottom_margin + g;
            if (g > d.autoresize_min_height) {
                j = g
            }
            if (j !== e) {
                h.setStyle(h.get(a.id + "_ifr"), "height", j + "px");
                e = j
            }
            if (d.throbbing) {
                a.setProgressState(false);
                a.setProgressState(true)
            }
        }

        d.editor = a;
        d.autoresize_min_height = a.getElement().offsetHeight;
        d.bottom_margin = parseInt(a.getParam("autoresize_bottom_margin", 50));
        a.onChange.add(b);
        a.onSetContent.add(b);
        a.onPaste.add(b);
        a.onKeyUp.add(b);
        a.onPostRender.add(b);
        if (a.getParam("autoresize_on_init", true)) {
            a.onInit.add(function(g, f) {
                g.setProgressState(true);
                d.throbbing = true;
                g.getBody().style.overflowY = "hidden"
            });
            a.onLoadContent.add(function(g, f) {
                b();
                setTimeout(function() {
                    b();
                    g.setProgressState(false);
                    d.throbbing = false
                }, 1250)
            })
        }
        a.addCommand("mceAutoResize", b)
    },getInfo:function() {
        return{longname:"Auto Resize",author:"Moxiecode Systems AB",authorurl:"http://tinymce.moxiecode.com",infourl:"http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/autoresize",version:tinymce.majorVersion + "." + tinymce.minorVersion}
    }});
    tinymce.PluginManager.add("autoresize", tinymce.plugins.AutoResizePlugin)
})();