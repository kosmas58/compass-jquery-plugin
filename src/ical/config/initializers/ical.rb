require 'jquery/ical'
require 'jquery/ical/helpers/ui_event_helper'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :ical => ['compiled/jquery/ical.css']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :ical => ['jquery.ical.min']

ActionView::Base.send :include, Ical::Helpers::UiEventHelper
