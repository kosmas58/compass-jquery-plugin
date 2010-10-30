module JqIcal
  module Helpers
    module UiEventHelper
      def ui_event_for(*args)
        domid = args.first
        options = args.extract_options!
        options[:url]     = {} unless options[:url]
        options[:actions] = {} unless options[:actions]
        render(:file => 'shared/_ui_event_for.js.haml', :locals => { :domid => domid, :url => options[:url], :actions => options[:actions]})
      end
    end   
  end
end
