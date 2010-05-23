require 'jquery/jqical'
require 'jquery/jqical/helpers/ui_event_helper'

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jqical => ['jquery.jqical.min']

ActionView::Base.send :include, JqIcal::Helpers::UiEventHelper
