require 'fileutils'
require 'lib/handle_js_files'

MARKITUP_SRC = File.join(GEM_ROOT, 'src', 'markitup')
MARKITUP_SRC_VIEWS = File.join(MARKITUP_SRC, 'app', 'views', 'shared')
MARKITUP_SRC_CONFIG = File.join(MARKITUP_SRC, 'config', 'initializers')
MARKITUP_SRC_SETS = File.join(MARKITUP_SRC, 'sets')
MARKITUP_SRC_SKINS = File.join(MARKITUP_SRC, 'skins')
MARKITUP_SRC_TEMP = File.join(MARKITUP_SRC, 'templates')

MARKITUP_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'markitup')
MARKITUP_DEST_VIEWS = File.join(MARKITUP_DEST_TEMPLATES, 'app', 'views', 'shared')
MARKITUP_DEST_CONFIG = File.join(MARKITUP_DEST_TEMPLATES, 'config', 'initializers')
MARKITUP_DEST_SETS = File.join(MARKITUP_DEST_TEMPLATES, 'jquery', 'markitup', 'sets')
MARKITUP_DEST_SKINS = File.join(MARKITUP_DEST_TEMPLATES, 'jquery', 'markitup', 'skins')
MARKITUP_DEST_TEMP = File.join(MARKITUP_DEST_TEMPLATES, 'jquery', 'markitup', 'templates')

MARKITUP_MESSAGE1 = "# Generated by compass-jquery-plugin/gem-tasks/markitup.rake\n# Install with: compass install jquery/markitup\n\n"
MARKITUP_MESSAGE2 = "// Generated by compass-jquery-plugin/gem-tasks/markitup.rake\n\n"

all_scripts = [
    'js/jquery.markitup.js'
].collect { |filename| File.read(File.join(MARKITUP_SRC, filename)) }.join "\n\n"

