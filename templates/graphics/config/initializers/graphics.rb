require 'jquery/graphics'

ActionView::Helpers::AssetTagHelper.register_stylesheet_expansion :ganttView => ['compiled/jquery/ganttView.css']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :ganttView => ['jquery.ganttView.min']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :sparklines => ['jquery.sparkline.min']
