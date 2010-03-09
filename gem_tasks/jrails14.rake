require 'fileutils'
require 'lib/handle_js_files'
require 'lib/jquery.ui'

# Compass generator for jrails 0.1+
JRAILS_14_SRC = File.join(GEM_ROOT, 'src', 'jrails.1.4.2')
JRAILS_14_SRC_SCRIPTS = JRAILS_14_SRC + "/*.js"

JQUERY_14_SRC = File.join(GEM_ROOT, 'src', 'jquery.1.4.2')
JQUERY_14_SRC_SCRIPTS = JQUERY_14_SRC + "/*.js"

JQUERY_UI_18_SRC = File.join(GEM_ROOT, 'src', 'jquery.ui.1.8rc3')
JQUERY_UI_18_SRC_SCRIPTS = File.join(JQUERY_UI_18_SRC, 'js') + "/*.js"
JQUERY_UI_18_SRC_THEMES = File.join(JQUERY_UI_18_SRC, 'themes')
JQUERY_UI_18_SRC_TRANSLATIONS = File.join(JQUERY_UI_18_SRC, 'js', 'i18n') #+ "/*.js"

JRAILS_14_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'jrails-1.4.2')
JRAILS_14_DEST_TRANSLATIONS = File.join(JRAILS_14_DEST_TEMPLATES, 'i18n', 'jquery.ui')
JRAILS_14_DEST_THEMES = File.join(JRAILS_14_DEST_TEMPLATES, 'jquery.ui')
JRAILS_14_DEST_IMAGES = File.join(JRAILS_14_DEST_TEMPLATES, 'jquery.ui')

namespace :build do
  desc 'Build the stylesheets and templates for jRails.'
  task :jrails14 do    
    
    FileUtils.remove_dir JRAILS_14_DEST_TEMPLATES if File.exists? JRAILS_14_DEST_TEMPLATES   
    FileUtils.mkdir_p(File.join(JRAILS_14_DEST_TEMPLATES, 'config', 'initializers'))
    
    open File.join(JRAILS_14_DEST_TEMPLATES, 'manifest.rb'), 'w' do |manifest|
   
      # jRails
       
      manifest.print JRAILS_MESSAGE1
      
      open File.join(JRAILS_14_DEST_TEMPLATES, 'config', 'initializers', 'jrails.rb'), 'w' do |f|
        f.print(File.read(File.join(JRAILS_14_SRC, 'config', 'initializers', 'jrails.rb')))
      end
      manifest.print "file 'config/initializers/jrails.rb'\n" 
    
      open File.join(JRAILS_14_DEST_TEMPLATES, 'jrails.js'), 'w' do |f|
        f.print concat_files(all_files(JRAILS_14_SRC_SCRIPTS))
      end
      manifest.print "javascript 'jrails.js'\n" 
    
      open File.join(JRAILS_14_DEST_TEMPLATES, 'jrails.min.js'), 'w' do |f|
        f.print compress_js(all_files(JRAILS_14_SRC_SCRIPTS), "google")
      end
      manifest.print "javascript 'jrails.min.js'\n" 
      
      # jQuery 1.4
    
      open File.join(JRAILS_14_DEST_TEMPLATES, 'jquery-1.4.2.js'), 'w' do |f|
        f.print concat_files(all_files(JQUERY_14_SRC_SCRIPTS))
      end
      manifest.print "javascript 'jquery-1.4.2.js'\n" 
    
      open File.join(JRAILS_14_DEST_TEMPLATES, 'jquery-1.4.2.min.js'), 'w' do |f|
        f.print compress_js(all_files(JQUERY_14_SRC_SCRIPTS), "google")
      end
      manifest.print "javascript 'jquery-1.4.2.min.js'\n" 
      
      # jQuery 1.4 Comapt 1.3
      
      ['compat-1.3'].each do |path|
        Dir.foreach File.join(JQUERY_14_SRC, path) do |file|
          next unless /\.js$/ =~ file
          js = File.read File.join(JQUERY_14_SRC, path, file)
          manifest.print "javascript '#{file}'\n"
          open File.join(JRAILS_14_DEST_TEMPLATES, file), 'w' do |f|
            f.write js
          end               
          file.gsub!(/\.js$/, '.min.js')
          manifest.print "javascript '#{file}'\n"
          open File.join(JRAILS_14_DEST_TEMPLATES, file), 'w' do |f|
            f.write compress_js(js, "google")
          end
        end
      end   
      
      # jQuery 1.4 Plugins
      
      ['plugins'].each do |path|
        Dir.foreach File.join(JQUERY_14_SRC, path) do |file|
          next unless /\.js$/ =~ file
          js = File.read File.join(JQUERY_14_SRC, path, file)
          manifest.print "javascript '#{file}'\n"
          open File.join(JRAILS_14_DEST_TEMPLATES, file), 'w' do |f|
            f.write js
          end               
          file.gsub!(/\.js$/, '.min.js')
          manifest.print "javascript '#{file}'\n"
          open File.join(JRAILS_14_DEST_TEMPLATES, file), 'w' do |f|
            f.write compress_js(js, "google")
          end
        end
      end       
    
      # jQuery.UI 1.8rc3
    
      # Scripts
      
      all_jquery_ui_scripts = [   
        'jquery-ui.js',
        'jquery.effects.blind.js',
        'jquery.effects.bounce.js',
        'jquery.effects.clip.js',
        'jquery.effects.core.js',
        'jquery.effects.drop.js',
        'jquery.effects.explode.js',
        #'jquery.effects.fade.js',
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
        'jquery.ui.position.js',
        'jquery.ui.progressbar.js',
        'jquery.ui.resizable.js',
        'jquery.ui.selectable.js',
        'jquery.ui.slider.js',
        'jquery.ui.sortable.js',
        'jquery.ui.tabs.js',
        'jquery.ui.widget.js'
      ].collect {|filename| File.read(File.join(JQUERY_UI_18_SRC, 'js', filename))}.join "\n\n"  
      
      open File.join(JRAILS_14_DEST_TEMPLATES, 'jquery-ui-1.8rc3.js'), 'w' do |f|
        f.print concat_files(all_jquery_ui_scripts)
      end
      manifest.print "javascript 'jquery-ui-1.8rc3.js'\n"
    
      open File.join(JRAILS_14_DEST_TEMPLATES, 'jquery-ui-1.8rc3.min.js'), 'w' do |f|
        f.print compress_js(all_jquery_ui_scripts, "google")
      end
      manifest.print "javascript 'jquery-ui-1.8rc3.min.js'\n"
      
      # jQuery UI locales
      