namespace :build do
  desc 'Build the stylesheets and templates for jquery.markitup.'
  task :markitup do

    FileUtils.remove_dir MARKITUP_DEST_TEMPLATES if File.exists? MARKITUP_DEST_TEMPLATES
    FileUtils.mkdir_p(File.join(MARKITUP_DEST_TEMPLATES, "markitup"))

    open File.join(MARKITUP_DEST_TEMPLATES, 'manifest.rb'), 'w' do |manifest|
      manifest.print MARKITUP_MESSAGE1

      FileUtils.mkdir_p(MARKITUP_DEST_CONFIG)

      open File.join(MARKITUP_DEST_CONFIG, 'mark_it_up.rb'), 'w' do |f|
        f.print(File.read(File.join(MARKITUP_SRC_CONFIG, 'mark_it_up.rb')))
      end
      manifest.print "file 'config/initializers/mark_it_up.rb'\n"

      # JavaScripts

      scripts = ""

      open File.join(MARKITUP_DEST_TEMPLATES, 'jquery.markitup.js'), 'w' do |f|
        scripts = concat_files(all_scripts)
        f.print scripts
      end
      manifest.print "javascript 'jquery.markitup.js'\n"

      open File.join(MARKITUP_DEST_TEMPLATES, 'jquery.markitup.min.js'), 'w' do |f|
        f.print compress_js(scripts, "yui")
      end
      manifest.print "javascript 'jquery.markitup.min.js'\n"

      # Sets
      FileUtils.mkdir_p(File.join(MARKITUP_DEST_SETS))

      Dir.foreach MARKITUP_SRC_SETS do |set|
        next if /^\./ =~ set

        # Convert the script
        script = File.read File.join(MARKITUP_SRC_SETS, "#{set}", "set.js")

        open File.join(MARKITUP_DEST_TEMPLATES, "markitup", "jquery.markitup.set.#{set}.js" ), 'w' do |f|
          f.print script
        end
        manifest.print "javascript 'markitup/jquery.markitup.set.#{set}.js'\n"

        open File.join(MARKITUP_DEST_TEMPLATES, "markitup", "jquery.markitup.set.#{set}.min.js" ), 'w' do |f|
          f.print compress_js(script, "google")
        end
        manifest.print "javascript 'markitup/jquery.markitup.set.#{set}.min.js'\n"

        # Convert the stylesheet
        Dir.foreach File.join(MARKITUP_SRC_SETS, "#{set}") do |file|
          next unless /\.css$/ =~ file
          css = File.read File.join(MARKITUP_SRC_SETS, "#{set}", file)
          css.gsub! /url\(images(.+?)\)/, "image_url(\"jquery/markitup/sets/#{set}\\1\")"
          sass = ''
          IO.popen("sass-convert -F css -T scss", 'r+') { |f| f.print(css); f.close_write; sass = f.read }
          open File.join(MARKITUP_DEST_SETS, "#{set}.scss"), 'w' do |f|
            f.write MARKITUP_MESSAGE2 + sass
          end
          manifest.print "stylesheet 'jquery/markitup/sets/#{set}.scss'\n"
        end

        # Copy the set images directory
        src_dir = File.join(MARKITUP_SRC_SETS, set, 'images')
        dest_dir = File.join(MARKITUP_DEST_SETS, "#{set}")
        FileUtils.mkdir_p dest_dir

        Dir.foreach(src_dir) do |image|
          next if /^\./ =~ image
          FileUtils.cp(File.join(src_dir, image), dest_dir)
          manifest.print "image 'jquery/markitup/sets/#{set}/#{image}'\n"
        end
      end

      # Skins
      FileUtils.mkdir_p(MARKITUP_DEST_SKINS)

      Dir.foreach MARKITUP_SRC_SKINS do |skin|
        next if /^\./ =~ skin

        # Convert the stylesheet

        Dir.foreach File.join(MARKITUP_SRC_SKINS, "#{skin}") do |file|
          next unless /\.css$/ =~ file
          css = File.read File.join(MARKITUP_SRC_SKINS, "#{skin}", file)
          css.gsub! /url\(images(.+?)\)/, "image_url(\"jquery/markitup/skins/#{skin}\\1\")"
          sass = ''
          IO.popen("sass-convert -F css -T scss", 'r+') { |f| f.print(css); f.close_write; sass = f.read }
          open File.join(MARKITUP_DEST_SKINS, "#{skin}.scss"), 'w' do |f|
            f.write MARKITUP_MESSAGE2 + sass
          end
          manifest.print "stylesheet 'jquery/markitup/skins/#{skin}.scss'\n"
        end

        # Copy the skin images directory
        src_dir = File.join(MARKITUP_SRC_SKINS, skin, 'images')
        dest_dir = File.join(MARKITUP_DEST_SKINS, "#{skin}")
        FileUtils.mkdir_p dest_dir

        Dir.foreach(src_dir) do |image|
          next if /^\./ =~ image
          FileUtils.cp(File.join(src_dir, image), dest_dir)
          manifest.print "image 'jquery/markitup/skins/#{skin}/#{image}'\n"
        end
      end

      # Templates

      FileUtils.mkdir_p(MARKITUP_DEST_VIEWS)

      Dir.foreach MARKITUP_SRC_VIEWS do |file|
        next unless /\.haml$/ =~ file
        html = File.read File.join(MARKITUP_SRC_VIEWS, file)
        open File.join(MARKITUP_DEST_VIEWS, file), 'w' do |f|
          f.print(html)
        end
        manifest.print "file 'app/views/shared/#{file}'\n"
      end

      FileUtils.mkdir_p(MARKITUP_DEST_TEMP)
      css = File.read File.join(MARKITUP_SRC_TEMP, "preview.css")
      sass = ''
      IO.popen("sass-convert -F css -T scss", 'r+') { |f| f.print(css); f.close_write; sass = f.read }
      open File.join(MARKITUP_DEST_TEMP, "preview.scss"), 'w' do |f|
        f.write MARKITUP_MESSAGE2 + sass
      end
      manifest.print "stylesheet 'jquery/markitup/templates/preview.scss'\n"
    end
  end
end