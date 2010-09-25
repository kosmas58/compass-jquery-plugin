/**
 *    Use javascript to write in the CSS rules need for the scrolling extension
 *    making the CSS compatible with the dimensions of most (hopefully all) screens
 *
 *
 *    @author Sam Shull <http://www.google.com/portraits/brickysam26>
 *    @copyright 2010 Sam Shull <http://samshull.blogspot.com/>
 *
 *    Special Thanks to Steve Simitzis <http://saturn5.com>
 *
 *    @license <http://www.opensource.org/licenses/mit-license.html>
 *
 *    Permission is hereby granted, free of charge, to any person obtaining a copy
 *    of this software and associated documentation files (the "Software"), to deal
 *    in the Software without restriction, including without limitation the rights
 *    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *    copies of the Software, and to permit persons to whom the Software is
 *    furnished to do so, subject to the following conditions:
 *    
 *    The above copyright notice and this permission notice shall be included in
 *    all copies or substantial portions of the Software.
 *    
 *    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *    THE SOFTWARE.
 *
 *
 */
(function($) {

var window = this, jqc = window.jQExtensionsPhotoCSS || {};

$(window).load(function()
{
    window.scrollTo(0,0);
    var o = window.innerWidth < window.innerHeight ? "portrait" : "landscape",
        toolbarHeight = jqc.toolbarHeight || $("#jqt .toolbar").outerHeight() || 45,
        parts = {portrait:null, landscape:null},
        css = $.extend({
            defaults: "\
#jqt .jqt-photo .toolbar-bottom{top:{toolbar}px;font-size:30px;text-align:center;vertical-align:top;}\
#jqt .jqt-photo .jqt-photo-image-slide > div{width:{width}px;height:{height}px;line-height:{height}px;border-spacing:0 10px 0 0;\
    overflow:hidden;text-align:center;position:relative;}\
#jqt .jqt-photo .jqt-photo-image-slide .jqt-photo-caption{top:{caption}px;}\n",

            portrait: "#jqt.portrait .jqt-photo{height:{height}px;width:{width}px;}\
            #jqt.portrait .jqt-photo .toolbar-bottom{top:{toolbar}px;font-size:30px;text-align:center;vertical-align:top;}\
#jqt.portrait .jqt-photo .jqt-photo-image-slide > div{width:{width}px;height:{height}px;line-height:{height}px;border-spacing:0 10px 0 0;\
    overflow:hidden;text-align:center;}\
#jqt .jqt-photo .jqt-photo-image-slide .jqt-photo-caption{top:{caption}px;}",
    
            landscape: "#jqt.landscape .jqt-photo{height:{height}px;width:{width}px;}\
#jqt.landscape .jqt-photo .toolbar-bottom{top:{toolbar}px;}\
#jqt.landscape .jqt-photo .jqt-photo-image-list{height:{height}px;}\
#jqt.landscape .jqt-photo .jqt-photo-image-slide > div{height:{height}px;width:{width}px;line-height:{height}px;}\
#jqt .jqt-photo .jqt-photo-image-slide .jqt-photo-caption{top:{caption}px;}"
        }, jqc.css || {});
        
    parts[o] = $.extend({
                    width: window.innerWidth,
                    height: window.innerHeight,
                    toolbar: window.innerHeight - toolbarHeight,
                    caption: window.innerHeight - toolbarHeight - toolbarHeight
                }, 
                jqc[o] || {});
    
    parts.defaults = $.extend({}, parts[o], jqc.defaults || {});
    
    $(document.createElement("style"))
        .attr("type","text/css")
        .html(css.defaults.replace(/\{(\w+)\}/g, function (a, b) {return b in parts.defaults ? parts.defaults[b] : a;}) + 
            css[o].replace(/\{(\w+)\}/g, function (a, b) {return b in parts[o] ? parts[o][b] : a;}))
        .appendTo("head");
    
    $(window).one("orientationchange", function()
    {
        var o = window.innerWidth < window.innerHeight ? "portrait" : "landscape";
        parts[o] = $.extend({
                    width: window.innerWidth,
                    height: window.innerHeight,
                    toolbar: window.innerHeight - toolbarHeight,
                    caption: window.innerHeight - toolbarHeight - toolbarHeight
                }, 
                jqc[o] || {});
        
        $(document.createElement("style"))
            .attr("type","text/css")
            .html(css[o].replace(/\{(\w+)\}/g, function (a, b) {return b in parts[o] ? parts[o][b] : a;}))
            .appendTo("head");
    });
});

})(jQuery);

