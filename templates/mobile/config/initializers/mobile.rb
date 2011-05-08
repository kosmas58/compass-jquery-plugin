require 'jquery/mobile'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :mobile_default => ['jquery/mobile/default.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :mobile_valencia => ['jquery/mobile/valencia.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :mobile_960 => ['jquery/mobile/960.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :mobile_960_fluid => ['jquery/mobile/960.fluid.css']

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :mobile => ['jquery.mobile.min']
