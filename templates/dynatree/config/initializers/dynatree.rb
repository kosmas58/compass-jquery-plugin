require 'jquery/dynatree'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :dynatree_aero => ['jquery/dynatree/aero.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :dynatree_aqua => ['jquery/dynatree/aqua.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :dynatree_crystal => ['jquery/dynatree/crystal.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :dynatree_xp => ['jquery/dynatree/xp.css']

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :dynatree => ['jquery.dynatree.min']
