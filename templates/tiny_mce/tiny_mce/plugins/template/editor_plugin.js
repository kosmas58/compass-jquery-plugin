(function(){var j=tinymce.each;tinymce.create("tinymce.plugins.TemplatePlugin",{init:function(b,a){var d=this;d.editor=b;b.addCommand("mceTemplate",function(){b.windowManager.open({file:a+"/template.htm",width:b.getParam("template_popup_width",750),height:b.getParam("template_popup_height",600),inline:1},{plugin_url:a})});b.addCommand("mceInsertTemplate",d._insertTemplate,d);b.addButton("template",{title:"template.desc",cmd:"mceTemplate"});b.onPreProcess.add(function(c,e){var f=c.dom;j(f.select("div",
e.node),function(g){if(f.hasClass(g,"mceTmpl")){j(f.select("*",g),function(i){if(f.hasClass(i,c.getParam("template_mdate_classes","mdate").replace(/\s+/g,"|")))i.innerHTML=d._getDateTime(new Date,c.getParam("template_mdate_format",c.getLang("template.mdate_format")))});d._replaceVals(g)}})})},getInfo:function(){return{longname:"Template plugin",author:"Moxiecode Systems AB",authorurl:"http://www.moxiecode.com",infourl:"http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/template",version:tinymce.majorVersion+
"."+tinymce.minorVersion}},_insertTemplate:function(b,a){function d(h,k){return RegExp("\\b"+k+"\\b","g").test(h.className)}var c=this,e=c.editor,f,g,i=e.dom,l=e.selection.getContent();f=a.content;j(c.editor.getParam("template_replace_values"),function(h,k){if(typeof h!="function")f=f.replace(RegExp("\\{\\$"+k+"\\}","g"),h)});g=i.create("div",null,f);if((n=i.select(".mceTmpl",g))&&n.length>0){g=i.create("div",null);g.appendChild(n[0].cloneNode(true))}j(i.select("*",g),function(h){if(d(h,e.getParam("template_cdate_classes",
"cdate").replace(/\s+/g,"|")))h.innerHTML=c._getDateTime(new Date,e.getParam("template_cdate_format",e.getLang("template.cdate_format")));if(d(h,e.getParam("template_mdate_classes","mdate").replace(/\s+/g,"|")))h.innerHTML=c._getDateTime(new Date,e.getParam("template_mdate_format",e.getLang("template.mdate_format")));if(d(h,e.getParam("template_selected_content_classes","selcontent").replace(/\s+/g,"|")))h.innerHTML=l});c._replaceVals(g);e.execCommand("mceInsertContent",false,g.innerHTML);e.addVisual()},
_replaceVals:function(b){var a=this.editor.dom,d=this.editor.getParam("template_replace_values");j(a.select("*",b),function(c){j(d,function(e,f){a.hasClass(c,f)&&typeof d[f]=="function"&&d[f](c)})})},_getDateTime:function(b,a){function d(c,e){var f;c=""+c;if(c.length<e)for(f=0;f<e-c.length;f++)c="0"+c;return c}if(!a)return"";a=a.replace("%D","%m/%d/%y");a=a.replace("%r","%I:%M:%S %p");a=a.replace("%Y",""+b.getFullYear());a=a.replace("%y",""+b.getYear());a=a.replace("%m",d(b.getMonth()+1,2));a=a.replace("%d",
d(b.getDate(),2));a=a.replace("%H",""+d(b.getHours(),2));a=a.replace("%M",""+d(b.getMinutes(),2));a=a.replace("%S",""+d(b.getSeconds(),2));a=a.replace("%I",""+((b.getHours()+11)%12+1));a=a.replace("%p",""+(b.getHours()<12?"AM":"PM"));a=a.replace("%B",""+this.editor.getLang("template_months_long").split(",")[b.getMonth()]);a=a.replace("%b",""+this.editor.getLang("template_months_short").split(",")[b.getMonth()]);a=a.replace("%A",""+this.editor.getLang("template_day_long").split(",")[b.getDay()]);a=
a.replace("%a",""+this.editor.getLang("template_day_short").split(",")[b.getDay()]);return a=a.replace("%%","%")}});tinymce.PluginManager.add("template",tinymce.plugins.TemplatePlugin)})();