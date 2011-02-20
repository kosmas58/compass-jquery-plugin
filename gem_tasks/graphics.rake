require 'fileutils'
require 'lib/handle_js_files'

GRAPHICS_SRC = File.join(GEM_ROOT, 'src', 'graphics')
SPARKLINES_SRC_SCRIPTS = File.join(GRAPHICS_SRC, 'sparklines') + "/*.js"
GANTTVIEW_SRC = File.join(GRAPHICS_SRC, 'ganttView')
GANTTVIEW_SRC_SCRIPTS = GANTTVIEW_SRC + "/*.js"

GRAPHICS_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'graphics')
GRAPHICS_DEST_THEMES = File.join(GRAPHICS_DEST_TEMPLATES, 'jquery')

GRAPHICS_MESSAGE1 = "# Generated by compass-jquery-plugin/gem-tasks/graphics.rake\n# Install with: compass install jquery/graphics\n\n"
GRAPHICS_MESSAGE2 = "// Generated by compass-jquery-plugin/gem-tasks/graphics.rake\n\n"

namespace :build do
  desc 'Build the stylesheets and templates for jQuery.'
  task :graphics do

    FileUtils.remove_dir GRAPHICS_DEST_TEMPLATES if File.exists? GRAPHICS_DEST_TEMPLATES
    FileUtils.mkdir_p(File.join(GRAPHICS_DEST_TEMPLATES, 'config', 'initializers'))

    open File.join(GRAPHICS_DEST_TEMPLATES, 'manifest.rb'), 'w' do |manifest|
      manifest.print GRAPHICS_MESSAGE1

      open File.join(GRAPHICS_DEST_TEMPLATES, 'config', 'initializers', 'graphics.rb'), 'w' do |f|
        f.print(File.read(File.join(GRAPHICS_SRC, 'config', 'initializers', 'graphics.rb')))
      end
      manifest.print "file 'config/initializers/graphics.rb'\n"

      # jQuery Sparklines

      open File.join(GRAPHICS_DEST_TEMPLATES, 'jquery.sparkline.js'), 'w' do |f|
        f.print concat_files(all_files(SPARKLINES_SRC_SCRIPTS))
      end
      manifest.print "javascript 'jquery.sparkline.js'\n"

      open File.join(GRAPHICS_DEST_TEMPLATES, 'jquery.sparkline.min.js'), 'w' do |f|
        f.print compress_js(all_files(SPARKLINES_SRC_SCRIPTS), "google")
      end
      manifest.print "javascript 'jquery.sparkline.min.js'\n"

      # jQuery GanttView

      open File.join(GRAPHICS_DEST_TEMPLATES, 'jquery.ganttView.js'), 'w' do |f|
        f.print concat_files(all_files(GANTTVIEW_SRC_SCRIPTS))
      end
      manifest.print "javascript 'jquery.ganttView.js'\n"

      open File.join(GRAPHICS_DEST_TEMPLATES, 'jquery.ganttView.min.js'), 'w' do |f|
        f.print compress_js(all_files(GANTTVIEW_SRC_SCRIPTS), "google")
      end
      manifest.print "javascript 'jquery.ganttView.min.js'\n"

      FileUtils.mkdir_p(File.join(GRAPHICS_DEST_THEMES))
      css = File.read File.join(GANTTVIEW_SRC, 'jquery.ganttView.css')
      sass = ''
      IO.popen("sass-convert -F css -T scss", 'r+') { |f| f.print(css); f.close_write; sass = f.read }
      open File.join(GRAPHICS_DEST_THEMES, 'gantt_view.scss'), 'w' do |f|
        f.write sass
      end
      manifest.print "stylesheet 'jquery/gantt_view.scss'\n"
    end
  end
end
  