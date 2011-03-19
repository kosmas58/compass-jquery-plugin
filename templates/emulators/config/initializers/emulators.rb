require 'jquery/emulators'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :blackberry_landscape => ['compiled/emulators/blackberry.landscape.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :blackberry_portrait => ['compiled/emulators/blackberry.portrait.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :ipad_landscape => ['compiled/emulators/ipad.landscape.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :ipad_portrait => ['compiled/emulators/ipad.portrait.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :iphone_landscape => ['compiled/emulators/iphone.landscape.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :iphone_portrait => ['compiled/emulators/iphone.portrait.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :palm_landscape => ['compiled/emulators/palm.landscape.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :palm_portrait => ['compiled/emulators/palm.portrait.css']
