spec = Gem::Specification.new do |s|  
  s.name         = "compass-jquery-plugin"
  s.version      = CompassJquery::VERSION::STRING
  s.authors      = ["Kosmas Schuetz", "David Turnbull"]
  s.email        = "kosmas.schuetz@gmx.com"
  s.homepage     = "http://github.com/kosmas58/compass-jquery-plugin"
  s.summary      = "Integrates jRails, jQuery, jQuery UI and Themes, jqGrid and more into Compass Sass framework."
  s.description  = s.summary
  #s.executables  = ["jqgrid", "jquery-ui"]
  s.files        = %w[MIT-LICENSE Rakefile README.textile] + Dir["lib/**/*"] + Dir["templates/**/*"]
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

desc 'Build all templates.'
task :build_templates => ["jrails:build_templates", "jqgrid:build_templates", "secret_sauce:build_templates"] do
  
end

CLEAN.include ["pkg", "*.gem", "doc", "ri", "coverage", "templates"]

desc 'Install the package as a gem.'
task :gem_install => [:clean, :build_templates, :package] do
  gem = Dir['pkg/*.gem'].first
  if RUBY_PLATFORM =~ /win/ 
    system "gem install --no-ri --no-rdoc --local #{gem}"
  else 
    sh "sudo gem install --no-ri --no-rdoc --local #{gem}"
  end
end
