require 'jquery/secret_sauce'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :secret_sauce => ['compiled/jquery.ui/secret_sauce.css']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :secret_sauce => ["secret_sauce.min"]

ActionView::Base.send :include, SecretSauce::Helpers::UiGridHelper
ActionView::Base.send :include, SecretSauce::Helpers::UiFormHelper
ActionView::Base.send :include, SecretSauce::Helpers::UiDialogHelper