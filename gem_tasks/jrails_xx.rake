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
    FileUtils.mkdir_p(File.join(JRAILS_XX_DEST_TEMPLATES, 'config', 'initializers'))
    
    open File.join(JRAILS_XX_DEST_TEMPLATES, 'manifest.rb'), 'w' do |manifest|
   
      # jQuery UI Themes
      
      ui = JqueryUiTheme.new(14, File.join(JQUERY_UI_18_SRC_THEMES, 'base')) 
      ui.convert_css(File.join(JRAILS_XX_DEST_THEMES, '_partials'))
       
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
        ].collect {|filename| File.read(File.join(JRAILS_XX_DEST_THEMES, '_partials', filename))}.join "\n\n"  
                
      open File.join(JRAILS_XX_DEST_THEMES, '_theme.sass'), 'w' do |f|
        sass = JRAILS_MESSAGE2
        f.print(all_jquery_ui_stylesheets)
        f.print sass
        #FileUtils.rm_r(File.join(JRAILS_XX_DEST_THEMES, '_partials'))
      end 
      
      # Workaround until I can convert jquery.ui.theme.css
      #FileUtils.cp(File.join(JQUERY_UI_18_SRC, '_theme.sass'), JRAILS_XX_DEST_THEMES)
      #manifest.print "stylesheet 'jquery.ui/_theme.sass', :media => 'screen, projection'\n" 
      
    
    end   
  end
end
