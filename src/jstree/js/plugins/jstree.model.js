/*
 * jsTree model plugin
 * This plugin gets jstree to use a class model to retrieve data, creating great dynamism
 */
(function ($) {
  var nodeInterface = ["getChildren","getChildrenCount","getAttr","getName","getProps"],
          validateInterface = function(obj, inter) {
            var valid = true;
            obj = obj || {};
            inter = [].concat(inter);
            $.each(inter, function (i, v) {
              if (!$.isFunction(obj[v])) {
                valid = false;
                return false;
              }
            });
            return valid;
          };
  $.jstree.plugin("model", {
    __init : function () {
      if (!this.data.json_data) {
        throw "jsTree model: jsTree json_data plugin not included.";
      }
      this._get_settings().json_data.data = function (n, b) {
        var obj = (n == -1) ? this._get_settings().model.object : n.data("jstree_model");
        if (!validateInterface(obj, nodeInterface)) {
          return b.call(null, false);
        }
        if (this._get_settings().model.async) {
          obj.getChildren($.proxy(function (data) {
            this.model_done(data, b);
          }, this));
        }
        else {
          this.model_done(obj.getChildren(), b);
        }
      };
    },
    defaults : {
      object : false,
      id_prefix : false,
      async : false
    },
    _fn : {
      model_done : function (data, callback) {
        var ret = [],
                s = this._get_settings(),
                _this = this;

        if (!$.isArray(data)) {
          data = [data];
        }
        $.each(data, function (i, nd) {
          var r = nd.getProps() || {};
          r.attr = nd.getAttr() || {};
          if (nd.getChildrenCount()) {
            r.state = "closed";
          }
          r.data = nd.getName();
          if (!$.isArray(r.data)) {
            r.data = [r.data];
          }
          if (_this.data.types && $.isFunction(nd.getType)) {
            r.attr[s.types.type_attr] = nd.getType();
          }
          if (r.attr.id && s.model.id_prefix) {
            r.attr.id = s.model.id_prefix + r.attr.id;
          }
          if (!r.metadata) {
            r.metadata = { };
          }
          r.metadata.jstree_model = nd;
          ret.push(r);
        });
        callback.call(null, ret);
      }
    }
  });
})(jQuery);

