require 'jquery/secret_sauce'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :secret_sauce => ['jquery/secret_sauce.css']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :secret_sauce => ["secret_sauce.min"]

ActionView::Base.send :include, SecretSauce::Helpers::UiGridHelper
ActionView::Base.send :include, SecretSauce::Helpers::UiFormHelper
ActionView::Base.send :include, SecretSauce::Helpers::UiDialogHelper