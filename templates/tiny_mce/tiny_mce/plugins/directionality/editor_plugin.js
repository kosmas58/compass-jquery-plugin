(function(){tinymce.create("tinymce.plugins.Directionality",{init:function(a){this.editor=a;a.addCommand("mceDirectionLTR",function(){var b=a.dom.getParent(a.selection.getNode(),a.dom.isBlock);if(b)a.dom.getAttrib(b,"dir")!="ltr"?a.dom.setAttrib(b,"dir","ltr"):a.dom.setAttrib(b,"dir","");a.nodeChanged()});a.addCommand("mceDirectionRTL",function(){var b=a.dom.getParent(a.selection.getNode(),a.dom.isBlock);if(b)a.dom.getAttrib(b,"dir")!="rtl"?a.dom.setAttrib(b,"dir","rtl"):a.dom.setAttrib(b,"dir","");
a.nodeChanged()});a.addButton("ltr",{title:"directionality.ltr_desc",cmd:"mceDirectionLTR"});a.addButton("rtl",{title:"directionality.rtl_desc",cmd:"mceDirectionRTL"});a.onNodeChange.add(this._nodeChange,this)},getInfo:function(){return{longname:"Directionality",author:"Moxiecode Systems AB",authorurl:"http://tinymce.moxiecode.com",infourl:"http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/directionality",version:tinymce.majorVersion+"."+tinymce.minorVersion}},_nodeChange:function(a,b,c){a=a.dom;
if(c=a.getParent(c,a.isBlock)){c=a.getAttrib(c,"dir");b.setActive("ltr",c=="ltr");b.setDisabled("ltr",0);b.setActive("rtl",c=="rtl");b.setDisabled("rtl",0)}else{b.setDisabled("ltr",1);b.setDisabled("rtl",1)}}});tinymce.PluginManager.add("directionality",tinymce.plugins.Directionality)})();