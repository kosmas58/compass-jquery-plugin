require 'jquery/jstree'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jstree_apple => ['compiled/jquery/jstree/apple.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jstree_classic => ['compiled/jquery/jstree/classic.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jstree_default => ['compiled/jquery/jstree/default.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jstree_default_rtl => ['compiled/jquery/jstree/default-rtl.css']

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jstree => ['jquery.jstree.min', 'jquery.hotkeys.min']