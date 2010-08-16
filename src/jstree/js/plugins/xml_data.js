/*
 * jsTree XML 1.0
 * The XML data store. Datastores are build by overriding the `load_node` and `_is_loaded` functions.
 */
(function ($) {
	$.vakata.xslt = function (xml, xsl, callback) {
		var rs = "", xm, xs, processor, support;
		if(document.recalc) {
			xm = document.createElement('xml');
			xs = document.createElement('xml');
			xm.innerHTML = xml;
			xs.innerHTML = xsl;
			$("body").append(xm).append(xs);
			setTimeout( (function (xm, xs, callback) {
				return function () {
					callback.call(null, xm.transformNode(xs.XMLDocument));
					setTimeout( (function (xm, xs) { return function () { jQuery("body").remove(xm).remove(xs); }; })(xm, xs), 200);
				};
			}) (xm, xs, callback), 100);
			return true;
		}
		if(typeof window.DOMParser !== "undefined" && typeof window.XMLHttpRequest !== "undefined" && typeof window.XSLTProcessor !== "undefined") {
			processor = new XSLTProcessor();
			support = $.isFunction(processor.transformDocument) ? (typeof window.XMLSerializer !== "undefined") : true;
			if(!support) { return false; }
			xml = new DOMParser().parseFromString(xml, "text/xml");
			xsl = new DOMParser().parseFromString(xsl, "text/xml");
			if($.isFunction(processor.transformDocument)) {
				rs = document.implementation.createDocument("", "", null);
				processor.transformDocument(xml, xsl, rs, null);
				callback.call(null, XMLSerializer().serializeToString(rs));
				return true;
			}
			else {
				processor.importStylesheet(xsl);
				rs = processor.transformToFragment(xml, document);
				callback.call(null, $("<div>").append(rs).html());
				return true;
			}
		}
		return false;
	};
	var xsl = {
		'nest' : '<?xml version="1.0" encoding="utf-8" ?>' +
			'<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >' +
			'<xsl:output method="html" encoding="utf-8" omit-xml-declaration="yes" standalone="no" indent="no" media-type="text/html" />' +
			'<xsl:template match="/">' +
			'	<xsl:call-template name="nodes">' +
			'		<xsl:with-param name="node" select="/root" />' +
			'	</xsl:call-template>' +
			'</xsl:template>' +
			'<xsl:template name="nodes">' +
			'	<xsl:param name="node" />' +
			'	<ul>' +
			'	<xsl:for-each select="$node/item">' +
			'		<xsl:variable name="children" select="count(./item) &gt; 0" />' +
			'		<li>' +
			'			<xsl:attribute name="class">' +
			'				<xsl:if test="position() = last()">jstree-last </xsl:if>' +
			'				<xsl:choose>' +
			'					<xsl:when test="@state = \'open\'">jstree-open </xsl:when>' +
			'					<xsl:when test="$children or @hasChildren or @state = \'closed\'">jstree-closed </xsl:when>' +
			'					<xsl:otherwise>jstree-leaf </xsl:otherwise>' +
			'				</xsl:choose>' +
			'				<xsl:value-of select="@class" />' +
			'			</xsl:attribute>' +
			'			<xsl:for-each select="@*">' +
			'				<xsl:if test="name() != \'class\' and name() != \'state\' and name() != \'hasChildren\'">' +
			'					<xsl:attribute name="{name()}"><xsl:value-of select="." /></xsl:attribute>' +
			'				</xsl:if>' +
			'			</xsl:for-each>' +
			'	<ins class="jstree-icon"><xsl:text>&#xa0;</xsl:text></ins>' +
			'			<xsl:for-each select="content/name">' +
			'				<a>' +
			'				<xsl:attribute name="href">' +
			'					<xsl:choose>' +
			'					<xsl:when test="@href"><xsl:value-of select="@href" /></xsl:when>' +
			'					<xsl:otherwise>#</xsl:otherwise>' +
			'					</xsl:choose>' +
			'				</xsl:attribute>' +
			'				<xsl:attribute name="class"><xsl:value-of select="@lang" /> <xsl:value-of select="@class" /></xsl:attribute>' +
			'				<xsl:attribute name="style"><xsl:value-of select="@style" /></xsl:attribute>' +
			'				<xsl:for-each select="@*">' +
			'					<xsl:if test="name() != \'style\' and name() != \'class\' and name() != \'href\'">' +
			'						<xsl:attribute name="{name()}"><xsl:value-of select="." /></xsl:attribute>' +
			'					</xsl:if>' +
			'				</xsl:for-each>' +
			'					<ins>' +
			'						<xsl:attribute name="class">jstree-icon ' +
			'							<xsl:if test="string-length(attribute::icon) > 0 and not(contains(@icon,\'/\'))"><xsl:value-of select="@icon" /></xsl:if>' +
			'						</xsl:attribute>' +
			'						<xsl:if test="string-length(attribute::icon) > 0 and contains(@icon,\'/\')"><xsl:attribute name="style">background:url(<xsl:value-of select="@icon" />) center center no-repeat;</xsl:attribute></xsl:if>' +
			'						<xsl:text>&#xa0;</xsl:text>' +
			'					</ins>' +
			'					<xsl:value-of select="current()" />' +
			'				</a>' +
			'			</xsl:for-each>' +
			'			<xsl:if test="$children or @hasChildren"><xsl:call-template name="nodes"><xsl:with-param name="node" select="current()" /></xsl:call-template></xsl:if>' +
			'		</li>' +
			'	</xsl:for-each>' +
			'	</ul>' +
			'</xsl:template>' +
			'</xsl:stylesheet>',

		'flat' : '<?xml version="1.0" encoding="utf-8" ?>' +
			'<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >' +
			'<xsl:output method="html" encoding="utf-8" omit-xml-declaration="yes" standalone="no" indent="no" media-type="text/xml" />' +
			'<xsl:template match="/">' +
			'	<ul>' +
			'	<xsl:for-each select="//item[not(@parent_id) or @parent_id=0 or not(@parent_id = //item/@id)]">' + /* the last `or` may be removed */
			'		<xsl:call-template name="nodes">' +
			'			<xsl:with-param name="node" select="." />' +
			'			<xsl:with-param name="is_last" select="number(position() = last())" />' +
			'		</xsl:call-template>' +
			'	</xsl:for-each>' +
			'	</ul>' +
			'</xsl:template>' +
			'<xsl:template name="nodes">' +
			'	<xsl:param name="node" />' +
			'	<xsl:param name="is_last" />' +
			'	<xsl:variable name="children" select="count(//item[@parent_id=$node/attribute::id]) &gt; 0" />' +
			'	<li>' +
			'	<xsl:attribute name="class">' +
			'		<xsl:if test="$is_last = true()">jstree-last </xsl:if>' +
			'		<xsl:choose>' +
			'			<xsl:when test="@state = \'open\'">jstree-open </xsl:when>' +
			'			<xsl:when test="$children or @hasChildren or @state = \'closed\'">jstree-closed </xsl:when>' +
			'			<xsl:otherwise>jstree-leaf </xsl:otherwise>' +
			'		</xsl:choose>' +
			'		<xsl:value-of select="@class" />' +
			'	</xsl:attribute>' +
			'	<xsl:for-each select="@*">' +
			'		<xsl:if test="name() != \'parent_id\' and name() != \'hasChildren\' and name() != \'class\' and name() != \'state\'">' +
			'		<xsl:attribute name="{name()}"><xsl:value-of select="." /></xsl:attribute>' +
			'		</xsl:if>' +
			'	</xsl:for-each>' +
			'	<ins class="jstree-icon"><xsl:text>&#xa0;</xsl:text></ins>' +
			'	<xsl:for-each select="content/name">' +
			'		<a>' +
			'		<xsl:attribute name="href">' +
			'			<xsl:choose>' +
			'			<xsl:when test="@href"><xsl:value-of select="@href" /></xsl:when>' +
			'			<xsl:otherwise>#</xsl:otherwise>' +
			'			</xsl:choose>' +
			'		</xsl:attribute>' +
			'		<xsl:attribute name="class"><xsl:value-of select="@lang" /> <xsl:value-of select="@class" /></xsl:attribute>' +
			'		<xsl:attribute name="style"><xsl:value-of select="@style" /></xsl:attribute>' +
			'		<xsl:for-each select="@*">' +
			'			<xsl:if test="name() != \'style\' and name() != \'class\' and name() != \'href\'">' +
			'				<xsl:attribute name="{name()}"><xsl:value-of select="." /></xsl:attribute>' +
			'			</xsl:if>' +
			'		</xsl:for-each>' +
			'			<ins>' +
			'				<xsl:attribute name="class">jstree-icon ' +
			'					<xsl:if test="string-length(attribute::icon) > 0 and not(contains(@icon,\'/\'))"><xsl:value-of select="@icon" /></xsl:if>' +
			'				</xsl:attribute>' +
			'				<xsl:if test="string-length(attribute::icon) > 0 and contains(@icon,\'/\')"><xsl:attribute name="style">background:url(<xsl:value-of select="@icon" />) center center no-repeat;</xsl:attribute></xsl:if>' +
			'				<xsl:text>&#xa0;</xsl:text>' +
			'			</ins>' +
			'			<xsl:value-of select="current()" />' +
			'		</a>' +
			'	</xsl:for-each>' +
			'	<xsl:if test="$children">' +
			'		<ul>' +
			'		<xsl:for-each select="//item[@parent_id=$node/attribute::id]">' +
			'			<xsl:call-template name="nodes">' +
			'				<xsl:with-param name="node" select="." />' +
			'				<xsl:with-param name="is_last" select="number(position() = last())" />' +
			'			</xsl:call-template>' +
			'		</xsl:for-each>' +
			'		</ul>' +
			'	</xsl:if>' +
			'	</li>' +
			'</xsl:template>' +
			'</xsl:stylesheet>'
	};
	$.jstree.plugin("xml_data", {
		defaults : {
			data : false,
			ajax : false,
			xsl : "flat",
			clean_node : false,
			correct_state : true
		},
		_fn : {
			load_node : function (obj, s_call, e_call) { var _this = this; this.load_node_xml(obj, function () { _this.__callback({ "obj" : obj }); s_call.call(this); }, e_call); },
			_is_loaded : function (obj) {
				var s = this._get_settings().xml_data;
				obj = this._get_node(obj);
				return obj == -1 || !obj || !s.ajax || obj.is(".jstree-open, .jstree-leaf") || obj.children("ul").children("li").size() > 0;
			},
			load_node_xml : function (obj, s_call, e_call) {
				var s = this.get_settings().xml_data,
					error_func = function () {},
					success_func = function () {};

				obj = this._get_node(obj);
				if(obj && obj !== -1) {
					if(obj.data("jstree-is-loading")) { return; }
					else { obj.data("jstree-is-loading",true); }
				}
				switch(!0) {
					case (!s.data && !s.ajax): throw "Neither data nor ajax settings supplied.";
					case (!!s.data && !s.ajax) || (!!s.data && !!s.ajax && (!obj || obj === -1)):
						if(!obj || obj == -1) {
							this.parse_xml(s.data, $.proxy(function (d) {
								if(d) {
									d = d.replace(/ ?xmlns="[^"]*"/ig, "");
									if(d.length > 10) {
										d = $(d);
										this.get_container().children("ul").empty().append(d.children());
										if(s.clean_node) { this.clean_node(obj); }
										if(s_call) { s_call.call(this); }
									}
								}
								else {
									if(s.correct_state) {
										this.get_container().children("ul").empty();
										if(s_call) { s_call.call(this); }
									}
								}
							}, this));
						}
						break;
					case (!s.data && !!s.ajax) || (!!s.data && !!s.ajax && obj && obj !== -1):
						error_func = function (x, t, e) {
							var ef = this.get_settings().xml_data.ajax.error;
							if(ef) { ef.call(this, x, t, e); }
							if(obj !== -1 && obj.length) {
								obj.children(".jstree-loading").removeClass("jstree-loading");
								obj.data("jstree-is-loading",false);
								if(t === "success" && s.correct_state) { obj.removeClass("jstree-open jstree-closed").addClass("jstree-leaf"); }
							}
							else {
								if(t === "success" && s.correct_state) { this.get_container().children("ul").empty(); }
							}
							if(e_call) { e_call.call(this); }
						};
						success_func = function (d, t, x) {
							d = x.responseText;
							var sf = this.get_settings().xml_data.ajax.success;
							if(sf) { d = sf.call(this,d,t,x) || d; }
							if(d == "") {
								return error_func.call(this, x, t, "");
							}
							this.parse_xml(d, $.proxy(function (d) {
								if(d) {
									d = d.replace(/ ?xmlns="[^"]*"/ig, "");
									if(d.length > 10) {
										d = $(d);
										if(obj === -1 || !obj) { this.get_container().children("ul").empty().append(d.children()); }
										else { obj.children(".jstree-loading").removeClass("jstree-loading"); obj.append(d); obj.data("jstree-is-loading",false); }
										if(s.clean_node) { this.clean_node(obj); }
										if(s_call) { s_call.call(this); }
									}
									else {
										if(obj && obj !== -1) {
											obj.children(".jstree-loading").removeClass("jstree-loading");
											obj.data("jstree-is-loading",false);
											if(s.correct_state) {
												obj.removeClass("jstree-open jstree-closed").addClass("jstree-leaf");
												if(s_call) { s_call.call(this); }
											}
										}
										else {
											if(s.correct_state) {
												this.get_container().children("ul").empty();
												if(s_call) { s_call.call(this); }
											}
										}
									}
								}
							}, this));
						};
						s.ajax.context = this;
						s.ajax.error = error_func;
						s.ajax.success = success_func;
						if(!s.ajax.dataType) { s.ajax.dataType = "xml"; }
						if($.isFunction(s.ajax.url)) { s.ajax.url = s.ajax.url.call(this, obj); }
						if($.isFunction(s.ajax.data)) { s.ajax.data = s.ajax.data.call(this, obj); }
						$.ajax(s.ajax);
						break;
				}
			},
			parse_xml : function (xml, callback) {
				var s = this._get_settings().xml_data;
				$.vakata.xslt(xml, xsl[s.xsl], callback);
			},
			get_xml : function (tp, obj, li_attr, a_attr, is_callback) {
				var result = "",
					s = this._get_settings(),
					_this = this,
					tmp1, tmp2, li, a, lang;
				if(!tp) { tp = "flat"; }
				if(!is_callback) { is_callback = 0; }
				obj = this._get_node(obj);
				if(!obj || obj === -1) { obj = this.get_container().find("> ul > li"); }
				li_attr = $.isArray(li_attr) ? li_attr : [ "id", "class" ];
				if(!is_callback && this.data.types && $.inArray(s.types.type_attr, li_attr) === -1) { li_attr.push(s.types.type_attr); }

				a_attr = $.isArray(a_attr) ? a_attr : [ ];

				if(!is_callback) { result += "<root>"; }
				obj.each(function () {
					result += "<item";
					li = $(this);
					$.each(li_attr, function (i, v) { result += " " + v + "=\"" + (li.attr(v) || "").replace(/jstree[^ ]*|$/ig,'').replace(/^\s+$/ig,"") + "\""; });
					if(li.hasClass("jstree-open")) { result += " state=\"open\""; }
					if(li.hasClass("jstree-closed")) { result += " state=\"closed\""; }
					if(tp === "flat") { result += " parent_id=\"" + is_callback + "\""; }
					result += ">";
					result += "<content>";
					a = li.children("a");
					a.each(function () {
						tmp1 = $(this);
						lang = false;
						result += "<name";
						if($.inArray("languages", s.plugins) !== -1) {
							$.each(s.languages, function (k, z) {
								if(tmp1.hasClass(z)) { result += " lang=\"" + z + "\""; lang = z; return false; }
							});
						}
						if(a_attr.length) {
							$.each(a_attr, function (k, z) {
								result += " " + z + "=\"" + (tmp1.attr(z) || "").replace(/jstree[^ ]*|$/ig,'') + "\"";
							});
						}
						if(tmp1.children("ins").get(0).className.replace(/jstree[^ ]*|$/ig,'').replace(/^\s+$/ig,"").length) {
							result += ' icon="' + tmp1.children("ins").get(0).className.replace(/jstree[^ ]*|$/ig,'').replace(/^\s+$/ig,"") + '"';
						}
						if(tmp1.children("ins").get(0).style.backgroundImage.length) {
							result += ' icon="' + tmp1.children("ins").get(0).style.backgroundImage.replace("url(","").replace(")","") + '"';
						}
						result += ">";
						result += "<![CDATA[" + _this.get_text(tmp1, lang) + "]]>";
						result += "</name>";
					});
					result += "</content>";
					tmp2 = li[0].id;
					li = li.find("> ul > li");
					if(li.length) { tmp2 = _this.get_xml(tp, li, li_attr, a_attr, tmp2); }
					else { tmp2 = ""; }
					if(tp == "nest") { result += tmp2; }
					result += "</item>";
					if(tp == "flat") { result += tmp2; }
				});
				if(!is_callback) { result += "</root>"; }
				return result;
			}
		}
	});
})(jQuery);
//*/
