tinyMCEPopup.requireLangPack();
var PasteWordDialog={init:function(){var a=tinyMCEPopup.editor,b,c,d,e="";document.getElementById("iframecontainer").innerHTML='<iframe id="iframe" src="javascript:\'\';" frameBorder="0" style="border: 1px solid gray"></iframe>';b=document.getElementById("iframe");c=b.contentWindow.document;d=[a.baseURI.toAbsolute("themes/"+a.settings.theme+"/skins/"+a.settings.skin+"/content.css")];d=d.concat(tinymce.explode(a.settings.content_css)||[]);tinymce.each(d,function(f){e+='<link href="'+a.documentBaseURI.toAbsolute(""+
f)+'" rel="stylesheet" type="text/css" />'});c.open();c.write("<html><head>"+e+'</head><body class="mceContentBody" spellcheck="false"></body></html>');c.close();c.designMode="on";this.resize();window.setTimeout(function(){b.contentWindow.focus()},10)},insert:function(){var a=document.getElementById("iframe").contentWindow.document.body.innerHTML;tinyMCEPopup.editor.execCommand("mceInsertClipboardContent",false,{content:a,wordContent:true});tinyMCEPopup.close()},resize:function(){var a=tinyMCEPopup.dom.getViewPort(window),
b;if(b=document.getElementById("iframe")){b.style.width=a.w-20+"px";b.style.height=a.h-90+"px"}}};tinyMCEPopup.onInit.add(PasteWordDialog.init,PasteWordDialog);