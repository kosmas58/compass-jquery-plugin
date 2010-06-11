require 'jquery/ribbon'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :ribbon_simple   => ['compiled/jquery.ui/ribbon_simple.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :ribbon_office   => ['compiled/jquery.ui/ribbon_office.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :ribbon_windows7 => ['compiled/jquery.ui/ribbon_windows7.css']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :ribbon => ['jquery.ribbon.min']
