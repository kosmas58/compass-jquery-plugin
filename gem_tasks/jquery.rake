require 'fileutils'
require 'lib/handle_js_files'
require 'lib/jquery_ui_theme'

# Compass generator for jrails 0.1+
SRC = File.join(GEM_ROOT, 'src', 'jquery')
JRAILS_SRC = File.join(SRC, 'jrails')
JRAILS_SRC_SCRIPTS = JRAILS_SRC + "/*.js"

JQUERY_SRC = File.join(SRC, 'jquery')

JQUERY_UI_SRC = File.join(SRC, 'jquery.ui')
JQUERY_UI_SRC_SCRIPTS = File.join(JQUERY_UI_SRC, 'js') + "/*.js"
JQUERY_UI_SRC_THEMES = File.join(JQUERY_UI_SRC, 'themes')
JQUERY_UI_SRC_TRANSLATIONS = File.join(JQUERY_UI_SRC, 'js', 'i18n') #+ "/*.js"

JHAML_SRC_SCRIPTS = File.join(SRC, 'jquery-haml') + "/*.js"

FLASH_SRC = File.join(SRC, 'flash_messages')
FLASH_SRC_JS_SCRIPTS = FLASH_SRC + "/*.js"
FLASH_SRC_IMAGES = File.join(FLASH_SRC, 'images')

