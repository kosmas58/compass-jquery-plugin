require 'lib/jquery/version'

spec = Gem::Specification.new do |s|
  s.name = "compass-jquery-plugin"
  s.version = CompassJqueryPlugin::VERSION::STRING
  s.authors = ["Kosmas Schuetz"]
  s.email = "kosmas.schuetz@gmx.com"
  s.homepage = "http://github.com/kosmas58/compass-jquery-plugin"
  s.summary = "A compass plugin that integrates jRails, jQuery, jQuery UI and Themes, jqGrid and more into the Compass Sass framework."
  s.description = s.summary
  #s.executables = ["jrails"]
  s.files = %w[MIT-LICENSE Rakefile README.textile] + Dir["lib/**/*"] + Dir["templates/**/*"]
  s.add_dependency("chriseppstein-compass", [">= 0.8.16"])
end

Rake::GemPackageTask.new(spec) do |package|
  package.gem_spec = spec
end

desc 'Show information about the gem.'
task :gemspec do
  File.open("compass-jquery-plugin.gemspec", 'w') do |f|
    f.write spec.to_ruby
  end
  puts "Generated: compass-jquery-plugin.gemspec"
end

desc 'Build all stylesheets and templates.'
task :build_all => ["jrails:build", "dynatree:build", "jqgrid:build", "secret_sauce:build", "calendar:build"] do

end

CLEAN.include ["pkg", "*.gem", "doc", "ri", "coverage", "stylesheets", "templates"]

desc 'Install the package as a gem.'
task :install => [:clean, :build_all, :package] do
  gem = Dir['pkg/*.gem'].first
  if RUBY_PLATFORM =~ /win/
    system "gem install --no-ri --no-rdoc --local #{gem}"
  else
    sh "sudo gem install --no-ri --no-rdoc --local #{gem}"
  end
end
