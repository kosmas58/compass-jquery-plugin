require File.join(File.dirname(__FILE__), 'jquery', 'compass_plugin')

module CompassJqueryPlugin
  version = YAML.load_file(File.dirname(__FILE__) + '/../VERSION.yml')
  VERSION = "#{version[:major]}.#{version[:minor]}.#{version[:patch]}"
end
