require 'jquery/mobile'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :mobile_default => ['compiled/jquery/mobile/default.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :mobile_valencia => ['compiled/jquery/mobile/valencia.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :mobile_960 => ['compiled/jquery/mobile/960.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :mobile_960_fluid => ['compiled/jquery/mobile/960.fluid.css']

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :mobile => ['jquery.mobile.min']
