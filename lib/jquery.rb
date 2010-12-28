require 'yaml'
require "compass"
require File.join(File.dirname(__FILE__), 'jquery', 'compass_plugin')

module Compass
  module Jquery
    module Plugin
      version = YAML.load_file(File.dirname(__FILE__) + '/../VERSION.yml')
      if version[:commit]
        VERSION = "#{version[:major]}.#{version[:minor]}.#{version[:patch]}.#{version[:commit]}"
      else
        VERSION = "#{version[:major]}.#{version[:minor]}.#{version[:patch]}"
      end
    end
  end
end
