require 'fileutils'
require 'lib/handle_js_files'
require 'lib/jquery2.ui'

# Compass generator for jrails 0.1+
JRAILS_XX_SRC = File.join(GEM_ROOT, 'src', '1.4', 'jrails.1.4.2')
JRAILS_XX_SRC_SCRIPTS = JRAILS_XX_SRC + "/*.js"

JQUERY_UI_18_SRC = File.join(GEM_ROOT, 'src', '1.4', 'jquery.ui.1.8')
JQUERY_UI_18_SRC_THEMES = File.join(JQUERY_UI_18_SRC, 'themes')

JRAILS_XX_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'jrails-x.x')
JRAILS_XX_DEST_THEMES = File.join(JRAILS_XX_DEST_TEMPLATES, 'jquery.ui')

namespace :build do
  desc 'Build the stylesheets and templates for jRails.'
  task :jrailsxx do    
    
    FileUtils.remove_dir JRAILS_XX_DEST_TEMPLATES if File.exists? JRAILS_XX_DEST_TEMPLATES   
    FileUtils.mkdir_p(File.join(JRAILS_XX_DEST_THEMES))
    
    open File.join(JRAILS_XX_DEST_TEMPLATES, 'manifest.rb'), 'w' do |manifest|
   
      # jQuery UI Themes
      
      ui = JqueryUiTheme.new(14, File.join(JQUERY_UI_18_SRC_THEMES, 'base')) 
      ui.convert_css(File.join(JRAILS_XX_DEST_THEMES, '_partials'))   
       
      all_jquery_ui_stylesheets = [
        '_core.scss',
        '_accordion.scss',
        '_autocomplete.scss',
        '_button.scss',
        '_datepicker.scss',
        '_dialog.scss',
        '_progressbar.scss',
        '_resizable.scss',
        '_slider.scss',
        '_tabs.scss',
        '_theme.scss'
        ].collect {|filename| File.read(File.join(JRAILS_XX_DEST_THEMES, '_partials', filename))}.join "\n\n" 
                
      open File.join(JRAILS_XX_DEST_THEMES, '_theme.scss'), 'w' do |f|
        sass = JRAILS_MESSAGE2
        f.print(all_jquery_ui_stylesheets)
        f.print sass
        FileUtils.rm_r(File.join(JRAILS_XX_DEST_THEMES, '_partials'))
      end 
      
      manifest.print "stylesheet 'jquery.ui/_theme.scss', :media => 'screen, projection'\n" 
      
      Dir.foreach JQUERY_UI_18_SRC_THEMES do |theme|
        next if /^\./ =~ theme
  
        # Convert the stylesheet
        manifest.print "stylesheet 'jquery.ui/#{theme}.sass', :media => 'screen, projection'\n"
        ui.convert_theme(theme, File.join(JQUERY_UI_18_SRC_THEMES, theme), File.join(JRAILS_XX_DEST_THEMES))
  
        # Copy the theme images directory
        src_dir = File.join(JQUERY_UI_18_SRC_THEMES, theme, 'images')
        dest_dir = File.join(JRAILS_XX_DEST_IMAGES, theme)
        FileUtils.mkdir_p dest_dir
        
        # Fix for Autocomplete
        if theme != :base 
          image = 'ui-anim_basic_16x16.gif'
          FileUtils.cp(File.join(JQUERY_UI_18_SRC_THEMES, 'base/images', image), dest_dir) 
          manifest.print "image 'jquery.ui/#{theme}/#{image}'\n"
        end
        
        Dir.foreach(src_dir) do |image|
          next if /^\./ =~ image
          FileUtils.cp(File.join(src_dir, image), dest_dir)    
          manifest.print "image 'jquery.ui/#{theme}/#{image}'\n"
        end     
      end
    end   
  end
end
