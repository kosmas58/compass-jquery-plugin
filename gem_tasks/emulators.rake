require 'fileutils'
require 'lib/handle_js_files'

EMULATORS_SRC = File.join(GEM_ROOT, 'src', 'emulators')
EMULATORS_SRC_STYLESHEETS = File.join(EMULATORS_SRC, 'css')
EMULATORS_SRC_IMAGES = File.join(EMULATORS_SRC, 'images')

EMULATORS_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'emulators')
EMULATORS_DEST_STYLESHEETS = File.join(EMULATORS_DEST_TEMPLATES)
EMULATORS_DEST_IMAGES = File.join(EMULATORS_DEST_STYLESHEETS)

EMULATORS_MESSAGE1 = "# Generated by compass-jquery-plugin/gem-tasks/emulators.rake\n# Install with: compass install jquery/emulators\n\n"
EMULATORS_MESSAGE2 = "// Generated by compass-jquery-plugin/gem-tasks/emulators.rake\n\n"

namespace :build do
  desc 'Build the stylesheets and templates for emulators.'
  task :emulators do    
    
    FileUtils.remove_dir EMULATORS_DEST_TEMPLATES if File.exists? EMULATORS_DEST_TEMPLATES 
    FileUtils.mkdir_p(File.join(EMULATORS_DEST_TEMPLATES))
    
    open File.join(EMULATORS_DEST_TEMPLATES, 'manifest.rb'), 'w' do |manifest|
      manifest.print EMULATORS_MESSAGE1
      
      # Stylesheets
      FileUtils.mkdir_p(EMULATORS_DEST_STYLESHEETS)

      Dir.foreach EMULATORS_SRC_STYLESHEETS do |file|
        next unless /\.css$/ =~ file
        css = File.read File.join(EMULATORS_SRC_STYLESHEETS, file)
        sass = ''
        IO.popen("sass-convert -F css -T scss", 'r+') { |f| f.print(css); f.close_write; sass = f.read }
        open(File.join(EMULATORS_DEST_STYLESHEETS, file.gsub(/\.css$/,'.scss')), 'w') do |f|
          f.write EMULATORS_MESSAGE2 + sass
        end
        manifest.print "stylesheet 'emulators/#{file.gsub(/\.css$/,'.scss')}'\n"
      end

      # Emulator Images  
      
      # Copy the images directory
      src_dir = EMULATORS_SRC_IMAGES
      dest_dir = EMULATORS_DEST_IMAGES
      
      Dir.foreach(src_dir) do |image|
        next unless /\.png$/ =~ image
        FileUtils.cp(File.join(src_dir, image), dest_dir)
        manifest.print "image 'emulators/#{image}'\n"
      end
    end
  end
end