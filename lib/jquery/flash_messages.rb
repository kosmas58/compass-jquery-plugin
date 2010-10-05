module FlashMessages
  module ControllerMethods
    TYPES = [:success, :notice, :warning, :error]
    
    TYPES.each do |type|
      define_method(type) do |msg|
        flash[type] = msg
      end
      
      define_method("#{type}_now") do |msg|
        flash.now[type] = msg
      end
    end
  end

  module Display
#    def flash_messages
#      returning html = String.new do
#        flash.each do |css_class, message|
#          html << content_tag(:div, content_tag(:div, nil, :class => :icon) + message, :class => css_class)
#        end
#      end
#    end
    
    FLASH_NOTICE_KEYS = [:error, :warning, :notice, :success]
  
    def flash_messages
      return unless messages = flash.keys.select{|k| FLASH_NOTICE_KEYS.include?(k)}
      formatted_messages = messages.map do |type|      
        content_tag(:div, nil, :class => type.to_s + " ui-corner-all") do
          message_for_item(flash[type], flash["#{type}_item".to_sym])
        end
      end
      formatted_messages.join
    end

    def message_for_item(message, item = nil)
      if item.is_a?(Array)
        content_tag(:div, nil, :class => :icon) + message % link_to(*item)
      else
        content_tag(:div, nil, :class => :icon) + message % item
      end
    end
  end
end
