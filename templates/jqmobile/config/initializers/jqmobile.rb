require 'jquery/jqmobile'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jqmobile => ['compiled/jquery.mobile/jquery.mobile-1.0a1.css']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jqmobile => ['jquery-1.4.3.min', 'jquery.mobile-1.0a1.min']
