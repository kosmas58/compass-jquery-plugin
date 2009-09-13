module SecretSauce
  module Helpers    
    # This module provides methods specific for working with jQueryUI themes.
    module UiThemeHelper
      # Renders a stylesheet tag linking to the named theme. It will look first in the application
      # directory (/stylesheets/themes), after which it will pull the theme from jQueryUI directly.
      def ui_theme(theme)
        if File.exists?("#{RAILS_ROOT}/public/stylesheets/compiled/jquery.ui.#{theme}")
          return stylesheet_link_tag("compiled/jquery.ui.#{theme}")
        else
          return stylesheet_link_tag("http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/#{theme}/jquery-ui.css")
        end
      end      
    end    
  end
end
