require 'fileutils'
require 'lib/handle_js_files'
require 'lib/jquery.mobile'

# Compass generator for jquery.mobile 3.5+
JQMOBILE_SRC = File.join(GEM_ROOT, 'src', 'jqmobile')
JQMOBILE_SRC_IMAGES = File.join(JQMOBILE_SRC, 'images')
JQMOBILE_SRC_THEMES = File.join(JQMOBILE_SRC, 'themes')

JQMOBILE_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'jqmobile')
JQMOBILE_DEST_THEMES = File.join(JQMOBILE_DEST_TEMPLATES, 'jquery.mobile')
JQMOBILE_DEST_IMAGES = File.join(JQMOBILE_DEST_THEMES)

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
].collect {|filename| File.read(File.join(JQMOBILE_SRC, filename))}.join "\n\n"

all_stylesheets = [
  'css/jquery.mobile-1.0a1.css'  
].collect {|filename| File.read(File.join(JQMOBILE_SRC, filename))}.join "\n\n"

namespace :build do
  desc 'Build the stylesheets and templates for jquery.mobile.'
  task :jqmobile do    
    
    FileUtils.remove_dir JQMOBILE_DEST_TEMPLATES if File.exists? JQMOBILE_DEST_TEMPLATES 
    FileUtils.mkdir_p(File.join(JQMOBILE_DEST_TEMPLATES, 'config', 'initializers'))
    
    open File.join(JQMOBILE_DEST_TEMPLATES, 'manifest.rb'), 'w' do |manifest|
      manifest.print JQMOBILE_MESSAGE1
      
      open File.join(JQMOBILE_DEST_TEMPLATES, 'config', 'initializers', 'jqmobile.rb'), 'w' do |f|
        f.print(File.read(File.join(JQMOBILE_SRC, 'config', 'initializers', 'jqmobile.rb')))
      end
      manifest.print "file 'config/initializers/jqmobile.rb'\n"  
    
      #JavaScripts
    
      open File.join(JQMOBILE_DEST_TEMPLATES, 'jquery.mobile.js'), 'w' do |f|
        f.print concat_files(all_scripts)
      end
      manifest.print "javascript 'jquery.mobile.js'\n"
    
      open File.join(JQMOBILE_DEST_TEMPLATES, 'jquery.mobile.min.js'), 'w' do |f|
        f.print compress_js(all_scripts, "yui")
      end
      manifest.print "javascript 'jquery.mobile.min.js'\n"
      
      # jQuery Mobile Themes
      
      jqm = JqueryMobileTheme.new(File.join(JQMOBILE_SRC_THEMES, 'default')) 
      jqm.convert_css(File.join(JQMOBILE_DEST_THEMES, '_partials'))
       
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
        ].collect {|filename| File.read(File.join(JQMOBILE_DEST_THEMES, '_partials', filename))}.join "\n\n"  
                
      open File.join(JQMOBILE_DEST_THEMES, '_theme.scss'), 'w' do |f|
        sass = JRAILS_MESSAGE2
        f.print(all_jquery_ui_stylesheets)
        f.print sass
        FileUtils.rm_r(File.join(JQMOBILE_DEST_THEMES, '_partials'))
      end 
      
      manifest.print "stylesheet '/_theme.scss', :media => 'screen, projection'\n" 
      
      Dir.foreach JQMOBILE_SRC_THEMES do |theme|
        next if /^\./ =~ theme
  
        # Convert the stylesheet
        manifest.print "stylesheet 'jquery.mobile/#{theme}.scss', :media => 'screen, projection'\n"
        jqm.convert_theme(theme, File.join(JQMOBILE_SRC_THEMES, theme), File.join(JQMOBILE_DEST_THEMES))
  
        # Copy the theme images directory
        src_dir = File.join(JQMOBILE_SRC_THEMES, theme, 'images')
        dest_dir = File.join(JQMOBILE_DEST_IMAGES, theme)
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