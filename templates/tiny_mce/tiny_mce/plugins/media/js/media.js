(function(){var b;if(b=tinyMCEPopup.getParam("media_external_list_url")){document.write('<script language="javascript" type="text/javascript" src="'+tinyMCEPopup.editor.documentBaseURI.toAbsolute(b)+'"><\/script>')}function a(e){return document.getElementById(e)}function d(f){var e=a(f);if(e.nodeName=="SELECT"){return e.options[e.selectedIndex].value}if(e.type=="checkbox"){return e.checked}return e.value}function c(g,e){if(typeof(e)!="undefined"){var f=a(g);if(f.nodeName=="SELECT"){selectByValue(document.forms[0],g,e)}else{if(f.type=="checkbox"){if(typeof(e)=="string"){f.checked=e.toLowerCase()==="true"?true:false}else{f.checked=!!e}}else{f.value=e}}}}window.Media={init:function(){var e,f;this.editor=f=tinyMCEPopup.editor;a("filebrowsercontainer").innerHTML=getBrowserHTML("filebrowser","src","media","media");a("qtsrcfilebrowsercontainer").innerHTML=getBrowserHTML("qtsrcfilebrowser","quicktime_qtsrc","media","media");a("bgcolor_pickcontainer").innerHTML=getColorPickerHTML("bgcolor_pick","bgcolor");a("video_altsource1_filebrowser").innerHTML=getBrowserHTML("filebrowser_altsource1","video_altsource1","media","media");a("video_altsource2_filebrowser").innerHTML=getBrowserHTML("filebrowser_altsource2","video_altsource2","media","media");a("video_poster_filebrowser").innerHTML=getBrowserHTML("filebrowser_poster","video_poster","media","image");e=this.getMediaListHTML("medialist","src","media","media");if(e==""){a("linklistrow").style.display="none"}else{a("linklistcontainer").innerHTML=e}if(isVisible("filebrowser")){a("src").style.width="230px"}if(isVisible("filebrowser_altsource1")){a("video_altsource1").style.width="220px"}if(isVisible("filebrowser_altsource2")){a("video_altsource2").style.width="220px"}if(isVisible("filebrowser_poster")){a("video_poster").style.width="220px"}this.data=tinyMCEPopup.getWindowArg("data");this.dataToForm();this.preview()},insert:function(){var e=tinyMCEPopup.editor;this.formToData();e.execCommand("mceRepaint");tinyMCEPopup.restoreSelection();e.selection.setNode(e.plugins.media.dataToImg(this.data));tinyMCEPopup.close()},preview:function(){a("prev").innerHTML=this.editor.plugins.media.dataToHtml(this.data,true)},moveStates:function(n,m){var i=this.data,j=this.editor,i=this.data,k=j.plugins.media,h,e,o,f,e;f={quicktime_autoplay:true,quicktime_controller:true,flash_play:true,flash_loop:true,flash_menu:true,windowsmedia_autostart:true,windowsmedia_enablecontextmenu:true,windowsmedia_invokeurls:true,realmedia_autogotourl:true,realmedia_imagestatus:true};function g(q){var p={};if(q){tinymce.each(q.split("&"),function(r){var s=r.split("=");p[unescape(s[0])]=unescape(s[1])})}return p}function l(s,v){var r,q,p,u,t;if(s==i.type||s=="global"){v=tinymce.explode(v);for(r=0;r<v.length;r++){q=v[r];p=s=="global"?q:s+"_"+q;if(s=="global"){t=i}else{if(s=="video"){t=i.video.attrs;if(!t&&!n){i.video.attrs=t={}}}else{t=i.params}}if(t){if(n){c(p,t[q])}else{delete t[q];u=d(p);if(s=="video"&&u===true){u=q}if(f[p]){if(u!==f[p]){u=""+u;t[q]=u}}else{if(u){u=""+u;t[q]=u}}}}}}}if(!n){i.type=a("media_type").options[a("media_type").selectedIndex].value;i.width=d("width");i.height=d("height");e=d("src");if(m=="src"){h=e.replace(/^.*\.([^.]+)$/,"$1");if(o=k.getType(h)){i.type=o.name.toLowerCase()}c("media_type",i.type)}if(i.type=="video"){if(!i.video.sources){i.video.sources=[]}i.video.sources[0]={src:d("src")}}}a("video_options").style.display="none";a("flash_options").style.display="none";a("quicktime_options").style.display="none";a("shockwave_options").style.display="none";a("windowsmedia_options").style.display="none";a("realmedia_options").style.display="none";if(a(i.type+"_options")){a(i.type+"_options").style.display="block"}c("media_type",i.type);l("flash","play,loop,menu,swliveconnect,quality,scale,salign,wmode,base,flashvars");l("quicktime","loop,autoplay,cache,controller,correction,enablejavascript,kioskmode,autohref,playeveryframe,targetcache,scale,starttime,endtime,target,qtsrcchokespeed,volume,qtsrc");l("shockwave","sound,progress,autostart,swliveconnect,swvolume,swstretchstyle,swstretchhalign,swstretchvalign");l("windowsmedia","autostart,enabled,enablecontextmenu,fullscreen,invokeurls,mute,stretchtofit,windowlessvideo,balance,baseurl,captioningid,currentmarker,currentposition,defaultframe,playcount,rate,uimode,volume");l("realmedia","autostart,loop,autogotourl,center,imagestatus,maintainaspect,nojava,prefetch,shuffle,console,controls,numloop,scriptcallbacks");l("video","poster,autoplay,loop,preload,controls");l("global","id,name,vspace,hspace,bgcolor,align,width,height");if(n){if(i.type=="video"){if(i.video.sources[0]){c("src",i.video.sources[0].src)}e=i.video.sources[1];if(e){c("video_altsource1",e.src)}e=i.video.sources[2];if(e){c("video_altsource2",e.src)}}else{if(i.type=="flash"){tinymce.each(j.getParam("flash_video_player_flashvars",{url:"$url",poster:"$poster"}),function(q,p){if(q=="$url"){i.params.src=g(i.params.flashvars)[p]||i.params.src}})}c("src",i.params.src)}}else{e=d("src");if(e.match(/youtube.com(.+)v=([^&]+)/)){i.width=425;i.height=350;i.params.frameborder="0";i.type="iframe";e="http://www.youtube.com/embed/"+e.match(/v=([^&]+)/)[1];c("src",e);c("media_type",i.type)}if(e.match(/video.google.com(.+)docid=([^&]+)/)){i.width=425;i.height=326;i.type="flash";e="http://video.google.com/googleplayer.swf?docId="+e.match(/docid=([^&]+)/)[1]+"&hl=en";c("src",e);c("media_type",i.type)}if(i.type=="video"){if(!i.video.sources){i.video.sources=[]}i.video.sources[0]={src:e};e=d("video_altsource1");if(e){i.video.sources[1]={src:e}}e=d("video_altsource2");if(e){i.video.sources[2]={src:e}}}else{i.params.src=e}c("width",i.width||320);c("height",i.height||240)}},dataToForm:function(){this.moveStates(true)},formToData:function(e){if(e=="width"||e=="height"){this.changeSize(e)}if(e=="source"){this.moveStates(false,e);c("source",this.editor.plugins.media.dataToHtml(this.data));this.panel="source"}else{if(this.panel=="source"){this.data=this.editor.plugins.media.htmlToData(d("source"));this.dataToForm();this.panel=""}this.moveStates(false,e);this.preview()}},beforeResize:function(){this.width=parseInt(d("width")||"320",10);this.height=parseInt(d("height")||"240",10)},changeSize:function(h){var g,e,i,f;if(a("constrain").checked){g=parseInt(d("width")||"320",10);e=parseInt(d("height")||"240",10);if(h=="width"){this.height=Math.round((g/this.width)*e);c("height",this.height)}else{this.width=Math.round((e/this.height)*g);c("width",this.width)}}},getMediaListHTML:function(){if(typeof(tinyMCEMediaList)!="undefined"&&tinyMCEMediaList.length>0){var f="";f+='<select id="linklist" name="linklist" style="width: 250px" onchange="this.form.src.value=this.options[this.selectedIndex].value;Media.formToData(\'src\');">';f+='<option value="">---</option>';for(var e=0;e<tinyMCEMediaList.length;e++){f+='<option value="'+tinyMCEMediaList[e][1]+'">'+tinyMCEMediaList[e][0]+"</option>"}f+="</select>";return f}return""}};tinyMCEPopup.requireLangPack();tinyMCEPopup.onInit.add(function(){Media.init()})})();