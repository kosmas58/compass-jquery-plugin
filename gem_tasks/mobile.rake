require 'fileutils'
require 'lib/handle_js_files'
require 'lib/jquery.mobile'

# Compass generator for jquery.mobile 3.5+
MOBILE_SRC = File.join(GEM_ROOT, 'src', 'mobile')
MOBILE_SRC_IMAGES = File.join(MOBILE_SRC, 'images')
MOBILE_SRC_THEMES = File.join(MOBILE_SRC, 'themes')

MOBILE_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'mobile')
MOBILE_DEST_THEMES = File.join(MOBILE_DEST_TEMPLATES, 'jquery.mobile')
MOBILE_DEST_IMAGES = File.join(MOBILE_DEST_THEMES)

all_scripts = [
  'js/jquery.ui.widget.js',
  'js/jquery.mobile.widget.js',
  'js/jquery.mobile.support.js',
  'js/jquery.mobile.event.js',
  'js/jquery.mobile.hashchange.js',
  'js/jquery.mobile.page.js',
  'js/jquery.mobile.fixHeaderFooter.js',
  'js/jquery.mobile.forms.checkboxradio.js',
  'js/jquery.mobile.forms.textinput.js',
  'js/jquery.mobile.forms.select.js',
  'js/jquery.mobile.buttonMarkup.js',
  'js/jquery.mobile.forms.button.js',
  'js/jquery.mobile.forms.slider.js',
  'js/jquery.mobile.collapsible.js',
  'js/jquery.mobile.controlGroup.js',
  'js/jquery.mobile.fieldContain.js',
  'js/jquery.mobile.listview.js',
  'js/jquery.mobile.listview.filter.js',
  'js/jquery.mobile.dialog.js',
  'js/jquery.mobile.navbar.js',
  'js/jquery.mobile.grid.js',
  'js/jquery.mobile.js',
  'js/jquery.mobile.themeswitcher.js'
].collect {|filename| File.read(File.join(MOBILE_SRC, filename))}.join "\n\n"

namespace :build do
  desc 'Build the stylesheets and templates for jquery.mobile.'
  task :mobile do    
    
    FileUtils.remove_dir MOBILE_DEST_TEMPLATES if File.exists? MOBILE_DEST_TEMPLATES 
    FileUtils.mkdir_p(File.join(MOBILE_DEST_TEMPLATES, 'config', 'initializers'))
    
    open File.join(MOBILE_DEST_TEMPLATES, 'manifest.rb'), 'w' do |manifest|
      manifest.print MOBILE_MESSAGE1
      
      open File.join(MOBILE_DEST_TEMPLATES, 'config', 'initializers', 'mobile.rb'), 'w' do |f|
        f.print(File.read(File.join(MOBILE_SRC, 'config', 'initializers', 'mobile.rb')))
      end
      manifest.print "file 'config/initializers/mobile.rb'\n"  
    
      #JavaScripts
    
      open File.join(MOBILE_DEST_TEMPLATES, 'jquery.mobile.js'), 'w' do |f|
        f.print concat_files(all_scripts)
      end
      manifest.print "javascript 'jquery.mobile.js'\n"
    
      open File.join(MOBILE_DEST_TEMPLATES, 'jquery.mobile.min.js'), 'w' do |f|
        f.print compress_js(all_scripts, "yui")
      end
      manifest.print "javascript 'jquery.mobile.min.js'\n"
      
      # jQuery Mobile Themes
      
      jqm = JqueryMobileTheme.new(File.join(MOBILE_SRC_THEMES, 'default')) 
      jqm.convert_css(File.join(MOBILE_DEST_THEMES, '_partials'))
       
      all_jquery_ui_stylesheets = [
        '_core.scss',
        '_button.scss',
        '_collapsible.scss',
        '_controlgroup.scss',
        '_dialog.scss',
        '_forms.checkboxradio.scss',
        '_forms.fieldcontain.scss',
        '_forms.select.scss',
        '_forms.slider.scss',
        '_forms.textinput.scss',
        '_grids.scss',
        '_headerfooter.scss',
        '_listview.scss',
        '_navbar.scss',
        '_transitions.scss',
        '_theme.scss'
        ].collect {|filename| File.read(File.join(MOBILE_DEST_THEMES, '_partials', filename))}.join "\n\n"  
                
      open File.join(MOBILE_DEST_THEMES, '_theme.scss'), 'w' do |f|
        sass = JRAILS_MESSAGE2
        f.print(all_jquery_ui_stylesheets)
        f.print sass
        FileUtils.rm_r(File.join(MOBILE_DEST_THEMES, '_partials'))
      end 
      
      manifest.print "stylesheet 'jquery.mobile/_theme.scss', :media => 'screen, projection'\n" 
      
      Dir.foreach MOBILE_SRC_THEMES do |theme|
        next if /^\./ =~ theme
  
        # Convert the stylesheet
        manifest.print "stylesheet 'jquery.mobile/#{theme}.scss', :media => 'screen, projection'\n"
        jqm.convert_theme(theme, File.join(MOBILE_SRC_THEMES, theme), File.join(MOBILE_DEST_THEMES))
  
        # Copy the theme images directory
        src_dir = File.join(MOBILE_SRC_THEMES, theme, 'images')
        dest_dir = File.join(MOBILE_DEST_IMAGES, theme)
        FileUtils.mkdir_p dest_dir
                
        Dir.foreach(src_dir) do |image|
          next if /^\./ =~ image
          FileUtils.cp(File.join(src_dir, image), dest_dir)    
          manifest.print "image 'jquery.mobile/#{theme}/#{image}'\n"
        end     
      end
    end
  end
end