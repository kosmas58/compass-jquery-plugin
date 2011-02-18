module JqueryAutoComplete

  def self.included(base)
    base.extend(ClassMethods)
  end

  module ClassMethods
    def auto_complete_for(object, method, options = {})
      define_method("auto_complete_for_#{object}_#{method}") do
        object_constant = object.to_s.camelize.constantize

        find_options = {
            :conditions => ["LOWER(#{method}) LIKE ?", '%' + params[:term].downcase + '%'],
            :order => "#{method} ASC",
            :limit => 10}.merge!(options)

        render :json => object_constant.to_auto_complete(:json, find_options)
      end
    end
  end
end

module JqueryAutoCompleteJson
  include ActionView::Helpers::JavaScriptHelper
  include HandleAttributes

  def to_auto_complete(format, attributes)
    case format
      when :json
        json = %Q([)
        each do |elem|
          couples = elem.attributes.symbolize_keys
          json << %Q({ "id": "#{get_atr_value(elem, attributes[0], couples)}",)
          json << %Q( "label": "#{get_atr_value(elem, attributes[1], couples)}",)
          json << %Q( "value": "#{get_atr_value(elem, attributes[2], couples).gsub(/<\/?[^>]*>/, "")}" },)
        end
        json.chop! << " ]"
    end
  end
end

class Array
  include JqueryAutoCompleteJson
end
