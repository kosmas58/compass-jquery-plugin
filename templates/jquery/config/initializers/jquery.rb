# ====
# The following options can be changed by creating an initializer in config/initializers/jquery.rb
# ====
# ActionView::Helpers::PrototypeHelper::JQUERY_VAR
# jRails uses jQuery.noConflict() by default
# to use the regular jQuery syntax, use:
# ActionView::Helpers::PrototypeHelper::JQUERY_VAR = '$'
ActionView::Helpers::PrototypeHelper::JQUERY_VAR = 'jQuery'

# ActionView::Helpers::PrototypeHelper:: DISABLE_JQUERY_FORGERY_PROTECTION
# Set this to disable forgery protection in ajax calls
# This is handy if you want to use caching with ajax by injecting the forgery token via another means
# for an example, see http://henrik.nyh.se/2008/05/rails-authenticity-token-with-jquery
# ActionView::Helpers::PrototypeHelper::DISABLE_JQUERY_FORGERY_PROTECTION = true
# ====

#ActionView::Helpers::AssetTagHelper::JAVASCRIPT_DEFAULT_SOURCES = ['jquery.min', 'jquery-ui.min', 'jrails.min']
#ActionView::Helpers::AssetTagHelper::reset_javascript_include_default

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jquery => ['jquery.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jquery_ui => ['jquery.min', 'jquery.cookie.min', 'jquery.form.min', 'jquery.layout.min', 'jquery-ui.min', 'jquery.flashMessages.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jrails => ['jquery.rails.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jhaml => ['jquery.haml.min']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :contextMenu => ['compiled/jquery/ui/contextMenu.css']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :contextMenu => ['jquery.contextMenu.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :cookie => ['jquery.cookie.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :doTimeout => ['jquery.dotimeout.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :dst => ['jquery.dst.min']
ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :farbtastic => ['compiled/jquery/ui/farbtastic.css']
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

require 'jquery/jquery'
require 'handle_attributes'
require 'jquery/jquery_selector_assertions' if RAILS_ENV == 'test'
require 'jquery/jquery_auto_complete'
require 'jquery/jquery_json_response'
require 'jquery/flash_messages'

ActionController::Base.send(:include, FlashMessages::ControllerMethods)
ActionView::Base.send(:include, FlashMessages::Display)