JQUERY_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'jquery')
JQUERY_DEST_SIZZLE = File.join(JQUERY_DEST_TEMPLATES, 'sizzle')
JQUERY_DEST_TRANSLATIONS = File.join(JQUERY_DEST_TEMPLATES, 'i18n', 'jquery.ui')
JQUERY_DEST_THEMES = File.join(JQUERY_DEST_TEMPLATES, 'jquery', 'ui')
JQUERY_DEST_IMAGES = File.join(JQUERY_DEST_TEMPLATES, 'jquery', 'ui')

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
      
      open File.join(JQUERY_DEST_TEMPLATES, 'config', 'initializers', 'jquery.rb'), 'w' do |f|
        f.print(File.read(File.join(JQUERY_SRC, 'config', 'initializers', 'jquery.rb')))
      end
      manifest.print "file 'config/initializers/jquery.rb'\n" 
      
      manifest.print "file 'lib/tasks/haml.rake'\n"
      open File.join(JQUERY_DEST_TEMPLATES, 'lib', 'tasks', 'haml.rake'), 'w' do |f|
        f.print(File.read(File.join(SRC, 'lib', 'tasks', 'haml.rake')))
      end
      manifest.print "file 'lib/tasks/haml.rake'\n"
    
      open File.join(JQUERY_DEST_TEMPLATES, 'jrails.js'), 'w' do |f|
        f.print concat_files(all_files(JRAILS_SRC_SCRIPTS))
      end
      manifest.print "javascript 'jrails.js'\n" 
    
      open File.join(JQUERY_DEST_TEMPLATES, 'jrails.min.js'), 'w' do |f|
        f.print compress_js(all_files(JRAILS_SRC_SCRIPTS), "google")
      end
      manifest.print "javascript 'jrails.min.js'\n" 
   
      # jQuery 1.4
      
      all_jquery_scripts = [
        'intro.js',
        'core.js',
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
      ].collect {|filename| File.read(File.join(JQUERY_SRC, 'js', filename))}.join "\n\n"
      
      open File.join(JQUERY_DEST_TEMPLATES, 'jquery.js'), 'w' do |f|
        f.print concat_files(all_jquery_scripts)
      end
      manifest.print "javascript 'jquery.js'\n" 
    
      open File.join(JQUERY_DEST_TEMPLATES, 'jquery.min.js'), 'w' do |f|
        f.print compress_js(all_jquery_scripts, "google")
      end
      manifest.print "javascript 'jquery.min.js'\n"

      # jQuery 1.4 Compat 1.3
      
      ['compat-1.3'].each do |path|
        Dir.foreach File.join(JQUERY_SRC, path) do |file|
          next unless /\.js$/ =~ file
          js = File.read File.join(JQUERY_SRC, path, file)
          manifest.print "javascript '#{file}'\n"
          open File.join(JQUERY_DEST_TEMPLATES, file), 'w' do |f|
            f.write js
          end               
          file.gsub!(/\.js$/, '.min.js')
          manifest.print "javascript '#{file}'\n"
          open File.join(JQUERY_DEST_TEMPLATES, file), 'w' do |f|
            f.write compress_js(js, "google")
          end
        end
      end   
      
      # jQuery 1.4 Plugins
      
      ['plugins'].each do |path|
        Dir.foreach File.join(JQUERY_SRC, path) do |file|
                    
          if /\.css$/ =~ file
            css = File.read File.join(JQUERY_SRC, path, file)
            sass = ''
            IO.popen("sass-convert -F css -T scss", 'r+') { |f| f.print(css); f.close_write; sass = f.read }
            file.gsub!(/^jquery\./,'').gsub!(/\.css$/, '.scss')
            open File.join(JQUERY_DEST_THEMES, file), 'w' do |f|
              f.write sass
            end
            manifest.print "stylesheet 'jquery/ui/#{file}'\n"
          end     
          
          next unless /\.js$/ =~ file
          js = File.read File.join(JQUERY_SRC, path, file)
          manifest.print "javascript '#{file}'\n"
          open File.join(JQUERY_DEST_TEMPLATES, file), 'w' do |f|
            f.write js
          end               
          file.gsub!(/\.js$/, '.min.js')
          manifest.print "javascript '#{file}'\n"
          open File.join(JQUERY_DEST_TEMPLATES, file), 'w' do |f|
            f.write compress_js(js, "google")
          end
        end
      end
      
      Dir.foreach File.join(JQUERY_SRC, 'plugins', 'images')  do |plugin|
        next if /^\./ =~ plugin
  
        # Copy the theme images directory
        src_dir = File.join(JQUERY_SRC, 'plugins', 'images', plugin)
        dest_dir = File.join(JQUERY_DEST_IMAGES, plugin)
        FileUtils.mkdir_p dest_dir
        
        Dir.foreach(src_dir) do |image|
          next if /^\./ =~ image
          FileUtils.cp(File.join(src_dir, image), dest_dir)    
          manifest.print "image 'jquery/ui/#{plugin}/#{image}'\n"
        end
      end      
    
      # jQuery.UI 1.8.9
    
      # Scripts
      
      all_jquery_ui_scripts = [
        'jquery-ui.js',
        'jquery.effects.blind.js',
        'jquery.effects.bounce.js',
        'jquery.effects.clip.js',
        'jquery.effects.core.js',
        'jquery.effects.drop.js',
        'jquery.effects.explode.js',
        'jquery.effects.fade.js',
        'jquery.effects.fold.js',
        'jquery.effects.highlight.js',
        'jquery.effects.pulsate.js',
        'jquery.effects.scale.js',
        'jquery.effects.shake.js',
        'jquery.effects.slide.js',
        'jquery.effects.transfer.js',
        'jquery.ui.accordion.js',
        'jquery.ui.autocomplete.js',
        'jquery.ui.button.js',
        'jquery.ui.core.js',
        'jquery.ui.datepicker.js',
        'jquery.ui.dialog.js',
        'jquery.ui.draggable.js',
        'jquery.ui.droppable.js',
        'jquery.ui.mouse.js',
        'jquery.ui.panel.js',
        'jquery.ui.position.js',
        'jquery.ui.progressbar.js',
        'jquery.ui.resizable.js',
        'jquery.ui.selectable.js',
        'jquery.ui.selectmenu.js',
        'jquery.ui.slider.js',
        'jquery.ui.sortable.js',
        'jquery.ui.tabs.js',
        'jquery.ui.widget.js'
      ].collect {|filename| File.read(File.join(JQUERY_UI_SRC, 'js', filename))}.join "\n\n"
      
      open File.join(JQUERY_DEST_TEMPLATES, 'jquery-ui.js'), 'w' do |f|
        f.print concat_files(all_jquery_ui_scripts)
      end
      manifest.print "javascript 'jquery-ui.js'\n"
    
      open File.join(JQUERY_DEST_TEMPLATES, 'jquery-ui.min.js'), 'w' do |f|
        f.print compress_js(all_jquery_ui_scripts, "google")
      end
      manifest.print "javascript 'jquery-ui.min.js'\n"
      
      # jQuery UI locales
  
      ['i18n'].each do |path|
        FileUtils.mkdir_p(JQUERY_DEST_TRANSLATIONS)
        Dir.foreach JQUERY_UI_SRC_TRANSLATIONS do |file|
          next unless /^jquery.ui\.datepicker-(.+)\.js$/ =~ file
          lang = file
          js = File.read File.join(JQUERY_UI_SRC_TRANSLATIONS, file)
          file.gsub!(/^jquery.ui\./,'')          
          manifest.print "javascript '#{File.join(path, 'jquery.ui', file)}'\n"
          open File.join(JQUERY_DEST_TRANSLATIONS, file), 'w' do |f|
            f.write js
          end               
          file.gsub!(/\.js$/, '.min.js')
          manifest.print "javascript '#{File.join(path, 'jquery.ui', file)}'\n"
          open File.join(JQUERY_DEST_TRANSLATIONS, file), 'w' do |f|
            f.write compress_js(js, "google")
          end
        end
      end

      # jQuery UI Themes
      
      ui = JqueryUiTheme.new(File.join(JQUERY_UI_SRC_THEMES, 'base')) 
      ui.convert_css(File.join(JQUERY_DEST_THEMES, '_partials'))
       
      all_jquery_ui_stylesheets = [
        '_core.scss',
        '_accordion.scss',
        '_autocomplete.scss',
        '_button.scss',
        '_datepicker.scss',
        '_dialog.scss',
        '_panel.scss',
        '_progressbar.scss',
        '_resizable.scss',
        '_selectable.scss',
        '_selectmenu.scss',
        '_slider.scss',
        '_tabs.scss',
        '_theme.scss'
        ].collect {|filename| File.read(File.join(JQUERY_DEST_THEMES, '_partials', filename))}.join "\n\n"  
                
      open File.join(JQUERY_DEST_THEMES, '_theme.scss'), 'w' do |f|
        sass = JQUERY_MESSAGE2
        f.print(all_jquery_ui_stylesheets)
        f.print sass
        FileUtils.rm_r(File.join(JQUERY_DEST_THEMES, '_partials'))
      end 
      
      manifest.print "stylesheet 'jquery/ui/_theme.scss'\n" 
      
      Dir.foreach JQUERY_UI_SRC_THEMES do |theme|
        next if /^\./ =~ theme
  
        # Convert the stylesheet
        manifest.print "stylesheet 'jquery/ui/#{theme}.scss'\n"
        ui.convert_theme(theme, File.join(JQUERY_UI_SRC_THEMES, theme), File.join(JQUERY_DEST_THEMES))
  
        # Copy the theme images directory
        src_dir = File.join(JQUERY_UI_SRC_THEMES, theme, 'images')
        dest_dir = File.join(JQUERY_DEST_IMAGES, theme)
        FileUtils.mkdir_p dest_dir
                
        Dir.foreach(src_dir) do |image|
          next if /^\./ =~ image
          FileUtils.cp(File.join(src_dir, image), dest_dir)    
          manifest.print "image 'jquery/ui/#{theme}/#{image}'\n"
        end     
      end
      
      # jQuery haml
     
      open File.join(JQUERY_DEST_TEMPLATES, 'jquery.haml.js'), 'w' do |f|
        f.print concat_files(all_files(JHAML_SRC_SCRIPTS))
      end
      manifest.print "javascript 'jquery.haml.js'\n" 
    
      open File.join(JQUERY_DEST_TEMPLATES, 'jquery.haml.min.js'), 'w' do |f|
        f.print compress_js(all_files(JHAML_SRC_SCRIPTS), "google")
      end
      manifest.print "javascript 'jquery.haml.min.js'\n"
      
      #Flash Messages  
      open File.join(JQUERY_DEST_TEMPLATES, 'jquery.flashMessages.js'), 'w' do |f|
        f.print concat_files(all_files(FLASH_SRC_JS_SCRIPTS))
      end
      manifest.print "javascript 'jquery.flashMessages.js'\n"
    
      open File.join(JQUERY_DEST_TEMPLATES, 'jquery.flashMessages.min.js'), 'w' do |f|
        f.print compress_js(all_files(FLASH_SRC_JS_SCRIPTS), "google")
      end
      manifest.print "javascript 'jquery.flashMessages.min.js'\n"
      
      FileUtils.mkdir_p(File.join(JQUERY_DEST_THEMES))
      css = File.read File.join(FLASH_SRC, 'flash_messages.css')
      sass = ''
      IO.popen("sass-convert -F css -T scss", 'r+') { |f| f.print(css); f.close_write; sass = f.read }
      open File.join(JQUERY_DEST_THEMES, '_flash_messages.scss'), 'w' do |f|
        f.write sass
      end
      manifest.print "stylesheet 'jquery/ui/_flash_messages.scss'\n"
      
      # Copy the images directory
      FileUtils.mkdir_p File.join(JQUERY_DEST_IMAGES, 'flash_messages')
      src_dir = FLASH_SRC_IMAGES
      dest_dir = File.join(JQUERY_DEST_IMAGES, 'flash_messages')

      Dir.foreach(src_dir) do |image|
        next unless /\.png$/ =~ image
        FileUtils.cp(File.join(src_dir, image), dest_dir)    
        manifest.print "image 'jquery/ui/flash_messages/#{image}'\n"
      end
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
  