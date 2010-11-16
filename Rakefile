begin; require 'rubygems'; rescue LoadError; end
require 'rake'
require "compass"
require 'lib/jquery'

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
    gem.add_dependency("haml", [">= 3.0.24"])
    gem.add_dependency("compass", [">= 0.10.6"])
    gem.add_dependency("ri_cal", [">= 0.8.7"])
    gem.files.exclude("src/**/")
  end
  Jeweler::GemcutterTasks.new
  
rescue LoadError
  puts "Jeweler (or a dependency) not available. Install it with: sudo gem install jeweler"
end

Dir['gem_tasks/**/*.rake'].each { |rake| load rake }

require 'spec/rake/spectask'
Spec::Rake::SpecTask.new(:spec) do |spec|
  spec.libs << 'lib' << 'spec'
  spec.spec_files = FileList['spec/**/*_spec.rb']
end

Spec::Rake::SpecTask.new(:rcov) do |spec|
  spec.libs << 'lib' << 'spec'
  spec.pattern = 'spec/**/*_spec.rb'
  spec.rcov = true
end

task :spec => :check_dependencies

task :default => :spec

require 'rake/rdoctask'
Rake::RDocTask.new do |rdoc|
  rdoc.rdoc_dir = 'rdoc'
  rdoc.title = "compass-jquery-plugin #{VERSION}"
  rdoc.rdoc_files.include('README*')
  rdoc.rdoc_files.include('lib/**/*.rb')
end
