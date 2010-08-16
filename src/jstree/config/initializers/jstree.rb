require 'jquery/jstree'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jstree_apple => ['compiled/jquery.ui/jstree.apple.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jstree_classic => ['compiled/jquery.ui/jstree.classic.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jstree_default => ['compiled/jquery.ui/jstree.default.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :jstree_default_rtl => ['compiled/jquery.ui/jstree.default-rtl.css']

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jstree => ['jquery.jstree.min', 'jquery.hotkeys.min']