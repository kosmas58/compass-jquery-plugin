require 'jquery/secret_sauce'

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :secret_sauce => ["secret_sauce.min"]

ActionView::Base.send :include, SecretSauce::Helpers::UiThemeHelper
ActionView::Base.send :include, SecretSauce::Helpers::UiGridHelper
ActionView::Base.send :include, SecretSauce::Helpers::UiFormHelper
ActionView::Base.send :include, SecretSauce::Helpers::UiDialogHelper