require 'fileutils'
require 'lib/handle_js_files'
require 'lib/jquery_ui_theme'

# Compass generator for jrails 0.1+
SRC = File.join(GEM_ROOT, 'src', 'jquery')
JQUERY_SRC = File.join(SRC, 'jquery')
JQUERY_SRC_CONFIG = File.join(JQUERY_SRC, 'config', 'initializers')
SRC_TASKS = File.join(SRC, 'lib', 'tasks')

JQUERY_UI_SRC = File.join(SRC, 'jquery.ui')
JQUERY_UI_SRC_SCRIPTS = File.join(JQUERY_UI_SRC, 'js') + "/*.js"
JQUERY_UI_SRC_THEMES = File.join(JQUERY_UI_SRC, 'themes')
JQUERY_UI_SRC_TRANSLATIONS = File.join(JQUERY_UI_SRC, 'js', 'i18n') #+ "/*.js"

JHAML_SRC_SCRIPTS = File.join(SRC, 'jquery-haml') + "/*.js"

FLASH_SRC = File.join(SRC, 'flash_messages')
FLASH_SRC_JS_SCRIPTS = FLASH_SRC + "/*.js"
FLASH_SRC_IMAGES = File.join(FLASH_SRC, 'images')

JQUERY_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'jquery')
JQUERY_DEST_CONFIG = File.join(JQUERY_DEST_TEMPLATES, 'config', 'initializers')
JQUERY_DEST_TRANSLATIONS = File.join(JQUERY_DEST_TEMPLATES, 'i18n', 'jquery.ui')
JQUERY_DEST_THEMES = File.join(JQUERY_DEST_TEMPLATES, 'jquery', 'ui')
JQUERY_DEST_IMAGES = File.join(JQUERY_DEST_TEMPLATES, 'jquery', 'ui')
JQUERY_DEST_TASKS = File.join(JQUERY_DEST_TEMPLATES, 'lib', 'tasks')

namespace :build do
  desc 'Build the stylesheets and templates for jQuery.'
  task :jquery do

    FileUtils.remove_dir JQUERY_DEST_TEMPLATES if File.exists? JQUERY_DEST_TEMPLATES
    FileUtils.mkdir_p(File.join(JQUERY_DEST_TEMPLATES, 'config', 'initializers'))
    FileUtils.mkdir_p(File.join(JQUERY_DEST_TEMPLATES, 'lib', 'tasks'))
    FileUtils.mkdir_p(File.join(JQUERY_DEST_THEMES))

    open File.join(JQUERY_DEST_TEMPLATES, 'manifest.rb'), 'w' do |manifest|

      # jRails
      manifest.print JQUERY_MESSAGE1

      open File.join(JQUERY_DEST_CONFIG, 'jquery.rb'), 'w' do |f|
        f.print(File.read(File.join(JQUERY_SRC_CONFIG, 'jquery.rb')))
      end
      manifest.print "file 'config/initializers/jquery.rb'\n"

      manifest.print "file 'lib/tasks/haml.rake'\n"
      open File.join(JQUERY_DEST_TASKS, 'haml.rake'), 'w' do |f|
        f.print(File.read(File.join(SRC_TASKS, 'haml.rake')))
      end
      manifest.print "file 'lib/tasks/haml.rake'\n"

      # jQuery

      all_jquery_scripts = [
          'intro.js',
          'core.js',
          'deferred.js',
          'support.js',
          'data.js',
          'queue.js',
          'attributes.js',
          'event.js',
          'selector.js',
          'traversing.js',
          'manipulation.js',
          'css.js',
          'ajax.js',
          'ajax/jsonp.js',
          'ajax/script.js',
          'ajax/xhr.js',
          'effects.js',
          'offset.js',
          'dimensions.js',
          'outro.js'
      ].collect { |filename| File.read(File.join(JQUERY_SRC, 'js', filename)) }.join "\n\n"

      scripts = ""

      open File.join(JQUERY_DEST_TEMPLATES, 'jquery.js'), 'w' do |f|
        scripts = concat_files(all_jquery_scripts).gsub(/@VERSION/, File.read(File.join(JQUERY_SRC, 'version.txt'))).gsub(/@DATE/, Time.now().to_s)
        f.print scripts
      end
      manifest.print "javascript 'jquery.js'\n"

      open File.join(JQUERY_DEST_TEMPLATES, 'jquery.min.js'), 'w' do |f|
        f.print compress_js(scripts, "google")
      end
      manifest.print "javascript 'jquery.min.js'\n"
    end
  end
end

namespace :jquery do
  desc 'Remove the prototype / script.aculo.us javascript files'
  task :scrub_default_js do
    files = %W[controls.js dragdrop.js effects.js prototype.js]
    project_dir = File.join(RAILS_ROOT, 'public', 'javascripts')
    files.each do |fname|
      FileUtils.rm File.join(project_dir, fname)
    end
  end
end
  