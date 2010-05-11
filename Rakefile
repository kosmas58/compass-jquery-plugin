begin; require 'rubygems'; rescue LoadError; end
require 'rake'
require "compass"
require 'lib/jquery.rb'

begin
  require 'jeweler'
  Jeweler::Tasks.new do |gem|      
    gem.name = "compass-jquery-plugin"
    gem.version = CompassJqueryPlugin::VERSION
    gem.authors = ["Kosmas Schuetz"]
    gem.email = "kosmas.schuetz@gmx.com"
    gem.homepage = "http://github.com/kosmas58/compass-jquery-plugin"
    gem.summary = "A compass plugin that integrates jRails, jQuery, jQuery UI and Themes, jqGrid and more into the Compass Sass framework."
    gem.description = gem.summary
    gem.add_dependency("haml", [">= 3.0.0"])  
    gem.add_dependency("compass", [">= 0.10.0"])
    gem.add_dependency("ri_cal", [">= 0.8.7"])    
    gem.files.exclude("src/**/")
  end
  Jeweler::GemcutterTasks.new
  
rescue LoadError
  puts "Jeweler (or a dependency) not available. Install it with: sudo gem install jeweler"
end

Dir['gem_tasks/**/*.rake'].each { |rake| load rake }
