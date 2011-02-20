require 'jquery/ribbon'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :ribbon_simple => ['compiled/jquery/ribbon/simple.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :ribbon_office => ['compiled/jquery/ribbon/office.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :ribbon_windows7 => ['compiled/jquery/ribbon/windows7.css']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :ribbon => ['jquery.ribbon.min']
