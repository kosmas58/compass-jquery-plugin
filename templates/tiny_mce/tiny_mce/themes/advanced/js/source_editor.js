tinyMCEPopup.requireLangPack();tinyMCEPopup.onInit.add(onLoadInit);function saveContent(){tinyMCEPopup.editor.setContent(document.getElementById("htmlSource").value,{source_view:true});tinyMCEPopup.close()}
function onLoadInit(){tinyMCEPopup.resizeToInnerSize();if(tinymce.isGecko)document.body.spellcheck=tinyMCEPopup.editor.getParam("gecko_spellcheck");document.getElementById("htmlSource").value=tinyMCEPopup.editor.getContent({source_view:true});if(tinyMCEPopup.editor.getParam("theme_advanced_source_editor_wrap",true)){setWrap("soft");document.getElementById("wraped").checked=true}resizeInputs()}
function setWrap(a){var b,d,c=document.getElementById("htmlSource");c.wrap=a;if(!tinymce.isIE){b=c.value;d=c.cloneNode(false);d.setAttribute("wrap",a);c.parentNode.replaceChild(d,c);d.value=b}}function toggleWordWrap(a){a.checked?setWrap("soft"):setWrap("off")}function resizeInputs(){var a=tinyMCEPopup.dom.getViewPort(window),b;if(b=document.getElementById("htmlSource")){b.style.width=a.w-20+"px";b.style.height=a.h-65+"px"}};