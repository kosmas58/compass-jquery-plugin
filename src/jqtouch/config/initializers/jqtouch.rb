require 'jquery/jqtouch'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt        => ['compiled/jqtouch/jqtouch.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt_apple  => ['compiled/jqtouch/jqt.apple.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt_jqt    => ['compiled/jqtouch/jqt.jqt.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt_iphone => ['compiled/jqtouch/iphone-emulator.css']

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jqtouch => ['jquery.jqtouch.min']
