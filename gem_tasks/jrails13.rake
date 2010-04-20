require 'fileutils'
require 'lib/handle_js_files'
require 'lib/jquery.ui'

# Compass generator for jrails 0.1+
JRAILS_13_SRC = File.join(GEM_ROOT, 'src', '1.3', 'jrails.1.3.2')
JRAILS_13_SRC_SCRIPTS = JRAILS_13_SRC + "/*.js"

JHAML_13_SRC_SCRIPTS = File.join(GEM_ROOT, 'src', '1.3', 'jquery-haml') + "/*.js"

JQUERY_13_SRC = File.join(GEM_ROOT, 'src', '1.3', 'jquery.1.3.2')
JQUERY_13_SRC_SCRIPTS = JQUERY_13_SRC + "/*.js"

JQUERY_UI_17_SRC = File.join(GEM_ROOT, 'src', '1.3', 'jquery.ui.1.7.2')
JQUERY_UI_17_SRC_SCRIPTS = File.join(JQUERY_UI_17_SRC, 'js') + "/*.js"
JQUERY_UI_17_SRC_THEMES = File.join(JQUERY_UI_17_SRC, 'themes')
JQUERY_UI_17_SRC_TRANSLATIONS = File.join(JQUERY_UI_17_SRC, 'js', 'i18n') #+ "/*.js"

JRAILS_13_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'jrails-1.3')
JRAILS_13_DEST_TRANSLATIONS = File.join(JRAILS_13_DEST_TEMPLATES, 'i18n', 'jquery.ui')
JRAILS_13_DEST_THEMES = File.join(JRAILS_13_DEST_TEMPLATES, 'jquery.ui')
JRAILS_13_DEST_IMAGES = File.join(JRAILS_13_DEST_TEMPLATES, 'jquery.ui')


namespace :build do
  desc 'Build the stylesheets and templates for jRails.'
  task :jrails13 do    
    
    FileUtils.remove_dir JRAILS_13_DEST_TEMPLATES if File.exists? JRAILS_13_DEST_TEMPLATES   
    FileUtils.mkdir_p(File.join(JRAILS_13_DEST_TEMPLATES, 'config', 'initializers'))
    FileUtils.mkdir_p(File.join(JRAILS_13_DEST_THEMES))
    
    open File.join(JRAILS_13_DEST_TEMPLATES, 'manifest.rb'), 'w' do |manifest|
   
      # jRails
       
      manifest.print JRAILS_MESSAGE1
      
      open File.join(JRAILS_13_DEST_TEMPLATES, 'config', 'initializers', 'jrails.rb'), 'w' do |f|
        f.print(File.read(File.join(JRAILS_13_SRC, 'config', 'initializers', 'jrails.rb')))
      end
      manifest.print "file 'config/initializers/jrails.rb'\n" 
    
      open File.join(JRAILS_13_DEST_TEMPLATES, 'jrails.js'), 'w' do |f|
        f.print concat_files(all_files(JRAILS_13_SRC_SCRIPTS))
      end
      manifest.print "javascript 'jrails.js'\n" 
    
      open File.join(JRAILS_13_DEST_TEMPLATES, 'jrails.min.js'), 'w' do |f|
        f.print compress_js(all_files(JRAILS_13_SRC_SCRIPTS), "google")
      end
      manifest.print "javascript 'jrails.min.js'\n" 
      
      # jQuery haml
     
      open File.join(JRAILS_13_DEST_TEMPLATES, 'jquery.haml.js'), 'w' do |f|
        f.print concat_files(all_files(JHAML_13_SRC_SCRIPTS))
      end
      manifest.print "javascript 'jquery.haml.js'\n" 
    
      open File.join(JRAILS_13_DEST_TEMPLATES, 'jquery.haml.min.js'), 'w' do |f|
        f.print compress_js(all_files(JHAML_13_SRC_SCRIPTS), "google")
      end
      manifest.print "javascript 'jquery.haml.min.js'\n"    
      
      # jQuery 1.3
    
      open File.join(JRAILS_13_DEST_TEMPLATES, 'jquery-1.3.2.js'), 'w' do |f|
        f.print concat_files(all_files(JQUERY_13_SRC_SCRIPTS))
      end
      manifest.print "javascript 'jquery-1.3.2.js'\n" 
    
      open File.join(JRAILS_13_DEST_TEMPLATES, 'jquery-1.3.2.min.js'), 'w' do |f|
        f.print compress_js(all_files(JQUERY_13_SRC_SCRIPTS), "google")
      end
      manifest.print "javascript 'jquery-1.3.2.min.js'\n" 
      
      # jQuery 1.3 Plugins
      
      ['plugins'].each do |path|
        Dir.foreach File.join(JQUERY_13_SRC, path) do |file|
          if /\.css$/ =~ file
            css = File.read File.join(JQUERY_13_SRC, path, file)
            sass = ''
            IO.popen("sass-convert", 'r+') { |f| f.print(css); f.close_write; sass = f.read }
            file.gsub!(/^jquery\./,'').gsub!(/\.css$/, '.sass')
            open File.join(JRAILS_13_DEST_THEMES, file), 'w' do |f|
              f.write sass
            end
            manifest.print "stylesheet 'jquery.ui/#{file}', :media => 'screen, projection'\n"    
          end     
          
          next unless /\.js$/ =~ file
          js = File.read File.join(JQUERY_13_SRC, path, file)
          manifest.print "javascript '#{file}'\n"
          open File.join(JRAILS_13_DEST_TEMPLATES, file), 'w' do |f|
            f.write js
          end               
          file.gsub!(/\.js$/, '.min.js')
          manifest.print "javascript '#{file}'\n"
          open File.join(JRAILS_13_DEST_TEMPLATES, file), 'w' do |f|
            f.write compress_js(js, "google")
          end
        end
      end       
      
      Dir.foreach File.join(JQUERY_13_SRC, 'plugins', 'images')  do |plugin|
        next if /^\./ =~ plugin
  
        # Copy the theme images directory
        src_dir = File.join(JQUERY_13_SRC, 'plugins', 'images', plugin)
        dest_dir = File.join(JRAILS_13_DEST_IMAGES, plugin)
        FileUtils.mkdir_p dest_dir
        
        Dir.foreach(src_dir) do |image|
          next if /^\./ =~ image
          FileUtils.cp(File.join(src_dir, image), dest_dir)    
          manifest.print "image 'jquery.ui/#{plugin}/#{image}'\n"
        end
      end
    
      # jQuery.UI 1.7.2
    
      # Scripts
      
      all_jquery_ui_scripts = [      
        'jquery-ui.js',
        'effects.blind.js',
        'effects.bounce.js',
        'effects.clip.js',
        'effects.core.js',
        'effects.drop.js',
        'effects.explode.js',
        'effects.fold.js',
        'effects.highlight.js',
        'effects.pulsate.js',
        'effects.scale.js',
        'effects.shake.js',
        'effects.slide.js',
        'effects.transfer.js',
        'ui.accordion.js',
        'ui.core.js',
        'ui.datepicker.js',
        'ui.dialog.js',
        'ui.draggable.js',
        'ui.droppable.js',
        'ui.progressbar.js',
        'ui.resizable.js',
        'ui.selectable.js',
        'ui.slider.js',
        'ui.sortable.js',
        'ui.tabs.js' 
      ].collect {|filename| File.read(File.join(JQUERY_UI_17_SRC, 'js', filename))}.join "\n\n"  
      
      open File.join(JRAILS_13_DEST_TEMPLATES, 'jquery-ui-1.7.2.js'), 'w' do |f|
        f.print concat_files(all_jquery_ui_scripts)
      end
      manifest.print "javascript 'jquery-ui-1.7.2.js'\n"
    
      open File.join(JRAILS_13_DEST_TEMPLATES, 'jquery-ui-1.7.2.min.js'), 'w' do |f|
        f.print compress_js(all_jquery_ui_scripts, "google")
      end
      manifest.print "javascript 'jquery-ui-1.7.2.min.js'\n"
      
      # jQuery UI locales
      
      ['i18n'].each do |path|
        FileUtils.mkdir_p(JRAILS_13_DEST_TRANSLATIONS)
        Dir.foreach JQUERY_UI_17_SRC_TRANSLATIONS do |file|
          next unless /^ui\.datepicker-(.+)\.js$/ =~ file
          lang = file
          #lang.gsub!(/^ui\.datepicker-(.+)\.js$/, '')
          #puts lang
          js = File.read File.join(JQUERY_UI_17_SRC_TRANSLATIONS, file)
          file.gsub!(/^ui\./,'')          
          manifest.print "javascript '#{File.join(path, 'jquery.ui', file)}'\n"
          open File.join(JRAILS_13_DEST_TRANSLATIONS, file), 'w' do |f|
            f.write js
          end               
          file.gsub!(/\.js$/, '.min.js')
          manifest.print "javascript '#{File.join(path, 'jquery.ui', file)}'\n"
          open File.join(JRAILS_13_DEST_TRANSLATIONS, file), 'w' do |f|
            f.write compress_js(js, "google")
          end
        end
      end

      # jQuery UI Themes
      
      ui = JqueryUiTheme.new(13, File.join(JQUERY_UI_17_SRC_THEMES, 'base')) 

