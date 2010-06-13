/**
 * touch for jQuery
 * 
 * Copyright (c) 2008 Peter Schmalfeldt (ManifestInteractive.com) <manifestinteractive@gmail.com>
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details. 
 *
 * @license http://www.gnu.org/licenses/gpl.html 
 * @project jquery.touch
 */

// DEFINE DEFAULT VARIABLES
var _target=null, _dragx=null, _dragy=null, _rotate=null, _resort=null;
var _dragging=false, _sizing=false, _animate=false;
var _rotating=0, _width=0, _height=0, _left=0, _top=0, _xspeed=0, _yspeed=0;
var _zindex=1000;

jQuery.fn.touch = function(settings) {

	// DEFINE DEFAULT TOUCH SETTINGS
	settings = jQuery.extend({
		animate: true,
		sticky: false,
		dragx: true,
		dragy: true,
		rotate: false,
		resort: true,
		scale: false
	}, settings);
	
	// BUILD SETTINGS OBJECT
	var opts = [];
	opts = $.extend({}, $.fn.touch.defaults, settings);
	
	// ADD METHODS TO OBJECT
	this.each(function(){
		this.opts = opts;
		this.ontouchstart = touchstart;
		this.ontouchend = touchend;
		this.ontouchmove = touchmove;
		this.ongesturestart = gesturestart;
		this.ongesturechange = gesturechange;
		this.ongestureend = gestureend;
	});
};
function touchstart(e){
	_target = this.id;
	_dragx = this.opts.dragx;
	_dragy = this.opts.dragy;
	_resort = this.opts.resort;
	_animate = this.opts.animate;
	_xspeed = 0;
	_yspeed = 0;

	$(e.changedTouches).each(function(){
									  
		var curLeft = ($('#'+_target).css("left") == 'auto') ? this.pageX : parseInt($('#'+_target).css("left"));
		var curTop = ($('#'+_target).css("top") == 'auto') ? this.pageY : parseInt($('#'+_target).css("top"));
		
		if(!_dragging && !_sizing){
			_left = (e.pageX - curLeft);
			_top = (e.pageY - curTop);
			_dragging = [_left,_top];
			if(_resort){
				_zindex = ($('#'+_target).css("z-index") == _zindex) ? _zindex : _zindex+1;
				$('#'+_target).css({ zIndex: _zindex });
			}
		}
	});
};
function touchmove(e){
	
	if(_dragging && !_sizing && _animate) {
		
		var _lastleft = (isNaN(parseInt($('#'+_target).css("left")))) ? 0:parseInt($('#'+_target).css("left"));
		var _lasttop = (isNaN(parseInt($('#'+_target).css("top")))) ? 0:parseInt($('#'+_target).css("top"));
	}
	
	$(e.changedTouches).each(function(){
		
		e.preventDefault();
		
		_left = (this.pageX-(parseInt($('#'+_target).css("width"))/2));
		_top = (this.pageY-(parseInt($('#'+_target).css("height"))/2));
		
		if(_dragging && !_sizing) {
			
			if(_animate){
				_xspeed = Math.round((_xspeed + Math.round( _left - _lastleft))/1.5);
				_yspeed = Math.round((_yspeed + Math.round( _top - _lasttop))/1.5);
			}
			
			if(_dragx || _dragy) $('#'+_target).css({ position: "absolute" });
			if(_dragx) $('#'+_target).css({ left: _left+"px" });
			if(_dragy) $('#'+_target).css({ top: _top+"px" });
			
			$('#'+_target).css({ backgroundColor: "#4B880B" });
			$('#'+_target+' b').text('WEEEEEEEE!!!!');
		}
	});
};
function touchend(e){
	$(e.changedTouches).each(function(){
		if(!e.targetTouches.length){
			_dragging = false;
			if(_animate){
				_left = ($('#'+_target).css("left") == 'auto') ? this.pageX : parseInt($('#'+_target).css("left"));
				_top = ($('#'+_target).css("top") == 'auto') ? this.pageY : parseInt($('#'+_target).css("top"));
				
				var animx = (_dragx) ? (_left+_xspeed)+"px" : _left+"px";
				var animy = (_dragy) ? (_top+_yspeed)+"px" : _top+"px";
				
				if(_dragx || _dragy) $('#'+_target).animate({ left: animx, top: animy }, "fast");
			}
		}
	});
	
	$('#'+_target+' b').text('I am sad :(');
	$('#'+_target).css({ backgroundColor: "#0B4188" });
	setTimeout(changeBack,5000,_target);
};
function gesturestart(e){
	_sizing = [$('#'+this.id).css("width"), $('#'+this.id).css("height")];
};
function gesturechange(e){
	if(_sizing){
		_width = (this.opts.scale) ? Math.min(parseInt(_sizing[0])*e.scale, 300) : _sizing[0];
		_height = (this.opts.scale) ? Math.min(parseInt(_sizing[1])*e.scale, 300) : _sizing[1];
		_rotate = (this.opts.rotate) ? "rotate(" + ((_rotating + e.rotation) % 360) + "deg)" : "0deg";		
		$('#'+this.id).css({ width: _width+"px", height: _height+"px", webkitTransform: _rotate });
		$('#'+this.id+' b').text('TRANSFORM!');
		$('#'+this.id).css({ backgroundColor: "#4B880B" });
	}
};
function gestureend(e){
	_sizing = false;
	_rotating = (_rotating + e.rotation) % 360;
};

function changeBack(target){
	$('#'+target+' b').text('Touch Me :)');
	$('#'+target).css({ backgroundColor: "#999" });
}