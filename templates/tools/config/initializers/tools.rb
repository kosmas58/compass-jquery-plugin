require 'jquery/tools'

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :tools => ['jquery.tools.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :flowplayer => ['flowplayer.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :swfobject => ['swfobject.min']
