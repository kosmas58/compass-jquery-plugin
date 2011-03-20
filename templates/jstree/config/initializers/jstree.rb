require 'jquery/jstree'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jstree_apple => ['jquery/jstree/apple.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jstree_classic => ['jquery/jstree/classic.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jstree_default => ['jquery/jstree/default.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jstree_default_rtl => ['jquery/jstree/default-rtl.css']

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jstree => ['jquery.jstree.min', 'jquery.hotkeys.min']