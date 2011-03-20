require 'jquery/jqtouch'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt => ['jquery/touch/jqtouch.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt_apple => ['jquery/touch/apple.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt_default => ['jquery/touch/default.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqt_jqt => ['jquery/touch/jqt.css']

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jqtouch => ['jquery.min', 'jquery.jqtouch.min']
