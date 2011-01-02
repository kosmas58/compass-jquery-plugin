;(function($){
/**
 * jqGrid extension for jquery.contextmenu plugin
 * Extracted out of grid.base.js written by Tony Tomov tony@trirand.com
 * Kosmas Schuetz
 * http://github.com/kosmas58/compass-jquery-plugin 
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl-2.0.html
**/
$.jgrid.extend({
  contextMenu : function(e) {
    //var ts = this.elem;
    //td = e.target;
    //ptr = $(td,ts.rows).closest("tr.jqgrow");
    //if($(ptr).length === 0 ){return false;}
    //if(!ts.p.multiselect) { $(ts).jqGrid("setSelection",ptr[0].id,true);  }
    //ri = ptr[0].rowIndex;
    //ci = $.jgrid.getCellIndex(td);
    //ts.p.onRightClickRow.call(ts,$(ptr).attr("id"),ri,ci, e);
    alert("aa");
    return false;
  }
});
})(jQuery);
