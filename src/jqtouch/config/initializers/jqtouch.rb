require 'jquery/jqtouch'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt         => ['compiled/jquery/touch/jqtouch.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt_apple   => ['compiled/jquery/touch/apple.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt_default => ['compiled/jquery/touch/default.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt_jqt     => ['compiled/jquery/touch/jqt.css']

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jqtouch => ['jquery-1.4.4.min', 'jquery.jqtouch.min']
