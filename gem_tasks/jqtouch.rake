require 'fileutils'
require 'lib/handle_js_files'
require 'lib/jqtouch_theme'

JQTOUCH_SRC = File.join(GEM_ROOT, 'src', 'jqtouch')
JQTOUCH_SRC_CONFIG = File.join(JQTOUCH_SRC, 'config', 'initializers')
JQTOUCH_SRC_STYLESHEETS = File.join(JQTOUCH_SRC, 'css')
JQTOUCH_SRC_IMAGES = File.join(JQTOUCH_SRC, 'images')
JQTOUCH_SRC_THEMES = File.join(JQTOUCH_SRC, 'themes')

JQTOUCH_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'jqtouch')
JQTOUCH_DEST_CONFIG = File.join(JQTOUCH_DEST_TEMPLATES, 'config', 'initializers')
JQTOUCH_DEST_STYLESHEETS = File.join(JQTOUCH_DEST_TEMPLATES, 'jquery', 'touch')
JQTOUCH_DEST_THEMES = File.join(JQTOUCH_DEST_STYLESHEETS)
JQTOUCH_DEST_IMAGES = File.join(JQTOUCH_DEST_STYLESHEETS)

all_scripts = [
    'js/jqtouch.js',
    'js/jqtouch.transitions.js',
    'js/mod_spinningwheel.js',
    'js/zflow.js',
    'js/jqtouch-ical.js',
    'js/jquery.event.drag-1.0.js',
    'js/jquery.event.drop-1.0.js',
    'js/jquery.touch.js',
    'js/scrolling.css.js',
    'js/chain.js',
    'js/extensions/jqt.autotitles.js',
    'js/extensions/jqt.database.js',
    'js/extensions/jqt.dynamicheight.js',
    'js/extensions/jqt.floaty.js',
    'js/extensions/jqt.gestures.js',
    'js/extensions/jqt.horizontal-scroll.js',
    'js/extensions/jqt.location.js',
    'js/extensions/jqt.offline.js',
    'js/extensions/jqt.photo.js',
    'js/extensions/jqt.scaling.js',
    'js/extensions/jqt.scroll.js',
    'js/extensions/jqt.scrolling.js',
    'js/extensions/jqt.sliding.js',
    #'js/extensions/jqt.tscroll.js',
    'js/extensions/jqt.vertical-scroll.js'
].collect { |filename| File.read(File.join(JQTOUCH_SRC, filename)) }.join "\n\n"

all_stylesheets = [
    'css/jqtouch.css',
    'css/scrolling.css',
    #'css/jqt.tscroll.css',
    'css/spinningwheel.css',
    'css/zflow.css',
    'css/jqtouch-ical.css',
    'css/jqt.photo.css'
].collect { |filename| File.read(File.join(JQTOUCH_SRC, filename)) }.join "\n\n"

