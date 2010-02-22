# ====
# The following options can be changed by creating an initializer in config/initializers/jrails.rb
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

ActionView::Helpers::AssetTagHelper::JAVASCRIPT_DEFAULT_SOURCES = ['jquery-1.4.1.min', 'jquery-ui-1.8rc1.min', 'jrails.min']
ActionView::Helpers::AssetTagHelper::reset_javascript_include_default

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jquery => ['jquery-1.4.1.min', 'jquery-ui-1.8rc1.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :jrails => ['jrails.min']

require 'jquery/jrails'
require 'jquery/jquery_selector_assertions' if RAILS_ENV == 'test'