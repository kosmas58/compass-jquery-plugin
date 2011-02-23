require 'jquery/dynatree'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :dynatree_aero => ['compiled/jquery/dynatree/aero.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :dynatree_aqua => ['compiled/jquery/dynatree/aqua.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :dynatree_crystal => ['compiled/jquery/dynatree/crystal.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :dynatree_xp => ['compiled/jquery/dynatree/xp.css']

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :dynatree => ['jquery.dynatree.min']
