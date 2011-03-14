var themeBaseURL=tinyMCEPopup.editor.baseURI.toAbsolute("themes/"+tinyMCEPopup.getParam("theme"));
function getColorPickerHTML(a,e){var c="",d=tinyMCEPopup.dom;if(label=d.select("label[for="+e+"]")[0])label.id=label.id||d.uniqueId();c+='<a role="button" aria-labelledby="'+a+'_label" id="'+a+'_link" href="javascript:;" onclick="tinyMCEPopup.pickColor(event,\''+e+'\');" onmousedown="return false;" class="pickcolor">';c+='<span id="'+a+'" title="'+tinyMCEPopup.getLang("browse")+'">&nbsp;<span id="'+a+'_label" class="mceVoiceLabel mceIconOnly" style="display:none;">'+tinyMCEPopup.getLang("browse")+
"</span></span></a>";return c}function updateColor(a,e){document.getElementById(a).style.backgroundColor=document.forms[0].elements[e].value}function setBrowserDisabled(a,e){var c=document.getElementById(a),d=document.getElementById(a+"_link");if(d)if(e){d.setAttribute("realhref",d.getAttribute("href"));d.removeAttribute("href");tinyMCEPopup.dom.addClass(c,"disabled")}else{d.getAttribute("realhref")&&d.setAttribute("href",d.getAttribute("realhref"));tinyMCEPopup.dom.removeClass(c,"disabled")}}
function getBrowserHTML(a,e,c,d){d=d+"_"+c+"_browser_callback";var f;if(!tinyMCEPopup.getParam(d,tinyMCEPopup.getParam("file_browser_callback")))return"";f="";f+='<a id="'+a+'_link" href="javascript:openBrowser(\''+a+"','"+e+"', '"+c+"','"+d+'\');" onmousedown="return false;" class="browse">';f+='<span id="'+a+'" title="'+tinyMCEPopup.getLang("browse")+'">&nbsp;</span></a>';return f}
function openBrowser(a,e,c,d){document.getElementById(a).className!="mceButtonDisabled"&&tinyMCEPopup.openBrowser(e,c,d)}function selectByValue(a,e,c,d,f){if(a&&a.elements[e]){c||(c="");a=a.elements[e];e=false;for(var i=0;i<a.options.length;i++){var h=a.options[i];if(h.value==c||f&&h.value.toLowerCase()==c.toLowerCase())e=h.selected=true;else h.selected=false}if(!e&&d&&c!=""){h=new Option(c,c);h.selected=true;a.options[a.options.length]=h;a.selectedIndex=a.options.length-1}return e}}
function getSelectValue(a,e){var c=a.elements[e];if(c==null||c.options==null||c.selectedIndex===-1)return"";return c.options[c.selectedIndex].value}function addSelectValue(a,e,c,d){a=a.elements[e];c=new Option(c,d);a.options[a.options.length]=c}
function addClassesToList(a,e){var c=document.getElementById(a),d=tinyMCEPopup.getParam("theme_advanced_styles",false);if(d=tinyMCEPopup.getParam(e,d)){d=d.split(";");for(var f=0;f<d.length;f++)if(d!=""){var i,h;i=d[f].split("=")[0];h=d[f].split("=")[1];c.options[c.length]=new Option(i,h)}}else tinymce.each(tinyMCEPopup.editor.dom.getClasses(),function(j){c.options[c.length]=new Option(j.title||j["class"],j["class"])})}
function isVisible(a){return(a=document.getElementById(a))&&a.style.display!="none"}function convertRGBToHex(a){var e=a.replace(RegExp("rgb\\s*\\(\\s*([0-9]+).*,\\s*([0-9]+).*,\\s*([0-9]+).*\\)","gi"),"$1,$2,$3").split(",");if(e.length==3){r=parseInt(e[0]).toString(16);g=parseInt(e[1]).toString(16);b=parseInt(e[2]).toString(16);r=r.length==1?"0"+r:r;g=g.length==1?"0"+g:g;b=b.length==1?"0"+b:b;return"#"+r+g+b}return a}
function convertHexToRGB(a){if(a.indexOf("#")!=-1){a=a.replace(RegExp("[^0-9A-F]","gi"),"");r=parseInt(a.substring(0,2),16);g=parseInt(a.substring(2,4),16);b=parseInt(a.substring(4,6),16);return"rgb("+r+","+g+","+b+")"}return a}function trimSize(a){return a.replace(/([0-9\.]+)px|(%|in|cm|mm|em|ex|pt|pc)/,"$1$2")}function getCSSSize(a){a=trimSize(a);if(a=="")return"";if(/^[0-9]+$/.test(a))a+="px";return a}
function getStyle(a,e,c){var d=tinyMCEPopup.dom.getAttrib(a,e);if(d!="")return""+d;if(typeof c=="undefined")c=e;return tinyMCEPopup.dom.getStyle(a,c)};