ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jquery => ['jquery.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jquery_ui => ['jquery.min', 'jquery.cookie.min', 'jquery.form.min', 'jquery.layout.min', 'jquery-ui.min', 'jquery.flashMessages.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jrails => ['jquery.rails.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jhaml => ['jquery.haml.min']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :contextMenu => ['jquery/ui/contextMenu.css']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :contextMenu => ['jquery.contextMenu.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :cookie => ['jquery.cookie.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :doTimeout => ['jquery.dotimeout.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :dst => ['jquery.dst.min']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :farbtastic => ['jquery/ui/farbtastic.css']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :farbtastic => ['jquery.farbtastic.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :form => ['jquery.form.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :history => ['history.adapter.jquery.min', 'history.min', 'history.html4.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :hotkeys => ['jquery.hotkeys.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :layout => ['jquery.layout.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :mousewheel => ['jquery.mousewheel.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :offline => ['json.min', 'jquery.offline.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :pngFix => ['jquery.pngFix.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :replaceText => ['jquery.replaceText.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :themeSwitcher => ['jquery.themeswitchertool.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :tmpl => ['jquery.tmpl.min', 'jquery.tmplPlus.min']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :tokeninput => ['jquery/ui/tokeninput.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :tokeninput_facebook => ['jquery/ui/tokeninput.facebook.css']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :tokeninput_mac => ['jquery/ui/tokeninput.mac.css']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :tokeninput => ['jquery.tokeninput.min']

require 'jquery/jquery'
require 'handle_attributes'
require 'jquery/assert_select_jquery' if Rails.env == 'test'
require 'jquery/jquery_auto_complete'
require 'jquery/jquery_json_response'
require 'jquery/flash_messages'

ActionController::Base.send(:include, FlashMessages::ControllerMethods)
ActionView::Base.send(:include, FlashMessages::Display)