#      FileUtils.mkdir_p File.join(JRAILS_14_DEST_TEMPLATES, 'i18n')
#      open File.join(JRAILS_14_DEST_TEMPLATES, 'i18n', 'jquery.ui.locale.js'), 'w' do |f|
#        f.print concat_files(all_files(JQUERY_UI_18_SRC_TRANSLATIONS))
#      end
#      manifest.print "javascript 'i18n/jquery.ui.locale.js'\n"
#          
#      open File.join(JRAILS_14_DEST_TEMPLATES, 'i18n', 'jquery.ui.locale.min.js'), 'w' do |f|
#        f.print compress_js(all_files(JQUERY_UI_18_SRC_TRANSLATIONS), "google")
#      end
#      manifest.print "javascript 'i18n/jquery.ui.locale.min.js'\n"
  
      ['i18n'].each do |path|
        FileUtils.mkdir_p File.join(JRAILS_14_DEST_TRANSLATIONS)
        Dir.foreach JQUERY_UI_18_SRC_TRANSLATIONS do |file|
          next unless /^ui\.datepicker-(.+)\.js$/ =~ file
          lang = file
          #lang.gsub!(/^ui\.datepicker-(.+)\.js$/, '')
          #puts lang
          js = File.read File.join(JQUERY_UI_18_SRC_TRANSLATIONS, file)
          file.gsub!(/^ui\./,'')          
          manifest.print "javascript '#{File.join(path, 'jquery.ui', file)}'\n"
          open File.join(JRAILS_14_DEST_TRANSLATIONS, file), 'w' do |f|
            f.write js
          end               
          file.gsub!(/\.js$/, '.min.js')
          manifest.print "javascript '#{File.join(path, 'jquery.ui', file)}'\n"
          open File.join(JRAILS_14_DEST_TRANSLATIONS, file), 'w' do |f|
            f.write compress_js(js, "google")
          end
        end
      end

      # jQuery UI Themes

      FileUtils.mkdir_p(File.join(JRAILS_14_DEST_THEMES))
      
      ui = JqueryUiTheme.new(14, File.join(JQUERY_UI_18_SRC_THEMES, 'base')) 
      ui.convert_css(File.join(JRAILS_14_DEST_THEMES, '_partials'))
       
      all_jquery_ui_stylesheets = [
        '_core.sass',
        '_accordion.sass',
        '_autocomplete.sass',
        '_button.sass',
        '_datepicker.sass',
        '_dialog.sass',
        '_progressbar.sass',
        '_resizable.sass',
        '_slider.sass',
        '_tabs.sass',
        '_theme.sass'
        ].collect {|filename| File.read(File.join(JRAILS_14_DEST_THEMES, '_partials', filename))}.join "\n\n"  
                
      open File.join(JRAILS_14_DEST_THEMES, '_theme.sass'), 'w' do |f|
        sass = JRAILS_MESSAGE2
        f.print(all_jquery_ui_stylesheets)
        f.print sass
        FileUtils.rm_r(File.join(JRAILS_14_DEST_THEMES, '_partials'))
      end 
      manifest.print "stylesheet 'jquery.ui/_theme.sass', :media => 'screen, projection'\n" 
      
      Dir.foreach JQUERY_UI_18_SRC_THEMES do |theme|
        next if /^\./ =~ theme
  
        # Convert the stylesheet
        manifest.print "stylesheet 'jquery.ui/#{theme}.sass', :media => 'screen, projection'\n"
        ui.convert_theme(theme, File.join(JQUERY_UI_18_SRC_THEMES, theme), File.join(JRAILS_14_DEST_THEMES))
  
        # Copy the theme images directory
        src_dir = File.join(JQUERY_UI_18_SRC_THEMES, theme, 'images')
        dest_dir = File.join(JRAILS_14_DEST_IMAGES, theme)
        FileUtils.mkdir_p dest_dir
        
        Dir.foreach(src_dir) do |image|
          next if /^\./ =~ image
          FileUtils.cp(File.join(src_dir, image), dest_dir)    
          manifest.print "image 'jquery.ui/#{theme}/#{image}'\n"
        end
      end
    end   
  end
end

namespace :jrails do
  desc 'Remove the prototype / script.aculo.us javascript files'
  task :scrub_default_js do
    files = %W[controls.js dragdrop.js effects.js prototype.js]
    project_dir = File.join(RAILS_ROOT, 'public', 'javascripts')
    files.each do |fname|
      FileUtils.rm File.join(project_dir, fname)
    end
  end
end
  