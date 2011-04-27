require 'fileutils'
require 'lib/handle_js_files'

# Compass generator for tools 3.5+
TOOLS_SRC = File.join(GEM_ROOT, 'src', 'tools')

TOOLS_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'tools')

TOOLS_MESSAGE1 = "# Generated by compass-jquery-plugin/gem-tasks/tools.rake\n# Install with: compass install jquery/tools\n\n"
TOOLS_MESSAGE2 = "// Generated by compass-jquery-plugin/gem-tasks/tools.rake\n\n"

all_scripts = [
    'js/dateinput.js',
    'js/overlay.js',
    'js/overlay.apple.js',
    'js/rangeinput.js',
    'js/scrollable.js',
    'js/scrollable.autoscroll.js',
    'js/scrollable.navigator.js',
    'js/tabs.js',
    'js/tabs.slideshow.js',
    'js/toolbox.expose.js',
    'js/toolbox.flashembed.js',
    'js/toolbox.history.js',
    'js/toolbox.mousewheel.js',
    'js/tooltip.js',
    'js/tooltip.dynamic.js',
    'js/tooltip.slide.js',
    'js/validator.js'
].collect { |filename| File.read(File.join(TOOLS_SRC, filename)) }.join "\n\n"

namespace :build do
  desc 'Build the stylesheets and templates for tools.'
  task :tools do

    FileUtils.remove_dir TOOLS_DEST_TEMPLATES if File.exists? TOOLS_DEST_TEMPLATES
    FileUtils.mkdir_p(File.join(TOOLS_DEST_TEMPLATES, 'config', 'initializers'))
    FileUtils.mkdir_p(File.join(TOOLS_DEST_TEMPLATES, 'lib', 'tasks'))

    open File.join(TOOLS_DEST_TEMPLATES, 'manifest.rb'), 'w' do |manifest|
      manifest.print TOOLS_MESSAGE1

      open File.join(TOOLS_DEST_TEMPLATES, 'config', 'initializers', 'tools.rb'), 'w' do |f|
        f.print(File.read(File.join(TOOLS_SRC, 'config', 'initializers', 'tools.rb')))
      end
      manifest.print "file 'config/initializers/tools.rb'\n"

      open File.join(TOOLS_DEST_TEMPLATES, 'lib', 'tasks', 'jquery.tools.rake'), 'w' do |f|
        f.print(File.read(File.join(TOOLS_SRC, 'lib', 'tasks', 'jquery.tools.rake')))
      end
      manifest.print "file 'lib/tasks/jquery.tools.rake'\n"

      #JavaScripts

      scripts = ""

      open File.join(TOOLS_DEST_TEMPLATES, 'jquery.tools.js'), 'w' do |f|
        scripts = concat_files(all_scripts).gsub(/@VERSION/, File.read(File.join(TOOLS_SRC, 'version.txt'))).gsub(/@DATE/, Time.now().to_s)
        f.print scripts
      end
      manifest.print "javascript 'jquery.tools.js'\n"

      open File.join(TOOLS_DEST_TEMPLATES, 'jquery.tools.min.js'), 'w' do |f|
        f.print compress_js(scripts, "google")
      end
      manifest.print "javascript 'jquery.tools.min.js'\n"

      ['plugins'].each do |path|
        Dir.foreach File.join(TOOLS_SRC, path) do |file|
          next unless /\.js$/ =~ file
          js = File.read File.join(TOOLS_SRC, path, file)
          manifest.print "javascript '#{file}'\n"
          open File.join(TOOLS_DEST_TEMPLATES, file), 'w' do |f|
            f.write js
          end
          file.gsub!(/\.js$/, '.min.js')
          manifest.print "javascript '#{file}'\n"
          open File.join(TOOLS_DEST_TEMPLATES, file), 'w' do |f|
            f.write compress_js(js, "google")
          end
        end
      end

    end
  end
end