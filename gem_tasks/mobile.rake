require 'fileutils'
require 'lib/handle_js_files'
require 'lib/jquery_mobile_theme'

MOBILE_SRC = File.join(GEM_ROOT, 'src', 'mobile')
MOBILE_SRC_IMAGES = File.join(MOBILE_SRC, 'images')
MOBILE_SRC_THEMES = File.join(MOBILE_SRC, 'themes')

MOBILE_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'mobile')
MOBILE_DEST_THEMES = File.join(MOBILE_DEST_TEMPLATES, 'jquery', 'mobile')
MOBILE_DEST_IMAGES = File.join(MOBILE_DEST_THEMES)

all_scripts = [
    'js/jquery.ui.widget.js',
    'js/jquery.mobile.widget.js',
    'js/jquery.mobile.media.js',
    'js/jquery.mobile.support.js',
    'js/jquery.mobile.event.js',
    'js/jquery.mobile.hashchange.js',
    'js/jquery.mobile.page.js',
    'js/jquery.mobile.core.js',
    'js/jquery.mobile.navigation.js',
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
    'js/jquery.mobile.init.js',
    'js/jquery.mobile.themeswitcher.js'
].collect { |filename| File.read(File.join(MOBILE_SRC, filename)) }.join "\n\n"

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
      mobile = JqueryMobileTheme.new(File.join(MOBILE_SRC_THEMES, 'default'))

      base_stylesheets = [
          'jquery.mobile.core.css',
          'jquery.mobile.transitions.css',
          'jquery.mobile.grids.css',
          'jquery.mobile.headerfooter.css',
          'jquery.mobile.navbar.css',
          'jquery.mobile.button.css',
          'jquery.mobile.collapsible.css',
          'jquery.mobile.controlgroup.css',
          'jquery.mobile.dialog.css',
          'jquery.mobile.forms.checkboxradio.css',
          'jquery.mobile.forms.fieldcontain.css',
          'jquery.mobile.forms.select.css',
          'jquery.mobile.forms.textinput.css',
          'jquery.mobile.listview.css',
          'jquery.mobile.forms.slider.css'
      ].collect { |filename| File.read(File.join(MOBILE_SRC_THEMES, 'default', filename)) }.join "\n\n"

      FileUtils.mkdir_p(MOBILE_DEST_THEMES)
      open File.join(MOBILE_DEST_THEMES, '_base.scss'), 'w' do |f|
        sass = MOBILE_MESSAGE2
        IO.popen("sass-convert -F css -T scss", 'r+') { |ff| ff.print(base_stylesheets); ff.close_write; sass += ff.read }
        f.print sass
      end
      manifest.print "stylesheet 'jquery/mobile/_base.scss'\n"

      Dir.foreach MOBILE_SRC_THEMES do |theme|
        next if /^\./ =~ theme
        mobile.convert_theme(theme, File.join(MOBILE_SRC_THEMES, theme), File.join(MOBILE_DEST_THEMES))
        manifest.print "stylesheet 'jquery/mobile/#{theme}.scss'\n"

        # Copy the theme images directory
        src_dir = File.join(MOBILE_SRC_THEMES, theme, 'images')
        dest_dir = File.join(MOBILE_DEST_IMAGES, theme)
        FileUtils.mkdir_p dest_dir

        Dir.foreach(src_dir) do |image|
          next if /^\./ =~ image
          FileUtils.cp(File.join(src_dir, image), dest_dir)
          manifest.print "image 'jquery/mobile/#{theme}/#{image}'\n"
        end
      end

      # glyphish Images
      FileUtils.mkdir_p(File.join(MOBILE_DEST_TEMPLATES, 'glyphish', 'icons-black'))
      src_dir = File.join(MOBILE_SRC_IMAGES, 'glyphish', 'icons-black')
      dest_dir = File.join(MOBILE_DEST_TEMPLATES, 'glyphish', 'icons-black')
      Dir.foreach(src_dir) do |image|
        next if /^\./ =~ image
        FileUtils.cp(File.join(src_dir, image), dest_dir)
        manifest.print "image 'glyphish/icons-black/#{image}'\n"
      end

      FileUtils.mkdir_p(File.join(MOBILE_DEST_TEMPLATES, 'glyphish', 'icons-white'))
      src_dir = File.join(MOBILE_SRC_IMAGES, 'glyphish', 'icons-white')
      dest_dir = File.join(MOBILE_DEST_TEMPLATES, 'glyphish', 'icons-white')
      Dir.foreach(src_dir) do |image|
        next if /^\./ =~ image
        FileUtils.cp(File.join(src_dir, image), dest_dir)
        manifest.print "image 'glyphish/icons-white/#{image}'\n"
      end

      FileUtils.mkdir_p(File.join(MOBILE_DEST_TEMPLATES, 'glyphish', 'mini-icons-black'))
      src_dir = File.join(MOBILE_SRC_IMAGES, 'glyphish', 'mini-icons-black')
      dest_dir = File.join(MOBILE_DEST_TEMPLATES, 'glyphish', 'mini-icons-black')
      Dir.foreach(src_dir) do |image|
        next if /^\./ =~ image
        FileUtils.cp(File.join(src_dir, image), dest_dir)
        manifest.print "image 'glyphish/mini-icons-black/#{image}'\n"
      end

      open File.join(MOBILE_DEST_TEMPLATES, 'glyphish', 'License.txt'), 'w' do |f|
        f.print(File.read(File.join(MOBILE_SRC_IMAGES, 'glyphish', 'Read me first - license.txt')))
      end
      manifest.print "image 'glyphish/License.txt'\n"

    end
  end
end