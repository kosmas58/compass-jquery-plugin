require 'jquery/mobile'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :mobile_default  => ['compiled/jquery/mobile/default.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :mobile_valencia => ['compiled/jquery/mobile/valencia.css']

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :mobile => ['jquery-1.4.4.min', 'jquery.mobile.min']
