require 'jquery/emulators'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :blackberry_landscape => ['emulators/blackberry.landscape.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :blackberry_portrait => ['emulators/blackberry.portrait.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :ipad_landscape => ['emulators/ipad.landscape.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :ipad_portrait => ['emulators/ipad.portrait.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :iphone_landscape => ['emulators/iphone.landscape.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :iphone_portrait => ['emulators/iphone.portrait.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :palm_landscape => ['emulators/palm.landscape.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :palm_portrait => ['emulators/palm.portrait.css']
