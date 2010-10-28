/*
 * jsTree 1.0-rc3
 * http://jstree.com/
 *
 * Copyright (c) 2010 Ivan Bozhanov (vakata.com)
 *
 * Licensed same as jquery - under the terms of either the MIT License or the GPL Version 2 License
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * $Date: 2010-10-19 17:28:14 +0200 (Di, 19. Okt 2010) $
 * $Revision: 226 $
 */

/*jslint browser: true, onevar: true, undef: true, bitwise: true, strict: true */
/*global window : false, clearInterval: false, clearTimeout: false, document: false, setInterval: false, setTimeout: false, jQuery: false, navigator: false, XSLTProcessor: false, DOMParser: false, XMLSerializer: false*/

"use strict";

// top wrapper to prevent multiple inclusion (is this OK?)
(function () { if(jQuery && jQuery.jstree) { return; }
    var is_ie6 = false, is_ie7 = false, is_ff2 = false;

// Common functions not related to jsTree 
// decided to move them to a `vakata` "namespace"
(function ($) {
    $.vakata = {};
    // CSS related functions
    $.vakata.css = {
        get_css : function(rule_name, delete_flag, sheet) {
            rule_name = rule_name.toLowerCase();
            var css_rules = sheet.cssRules || sheet.rules,
                j = 0;
            do {
                if(css_rules.length && j > css_rules.length + 5) { return false; }
                if(css_rules[j].selectorText && css_rules[j].selectorText.toLowerCase() == rule_name) {
                    if(delete_flag === true) {
                        if(sheet.removeRule) { sheet.removeRule(j); }
                        if(sheet.deleteRule) { sheet.deleteRule(j); }
                        return true;
                    }
                    else { return css_rules[j]; }
                }
            }
            while (css_rules[++j]);
            return false;
        },
        add_css : function(rule_name, sheet) {
            if($.jstree.css.get_css(rule_name, false, sheet)) { return false; }
            if(sheet.insertRule) { sheet.insertRule(rule_name + ' { }', 0); } else { sheet.addRule(rule_name, null, 0); }
            return $.vakata.css.get_css(rule_name);
        },
        remove_css : function(rule_name, sheet) { 
            return $.vakata.css.get_css(rule_name, true, sheet); 
        },
        add_sheet : function(opts) {
            var tmp = false, is_new = true;
            if(opts.str) {
                if(opts.title) { tmp = $("style[id='" + opts.title + "-stylesheet']")[0]; }
                if(tmp) { is_new = false; }
                else {
                    tmp = document.createElement("style");
                    tmp.setAttribute('type',"text/css");
                    if(opts.title) { tmp.setAttribute("id", opts.title + "-stylesheet"); }
                }
                if(tmp.styleSheet) {
                    if(is_new) { 
                        document.getElementsByTagName("head")[0].appendChild(tmp); 
                        tmp.styleSheet.cssText = opts.str; 
                    }
                    else {
                        tmp.styleSheet.cssText = tmp.styleSheet.cssText + " " + opts.str; 
                    }
                }
                else {
                    tmp.appendChild(document.createTextNode(opts.str));
                    document.getElementsByTagName("head")[0].appendChild(tmp);
                }
                return tmp.sheet || tmp.styleSheet;
            }
            if(opts.url) {
                if(document.createStyleSheet) {
                    try { tmp = document.createStyleSheet(opts.url); } catch (e) { }
                }
                else {
                    tmp			= document.createElement('link');
                    tmp.rel		= 'stylesheet';
                    tmp.type	= 'text/css';
                    tmp.media	= "all";
                    tmp.href	= opts.url;
                    document.getElementsByTagName("head")[0].appendChild(tmp);
                    return tmp.styleSheet;
                }
            }
        }
    };
})(jQuery);
