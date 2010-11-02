require 'jquery/jqtouch'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt         => ['compiled/jqtouch/jqtouch.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt_apple   => ['compiled/jqtouch/jqt.apple.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt_default => ['compiled/jqtouch/jqt.default.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt_jqt     => ['compiled/jqtouch/jqt.jqt.css']

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jqtouch => ['jquery-1.4.3.min', 'jquery.jqtouch.min']