namespace :build do
  desc 'Build the stylesheets and templates for jqtouch.'
  task :jqtouch do

    FileUtils.remove_dir JQTOUCH_DEST_TEMPLATES if File.exists? JQTOUCH_DEST_TEMPLATES
    FileUtils.mkdir_p(File.join(JQTOUCH_DEST_TEMPLATES, 'config', 'initializers'))

    open File.join(JQTOUCH_DEST_TEMPLATES, 'manifest.rb'), 'w' do |manifest|
      manifest.print JQTOUCH_MESSAGE1

      open File.join(JQTOUCH_DEST_CONFIG, 'jqtouch.rb'), 'w' do |f|
        f.print(File.read(File.join(JQTOUCH_SRC_CONFIG, 'jqtouch.rb')))
      end
      manifest.print "file 'config/initializers/jqtouch.rb'\n"

      #JavaScripts

      open File.join(JQTOUCH_DEST_TEMPLATES, 'jquery.jqtouch.js'), 'w' do |f|
        f.print concat_files(all_scripts)
      end
      manifest.print "javascript 'jquery.jqtouch.js'\n"

      open File.join(JQTOUCH_DEST_TEMPLATES, 'jquery.jqtouch.min.js'), 'w' do |f|
        f.print compress_js(all_scripts, "yui")
      end
      manifest.print "javascript 'jquery.jqtouch.min.js'\n"

      # Stylesheets
      FileUtils.mkdir_p(JQTOUCH_DEST_STYLESHEETS)

      open File.join(JQTOUCH_DEST_STYLESHEETS, 'jqtouch.scss'), 'w' do |f|
        sass = JQTOUCH_MESSAGE2
        IO.popen("sass-convert -F css -T scss", 'r+') { |ff| ff.print(all_stylesheets); ff.close_write; sass += ff.read }
        f.print sass
      end
      manifest.print "stylesheet 'jquery/touch/jqtouch.scss'\n"

      Dir.foreach JQTOUCH_SRC_STYLESHEETS do |file|
        next unless /\iphone-emulator.css$/ =~ file
        css = File.read File.join(JQTOUCH_SRC_STYLESHEETS, file)
        sass = ''
        IO.popen("sass-convert -F css -T scss", 'r+') { |f| f.print(css); f.close_write; sass = f.read }
        open(File.join(JQTOUCH_DEST_STYLESHEETS, file.gsub(/\.css$/, '.scss')), 'w') do |f|
          f.write JQTOUCH_MESSAGE2 + sass
        end
        manifest.print "stylesheet 'jquery/touch/#{file.gsub(/\.css$/, '.scss')}'\n"
      end

      # iPhone Images  

      # Copy the images directory
      FileUtils.mkdir_p(File.join(JQTOUCH_DEST_IMAGES))
      src_dir = JQTOUCH_SRC_IMAGES
      dest_dir = JQTOUCH_DEST_IMAGES

      Dir.foreach(src_dir) do |image|
        next unless /\.png$/ =~ image
        FileUtils.cp(File.join(src_dir, image), dest_dir)
        manifest.print "image 'jquery/touch/#{image}'\n"
      end

      # iCal Images
      FileUtils.mkdir_p(File.join(JQTOUCH_DEST_IMAGES, 'ical'))
      src_dir = File.join(JQTOUCH_SRC_IMAGES, 'ical')
      dest_dir = File.join(JQTOUCH_DEST_IMAGES, 'ical')
      Dir.foreach(src_dir) do |image|
        next if /^\./ =~ image
        FileUtils.cp(File.join(src_dir, image), dest_dir)
        manifest.print "image 'jquery/touch/ical/#{image}'\n"
      end

      # Photo Images
      FileUtils.mkdir_p(File.join(JQTOUCH_DEST_IMAGES, 'photo'))
      src_dir = File.join(JQTOUCH_SRC_IMAGES, 'photo')
      dest_dir = File.join(JQTOUCH_DEST_IMAGES, 'photo')
      Dir.foreach(src_dir) do |image|
        next if /^\./ =~ image
        FileUtils.cp(File.join(src_dir, image), dest_dir)
        manifest.print "image 'jquery/touch/photo/#{image}'\n"
      end

      # Spinning wheel images    
      FileUtils.mkdir_p(File.join(JQTOUCH_DEST_IMAGES, 'sw'))
      src_dir = File.join(JQTOUCH_SRC_IMAGES, 'sw')
      dest_dir = File.join(JQTOUCH_DEST_IMAGES, 'sw')
      Dir.foreach(src_dir) do |image|
        next if /^\./ =~ image
        FileUtils.cp(File.join(src_dir, image), dest_dir)
        manifest.print "image 'jquery/touch/sw/#{image}'\n"
      end

      # jQuery jQTouch Themes

      FileUtils.mkdir_p(JQTOUCH_DEST_THEMES)
      jqtouch = JqTouchTheme.new()

      Dir.foreach JQTOUCH_SRC_THEMES do |theme|
        next if /^\./ =~ theme
        jqtouch.convert_theme(theme, File.join(JQTOUCH_SRC_THEMES, theme), File.join(JQTOUCH_DEST_THEMES))
        manifest.print "stylesheet 'jquery/touch/#{theme}.scss'\n"

        # Copy the theme images directory
        src_dir = File.join(JQTOUCH_SRC_THEMES, theme, 'img')
        dest_dir = File.join(JQTOUCH_DEST_IMAGES, "#{theme}")
        FileUtils.mkdir_p dest_dir

        Dir.foreach(src_dir) do |image|
          next if /^\./ =~ image
          FileUtils.cp(File.join(src_dir, image), dest_dir)
          manifest.print "image 'jquery/touch/#{theme}/#{image}'\n"
        end
      end
    end
  end
end
