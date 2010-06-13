/*

jQTouch Gallery v0.1

Created by Ryan McKillen <http://ryonlife.com>
Project hosted on GitHub <http://github.com/RyOnLife/jQTouch-Gallery>
  
  Wiki/Documentation <http://wiki.github.com/RyOnLife/jQTouch-Gallery>
  Isuues <http://github.com/RyOnLife/jQTouch-Gallery/issues>
    
Not possible without the awesome efforts behind the jQTouch project <http://jqtouch.com>
    
Copyright (c) 2009 by Ryan McKillen
See LICENSE for MIT license details

*/

(function($) {
  if($.jQTouch) {
    $.jQTouch.addExtension(function gallery(jQTouch){  
      var settings = {}, load = 0, ww = $(window).width(), wh = window.innerHeight;
      jQT.addAnimation({
        name: 'flipRight',
        selector: '.flipRight'
      });

      function gallery_init(options) {
        var defaults = {
          preload: 1,
          toggleToolbars: 5000,
          done: 'home'
        };
        settings = $.extend({}, defaults, options);
        load = settings.preload;
          
        for(var i = 0; i < settings.media.length; i++) buildPage(i);

        $('.gallery')
          .bind('pageAnimationStart', function(e, info){
            if(info.direction == 'in') {
              toolbarsOn($(this));
              preloadNextMediaItem();
            }
          })
          .bind('swipe', function(evt, data){
            $('a.arrow_' + data.direction, $(this)).click();
          });
        
        $(window).bind('resize', function(){
          if($('.gallery.current').length) windowChangeAdjustPage();
        });

        // Opaque text on trans toolbars, append page num to gallery link, count media
        var toolbarBg = $('.gallery .toolbar').css('background-image');
        $('.gallery .toolbar').css({background: 'none'});
        $('.gallery .toolbar .transparent').css({backgroundImage: toolbarBg});
        $('a[href="#' + settings.gallery + '"]')
          .attr('href', '#' + settings.gallery + '_1')
          .parent()
          .children('small')
          .text(settings.media.length);
      }

      function buildPage(i) {
        var id = settings.gallery + '_' + eval(i + 1);
        if($('#' + id).length) return; // Page exists
        
        // Markup
        var caption = (settings.media[i].caption) ? '<div class="caption">' + settings.media[i].caption + '<div class="caption_transparent"></div></div>' : '';
        $('body').append('<div id="' + id + '" class="gallery" style="height:' + wh + 'px;"><div class="toolbar"><h1>' + settings.title + '</h1><a class="cancel slide" href="#' + settings.done + '">Done</a>' + caption + '<div class="transparent"></div></div><div class="toolbar gallery_toolbar"><h1>' + eval(i + 1) + ' of ' + settings.media.length + '</h1><a href="#" class="gallery_arrow arrow_left flip"></a><a href="#" class="gallery_arrow arrow_right flipRight"></a><div class="transparent"></div></div><div class="play"></div></div>');
        
        // Navigation
        if(settings.media.length > 1) {
          var g = $('#' + id);
          var leftLink = (i == 0) ? settings.media.length : i;
          var rightLink = (i == settings.media.length - 1) ? 1 : i + 2;
          $('a.gallery_arrow', g)
            .filter('.arrow_left')
            .attr({href: '#' + settings.gallery + '_' + leftLink})
            .end()
            .filter('.arrow_right')
            .attr({href: '#' + settings.gallery + '_' + rightLink});              
        }

        if(i < settings.preload) addMediaToPage(i, g);
        positionArrows(g);
      }

      function addMediaToPage(i, g) {
        var media = $('<img src="' + settings.media[i].image + '" class="media" />');
        
        if(settings.media[i].youtube) {
          media
            .addClass('youtube')
            .attr({src: 'http://img.youtube.com/vi/' + settings.media[i].youtube + '/0.jpg'})
          $('.play', g).bind('click', function(){
            document.location.href = 'http://www.youtube.com/watch?v=' + settings.media[i].youtube;
          });
        }
        
        media.load(function(){
          mediaLearnSize($(this));
          fillPageWithMedia($(this));
          $('.toolbar:first-child', g).after($(this));
          if($(this).hasClass('youtube')) positionArrows(g); // Necessary for play arrow to show in Safari (Mobile WebKit not affected)
          $(this).bind('click', function(){ // .gallery bind would be better, but too easy for arrow tap to trigger instead of desired navigation (Safari not affected)
            toolbarsToggle(g);
          });
          if(i >= settings.preload) preloadNextMediaItem();        
        });
      }
      
      function mediaLearnSize(media) {
        media
          .appendTo('body')
          .addClass('measure')
          .data('size', {
            mw: media.width(),
            mh: media.height()
          })
          .removeClass('measure');
      }      
      
      function preloadNextMediaItem() {
        if(load < settings.media.length) {
          addMediaToPage(load, $('#' + settings.gallery + '_' + eval(load + 1)));
          load++;        
        }
      }      

      function fillPageWithMedia(media) {
        var mw = media.data('size').mw;
        var mh = media.data('size').mh;
        if(mw > mh) { 
          mh = (mw < ww) ?
            mh * ((ww - mw) / mw + 1):
            mh * (1 + ((ww - mw) / mw));
          mw = ww;
        } else {
          mw = (mw < wh) ?
            mw * ((wh - mh) / mh + 1):
            mw * (1 + ((wh - mh) / mh));
          mh = wh;
        }
        media
          .attr({
            width: mw,
            height: mh
          })
          .css({
            left: ww / 2 - mw / 2 + 'px',
            top: wh / 2 - mh / 2 + 'px'
          });        
      }     

      function toolbarsOn(g) {
        if(settings.toggleToolbars) {
          $('.toolbar', g)
            .data('auto', true)
            .removeClass('hidden')
            .show(function(){
              setTimeout(function(){ // Auto toggle off...
                if($('.toolbar', g).data('auto')) { // Unless user has already toggled
                  $('.toolbar', g)
                    .addClass('hidden')
                    .fadeOut('fast');
                }
              }, settings.toggleToolbars);
          });
        }
      }      
      
      function toolbarsToggle(g) {
        if(settings.toggleToolbars) {
          $('.toolbar', g).data('auto', false); // User toggle cancels pending auto toggle
          if($('.toolbar', g).hasClass('hidden')) {
            $('.toolbar', g)
              .removeClass('hidden')
              .fadeIn('fast');
          } else {
            $('.toolbar', g)
              .addClass('hidden')
              .fadeOut('fast');
          }
        }
      }

      function windowChangeAdjustPage() {
        if(ww != $(window).width() || wh != window.innerHeight) {
          ww = $(window).width()
          wh = window.innerHeight;
          $('.gallery').each(function(){
            $(this).css({height: wh + 'px'});
            fillPageWithMedia($('.media', $(this)));
            positionArrows($(this));
          });                       
        }
      }

      function positionArrows(g) {
        var as = sizeFromCSS($('a.gallery_arrow', g));
        var ts = sizeFromCSS($('.toolbar .transparent', g));
        var hs = sizeFromCSS($('h1', g));
        
        var x = ww / 2 - as[0] + hs[0] / 2 + 10 + 'px';
        var y = ts[1] / 2 - as[1] / 2 + 'px';
        
        $('a.gallery_arrow', g)
          .css({
            bottom: y,
            display: 'block'
          })
          .filter('.arrow_left')
          .css({right: x})
          .end()
          .filter('.arrow_right')
          .css({left: x});
        
        if($('.youtube', g).length) {
          var ps = sizeFromCSS($('.play'));
          $('.play', g).css({
            left: ww / 2 - ps[0] / 2 + 'px',
            top: wh / 2 - ps[1] / 2 + 'px',
            display: 'block'
          });
        }
      }
      
      function sizeFromCSS(el) {
        var w = el.css('width');
        var h = el.css('height');
        w = parseInt(w.substring(0, w.length - 2));
        h = parseInt(h.substring(0, h.length - 2));
        return [w, h];
      }   
      
      return {gallery_init: gallery_init}
    });
  }
})(jQuery);