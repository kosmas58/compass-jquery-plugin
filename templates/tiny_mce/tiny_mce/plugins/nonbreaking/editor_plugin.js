(function(){tinymce.create("tinymce.plugins.Nonbreaking",{init:function(a){this.editor=a;a.addCommand("mceNonBreaking",function(){a.execCommand("mceInsertContent",false,a.plugins.visualchars&&a.plugins.visualchars.state?'<span data-mce-bogus="1" class="mceItemHidden mceItemNbsp">&nbsp;</span>':"&nbsp;")});a.addButton("nonbreaking",{title:"nonbreaking.nonbreaking_desc",cmd:"mceNonBreaking"});a.getParam("nonbreaking_force_tab")&&a.onKeyDown.add(function(b,c){if(tinymce.isIE&&c.keyCode==9){b.execCommand("mceNonBreaking");
b.execCommand("mceNonBreaking");b.execCommand("mceNonBreaking");tinymce.dom.Event.cancel(c)}})},getInfo:function(){return{longname:"Nonbreaking space",author:"Moxiecode Systems AB",authorurl:"http://tinymce.moxiecode.com",infourl:"http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/nonbreaking",version:tinymce.majorVersion+"."+tinymce.minorVersion}}});tinymce.PluginManager.add("nonbreaking",tinymce.plugins.Nonbreaking)})();