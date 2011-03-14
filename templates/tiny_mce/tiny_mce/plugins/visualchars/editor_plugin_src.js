(function(){tinymce.create("tinymce.plugins.VisualChars",{init:function(a){var b=this;b.editor=a;a.addCommand("mceVisualChars",b._toggleVisualChars,b);a.addButton("visualchars",{title:"visualchars.desc",cmd:"mceVisualChars"});a.onBeforeGetContent.add(function(d,c){if(b.state&&c.format!="raw"&&!c.draft){b.state=true;b._toggleVisualChars(false)}})},getInfo:function(){return{longname:"Visual characters",author:"Moxiecode Systems AB",authorurl:"http://tinymce.moxiecode.com",infourl:"http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/visualchars",
version:tinymce.majorVersion+"."+tinymce.minorVersion}},_toggleVisualChars:function(a){var b=this.editor,d;b.getDoc();var c=b.getBody(),f=b.selection,g;this.state=!this.state;b.controlManager.setActive("visualchars",this.state);if(a)g=f.getBookmark();if(this.state){d=[];tinymce.walk(c,function(e){e.nodeType==3&&e.nodeValue&&e.nodeValue.indexOf(" ")!=-1&&d.push(e)},"childNodes");for(a=0;a<d.length;a++){c=d[a].nodeValue;c=c.replace(/(\u00a0)/g,'<span data-mce-bogus="1" class="mceItemHidden mceItemNbsp">$1</span>');
for(c=b.dom.create("div",null,c);node=c.lastChild;)b.dom.insertAfter(node,d[a]);b.dom.remove(d[a])}}else{d=b.dom.select("span.mceItemNbsp",c);for(a=d.length-1;a>=0;a--)b.dom.remove(d[a],1)}f.moveToBookmark(g)}});tinymce.PluginManager.add("visualchars",tinymce.plugins.VisualChars)})();