require 'jquery/dynatree'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :dynatree_aero => ['compiled/jquery.ui/dynatree.aero.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :dynatree_aqua => ['compiled/jquery.ui/dynatree.aqua.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :dynatree_crystal => ['compiled/jquery.ui/dynatree.crystal.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :dynatree_xp => ['compiled/jquery.ui/dynatree.xp.css']

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :dynatree => ['jquery.dynatree.min']
