require 'jquery/ribbon'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :ribbon_simple => ['jquery/ribbon/simple.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :ribbon_office => ['jquery/ribbon/office.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :ribbon_windows7 => ['jquery/ribbon/windows7.css']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :ribbon => ['jquery.ribbon.min']
