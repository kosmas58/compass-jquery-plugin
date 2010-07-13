require 'fileutils'
require 'lib/handle_js_files'

# Compass generator for jqGrid 3.5+
JQGRID_SRC = File.join(GEM_ROOT, 'src', 'jqgrid')
JQGRID_SRC_LOCALES = File.join(JQGRID_SRC, 'config', 'locales') 
JQGRID_SRC_TRANSLATIONS = File.join(JQGRID_SRC, 'js', 'i18n') + "/*.js"

JQGRID_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'jqgrid')
JQGRID_DEST_LOCALES = File.join(JQGRID_DEST_TEMPLATES, 'config', 'locales', 'jquery', 'jqgrid')
JQGRID_DEST_STYLESHEETS = File.join(JQGRID_DEST_TEMPLATES, 'jquery.ui')
JQGRID_DEST_TRANSLATIONS = File.join(JQGRID_DEST_TEMPLATES, 'i18n', 'jqgrid')
JQGRID_DEST_XML = File.join(JQGRID_DEST_TEMPLATES, 'public', 'stylesheets')

JQGRID_MESSAGE1 = "# Generated by compass-jquery-plugin/gem-tasks/jqgrid.rake\n# Install with: compass install jquery/jqgrid\n\n"
JQGRID_MESSAGE2 = "// Generated by compass-jquery-plugin/gem-tasks/jqgrid.rake\n\n"

all_scripts = [
  #'plugins/jquery.contextmenu.js',
  'plugins/jquery.tablednd.js',
  'plugins/ui.multiselect.js',
  'js/grid.base.js',
  'js/grid.celledit.js',
  'js/grid.common.js',
  'js/grid.custom.js',
  'js/grid.formedit.js',
  'js/grid.import.js',  
  'js/grid.inlinedit.js',
  'js/grid.jqueryui.js',
  'js/grid.postext.js',
  'js/grid.setcolumns.js',
  'js/grid.subgrid.js',
  'js/grid.tbltogrid.js',
  'js/grid.treegrid.js',
  'js/jqDnR.js',
  'js/jqModal.js',
  'js/jquery.fmatter.js',
  'js/jquery.searchFilter.js',
  'js/JsonXml.js'
].collect {|filename| File.read(File.join(JQGRID_SRC, filename))}.join "\n\n"

all_stylesheets = [
  'css/ui.jqgrid.css',
  'css/jquery.searchFilter.css',
  'plugins/ui.multiselect.css'  
].collect {|filename| File.read(File.join(JQGRID_SRC, filename))}.join "\n\n"

namespace :build do
  desc 'Build the stylesheets and templates for jqGrid.'
  task :jqgrid do
    
    FileUtils.remove_dir JQGRID_DEST_TEMPLATES if File.exists? JQGRID_DEST_TEMPLATES   
    FileUtils.mkdir_p(File.join(JQGRID_DEST_TEMPLATES, 'config', 'initializers')) 
    
    open File.join(JQGRID_DEST_TEMPLATES, 'manifest.rb'), 'w' do |manifest|
      manifest.print JQGRID_MESSAGE1
    
      open File.join(JQGRID_DEST_TEMPLATES, 'config', 'initializers', 'jqgrid.rb'), 'w' do |f|
        f.print(File.read(File.join(JQGRID_SRC, 'config', 'initializers', 'jqgrid.rb')))
      end
      manifest.print "file 'config/initializers/jqgrid.rb'\n"  
      
      ['jqgrid'].each do |path|
        FileUtils.mkdir_p(JQGRID_DEST_LOCALES)
        Dir.foreach File.join(JQGRID_SRC_LOCALES, 'jquery', path) do |file|
          next unless /\.yml$/ =~ file
          yaml = File.read File.join(JQGRID_SRC_LOCALES, 'jquery', path, file)
          manifest.print "file 'config/locales/jquery/jqgrid/#{file}'\n"
          open File.join(JQGRID_DEST_LOCALES, file), 'w' do |f|
            f.write yaml
          end
        end
      end
    
      open File.join(JQGRID_DEST_TEMPLATES, 'jquery.jqGrid.js'), 'w' do |f|
        f.print concat_files(all_scripts)
      end
      manifest.print "javascript 'jquery.jqGrid.js'\n"
    
      open File.join(JQGRID_DEST_TEMPLATES, 'jquery.jqGrid.min.js'), 'w' do |f|
        f.print compress_js(all_scripts, "google")
      end
      manifest.print "javascript 'jquery.jqGrid.min.js'\n"

      ['i18n'].each do |path|
        FileUtils.mkdir_p File.join(JQGRID_DEST_TRANSLATIONS)
        Dir.foreach File.join(JQGRID_SRC, 'js', path) do |file|
          next unless /\.js$/ =~ file
          js = File.read File.join(JQGRID_SRC, 'js', path, file)
          file.gsub!(/^grid\./,'')          
          manifest.print "javascript '#{File.join(path, 'jqgrid', file)}'\n"
          open File.join(JQGRID_DEST_TRANSLATIONS, file), 'w' do |f|
            f.write js
          end               
          file.gsub!(/\.js$/, '.min.js')
          manifest.print "javascript '#{File.join(path, 'jqgrid', file)}'\n"
          open File.join(JQGRID_DEST_TRANSLATIONS, file), 'w' do |f|
            f.write compress_js(js, "google")
          end
        end
      end
    
      FileUtils.mkdir_p(JQGRID_DEST_STYLESHEETS)
      open File.join(JQGRID_DEST_STYLESHEETS, 'jqGrid.scss'), 'w' do |f|
        sass = JQGRID_MESSAGE2 
        IO.popen("sass-convert -F css -T scss", 'r+') { |ff| ff.print(all_stylesheets); ff.close_write; sass += ff.read }
        f.print sass
      end
      manifest.print "stylesheet 'jquery.ui/jqGrid.scss'\n"
      
      FileUtils.mkdir_p(JQGRID_DEST_XML)    
      open File.join(JQGRID_DEST_XML, 'ellipsis-xbl.xml'), 'w' do |f|
        f.print(File.read(File.join(JQGRID_SRC, 'css', 'ellipsis-xbl.xml')))
      end
      manifest.print "file 'public/stylesheets/ellipsis-xbl.xml'\n"      
    end
  end
end