#      ui.convert_css(File.join(JRAILS_13_DEST_THEMES, '_partials'))
#       
#      all_jquery_ui_stylesheets = [
#        '_core.sass',
#        '_accordion.sass',
#        '_datepicker.sass',
#        '_dialog.sass',
#        '_progressbar.sass',
#        '_resizable.sass',
#        '_slider.sass',
#        '_tabs.sass',
#        '_theme.sass'
#        ].collect {|filename| File.read(File.join(JRAILS_13_DEST_THEMES, '_partials', filename))}.join "\n\n"  
#                
#      open File.join(JRAILS_13_DEST_THEMES, '_theme.sass'), 'w' do |f|
#        sass = JRAILS_MESSAGE2
#        f.print(all_jquery_ui_stylesheets)
#        f.print sass
#        FileUtils.rm_r(File.join(JRAILS_13_DEST_THEMES, '_partials'))
#      end 
      
      # Workaround until I can convert ui.theme.css
      FileUtils.cp(File.join(JQUERY_UI_17_SRC, '_theme.sass'), JRAILS_13_DEST_THEMES)
      manifest.print "stylesheet 'jquery.ui/_theme.sass', :media => 'screen, projection'\n" 
      
      Dir.foreach JQUERY_UI_17_SRC_THEMES do |theme|
        next if /^\./ =~ theme
  
        # Convert the stylesheet
        manifest.print "stylesheet 'jquery.ui/#{theme}.sass', :media => 'screen, projection'\n"
        ui.convert_theme(theme, File.join(JQUERY_UI_17_SRC_THEMES, theme), JRAILS_13_DEST_THEMES)
  
        # Copy the theme images directory
        src_dir = File.join(JQUERY_UI_17_SRC_THEMES, theme, 'images')
        dest_dir = File.join(JRAILS_13_DEST_IMAGES, theme)
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
