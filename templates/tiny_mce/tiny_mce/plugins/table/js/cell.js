tinyMCEPopup.requireLangPack();var ed;
function init(){ed=tinyMCEPopup.editor;tinyMCEPopup.resizeToInnerSize();document.getElementById("backgroundimagebrowsercontainer").innerHTML=getBrowserHTML("backgroundimagebrowser","backgroundimage","image","table");document.getElementById("bordercolor_pickcontainer").innerHTML=getColorPickerHTML("bordercolor_pick","bordercolor");document.getElementById("bgcolor_pickcontainer").innerHTML=getColorPickerHTML("bgcolor_pick","bgcolor");var a=ed.dom.getParent(ed.selection.getStart(),"td,th"),b=document.forms[0],
e=ed.dom.parseStyle(ed.dom.getAttrib(a,"style")),d=a.nodeName.toLowerCase(),c=ed.dom.getAttrib(a,"align"),f=ed.dom.getAttrib(a,"valign"),g=trimSize(getStyle(a,"width","width")),h=trimSize(getStyle(a,"height","height")),i=convertRGBToHex(getStyle(a,"bordercolor","borderLeftColor")),j=convertRGBToHex(getStyle(a,"bgcolor","backgroundColor")),k=ed.dom.getAttrib(a,"class"),l=getStyle(a,"background","backgroundImage").replace(RegExp("url\\(['\"]?([^'\"]*)['\"]?\\)","gi"),"$1"),m=ed.dom.getAttrib(a,"id"),
n=ed.dom.getAttrib(a,"lang"),o=ed.dom.getAttrib(a,"dir"),p=ed.dom.getAttrib(a,"scope");addClassesToList("class","table_cell_styles");TinyMCE_EditableSelects.init();if(ed.dom.hasClass(a,"mceSelected"))tinyMCEPopup.dom.hide("action");else{b.bordercolor.value=i;b.bgcolor.value=j;b.backgroundimage.value=l;b.width.value=g;b.height.value=h;b.id.value=m;b.lang.value=n;b.style.value=ed.dom.serializeStyle(e);selectByValue(b,"align",c);selectByValue(b,"valign",f);selectByValue(b,"class",k,true,true);selectByValue(b,
"celltype",d);selectByValue(b,"dir",o);selectByValue(b,"scope",p);if(isVisible("backgroundimagebrowser"))document.getElementById("backgroundimage").style.width="180px";updateColor("bordercolor_pick","bordercolor");updateColor("bgcolor_pick","bgcolor")}}
function updateAction(){var a,b=ed,e,d,c=document.forms[0];tinyMCEPopup.restoreSelection();a=ed.selection.getStart();e=ed.dom.getParent(a,"td,th");d=ed.dom.getParent(a,"tr");a=ed.dom.getParent(a,"table");if(ed.dom.hasClass(e,"mceSelected"))tinymce.each(ed.dom.select("td.mceSelected,th.mceSelected"),function(f){updateCell(f)});else switch(getSelectValue(c,"action")){case "cell":d=getSelectValue(c,"celltype");c=getSelectValue(c,"scope");a=function(f){if(f){updateCell(e);ed.addVisual();ed.nodeChanged();
b.execCommand("mceEndUndoLevel");tinyMCEPopup.close()}};if(ed.getParam("accessibility_warnings",1)){d=="th"&&c==""?tinyMCEPopup.confirm(ed.getLang("table_dlg.missing_scope","",true),a):a(1);return}updateCell(e);break;case "row":c=d.firstChild;if(c.nodeName!="TD"&&c.nodeName!="TH")c=nextCell(c);do c=updateCell(c,true);while((c=nextCell(c))!=null);break;case "all":d=a.getElementsByTagName("tr");for(a=0;a<d.length;a++){c=d[a].firstChild;if(c.nodeName!="TD"&&c.nodeName!="TH")c=nextCell(c);do c=updateCell(c,
true);while((c=nextCell(c))!=null)}}ed.addVisual();ed.nodeChanged();b.execCommand("mceEndUndoLevel");tinyMCEPopup.close()}function nextCell(a){for(;(a=a.nextSibling)!=null;)if(a.nodeName=="TD"||a.nodeName=="TH")return a;return null}
function updateCell(a,b){var e=ed,d=document.forms[0],c=a.nodeName.toLowerCase(),f=getSelectValue(d,"celltype"),g=e.getDoc();e=ed.dom;b||e.setAttrib(a,"id",d.id.value);e.setAttrib(a,"align",d.align.value);e.setAttrib(a,"vAlign",d.valign.value);e.setAttrib(a,"lang",d.lang.value);e.setAttrib(a,"dir",getSelectValue(d,"dir"));e.setAttrib(a,"style",ed.dom.serializeStyle(ed.dom.parseStyle(d.style.value)));e.setAttrib(a,"scope",d.scope.value);e.setAttrib(a,"class",getSelectValue(d,"class"));ed.dom.setAttrib(a,
"width","");ed.dom.setAttrib(a,"height","");ed.dom.setAttrib(a,"bgColor","");ed.dom.setAttrib(a,"borderColor","");ed.dom.setAttrib(a,"background","");a.style.width=getCSSSize(d.width.value);a.style.height=getCSSSize(d.height.value);if(d.bordercolor.value!=""){a.style.borderColor=d.bordercolor.value;a.style.borderStyle=a.style.borderStyle==""?"solid":a.style.borderStyle;a.style.borderWidth=a.style.borderWidth==""?"1px":a.style.borderWidth}else a.style.borderColor="";a.style.backgroundColor=d.bgcolor.value;
a.style.backgroundImage=d.backgroundimage.value!=""?"url('"+d.backgroundimage.value+"')":"";if(c!=f){d=g.createElement(f);for(c=0;c<a.childNodes.length;c++)d.appendChild(a.childNodes[c].cloneNode(1));for(c=0;c<a.attributes.length;c++)ed.dom.setAttrib(d,a.attributes[c].name,ed.dom.getAttrib(a,a.attributes[c].name));a.parentNode.replaceChild(d,a);a=d}e.setAttrib(a,"style",e.serializeStyle(e.parseStyle(a.style.cssText)));return a}
function changedBackgroundImage(){var a=document.forms[0],b=ed.dom.parseStyle(a.style.value);b["background-image"]="url('"+a.backgroundimage.value+"')";a.style.value=ed.dom.serializeStyle(b)}function changedSize(){var a=document.forms[0],b=ed.dom.parseStyle(a.style.value),e=a.width.value;b.width=e!=""?getCSSSize(e):"";e=a.height.value;b.height=e!=""?getCSSSize(e):"";a.style.value=ed.dom.serializeStyle(b)}
function changedColor(){var a=document.forms[0],b=ed.dom.parseStyle(a.style.value);b["background-color"]=a.bgcolor.value;b["border-color"]=a.bordercolor.value;a.style.value=ed.dom.serializeStyle(b)}
function changedStyle(){var a=document.forms[0],b=ed.dom.parseStyle(a.style.value);a.backgroundimage.value=b["background-image"]?b["background-image"].replace(RegExp("url\\('?([^']*)'?\\)","gi"),"$1"):"";if(b.width)a.width.value=trimSize(b.width);if(b.height)a.height.value=trimSize(b.height);if(b["background-color"]){a.bgcolor.value=b["background-color"];updateColor("bgcolor_pick","bgcolor")}if(b["border-color"]){a.bordercolor.value=b["border-color"];updateColor("bordercolor_pick","bordercolor")}}
tinyMCEPopup.onInit.add(init);