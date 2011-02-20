require 'fileutils'
require 'lib/handle_js_files'

# Compass generator for JSTREE
JSTREE_SRC = File.join(GEM_ROOT, 'src', 'jstree')
JSTREE_SRC_THEMES = File.join(JSTREE_SRC, 'themes')

JSTREE_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'jstree')
JSTREE_DEST_THEMES = File.join(JSTREE_DEST_TEMPLATES, 'jquery', 'jstree')
JSTREE_DEST_IMAGES = File.join(JSTREE_DEST_THEMES)

JSTREE_MESSAGE1 = "# Generated by compass-jquery-plugin/gem-tasks/jstree.rake\n# Install with: compass install jquery/jstree\n\n"
JSTREE_MESSAGE2 = "// Generated by compass-jquery-plugin/gem-tasks/jstree.rake\n\n"

all_scripts = [
    'js/jquery.jstree.js',
    'js/jstree.core.js',
    'js/plugins/ui.js',
    'js/plugins/crrm.js',
    'js/plugins/themes.js',
    'js/plugins/hotkeys.js',
    'js/plugins/json_data.js',
    'js/plugins/languages.js',
    'js/plugins/cookies.js',
    'js/plugins/sort.js',
    'js/plugins/dnd.js',
    'js/plugins/checkbox.js',
    'js/plugins/xml_data.js',
    'js/plugins/search.js',
    'js/plugins/contextmenu.js',
    'js/plugins/types.js',
    'js/plugins/html_data.js',
    'js/plugins/themeroller.js',
    'js/plugins/unique.js',
    'js/plugins/radio.js',
    'js/plugins/wholerow.js',
    'js/plugins/model.js'
].collect { |filename| File.read(File.join(JSTREE_SRC, filename)) }.join "\n\n"

namespace :build do
  desc 'Build the stylesheets and templates for jstree.'
  task :jstree do

    FileUtils.remove_dir JSTREE_DEST_TEMPLATES if File.exists? JSTREE_DEST_TEMPLATES
    FileUtils.mkdir_p(File.join(JSTREE_DEST_TEMPLATES, 'config', 'initializers'))

    open File.join(JSTREE_DEST_TEMPLATES, 'manifest.rb'), 'w' do |manifest|
      manifest.print JSTREE_MESSAGE1

      open File.join(JSTREE_DEST_TEMPLATES, 'config', 'initializers', 'jstree.rb'), 'w' do |f|
        f.print(File.read(File.join(JSTREE_SRC, 'config', 'initializers', 'jstree.rb')))
      end
      manifest.print "file 'config/initializers/jstree.rb'\n"

      open File.join(JSTREE_DEST_TEMPLATES, 'jquery.jstree.js'), 'w' do |f|
        f.print concat_files(all_scripts)
      end
      manifest.print "javascript 'jquery.jstree.js'\n"

      open File.join(JSTREE_DEST_TEMPLATES, 'jquery.jstree.min.js'), 'w' do |f|
        f.print compress_js(all_scripts, "google")
      end
      manifest.print "javascript 'jquery.jstree.min.js'\n"

      # jQuery jsTree Skins

      FileUtils.mkdir_p(JSTREE_DEST_THEMES)

      Dir.foreach JSTREE_SRC_THEMES do |theme|
        next if /^\./ =~ theme

        # Convert the stylesheet

        Dir.foreach File.join(JSTREE_SRC_THEMES, "#{theme}") do |file|
          next unless /\.css$/ =~ file
          css = File.read File.join(JSTREE_SRC_THEMES, "#{theme}", file)
          sass = ''
          IO.popen("sass-convert -F css -T scss", 'r+') { |f| f.print(css); f.close_write; sass = f.read }
          open File.join(JSTREE_DEST_THEMES, "#{theme}.scss"), 'w' do |f|
            f.write JSTREE_MESSAGE2 + sass
          end
          manifest.print "stylesheet 'jquery/jstree/#{theme}.scss'\n"
        end

        # Copy the theme images directory
        src_dir = File.join(JSTREE_SRC_THEMES, theme, 'images')
        dest_dir = File.join(JSTREE_DEST_IMAGES, "#{theme}")
        FileUtils.mkdir_p dest_dir

        Dir.foreach(src_dir) do |image|
          next if /^\./ =~ image
          FileUtils.cp(File.join(src_dir, image), dest_dir)
          manifest.print "image 'jquery/jstree/#{theme}/#{image}'\n"
        end
      end
    end
  end
end