require 'fileutils'
require 'lib/handle_js_files'

CALENDAR_SRC = File.join(GEM_ROOT, 'src', 'calendar')
CALENDAR_SRC_TRANSLATIONS = File.join(CALENDAR_SRC, 'js', 'i18n') + "/*.js"

CALENDAR_DEST_TEMPLATES = File.join(GEM_ROOT, 'templates', 'calendar')
CALENDAR_DEST_STYLESHEETS = File.join(CALENDAR_DEST_TEMPLATES, 'jquery.ui')
CALENDAR_DEST_TRANSLATIONS = File.join(CALENDAR_DEST_TEMPLATES, 'i18n', 'calendar')

CALENDAR_MESSAGE1 = "# Generated by compass-jquery-plugin/gem-tasks/calendar.rake\n# Install with: compass -f jquery -p calendar\n\n"
CALENDAR_MESSAGE2 = "// Generated by compass-jquery-plugin/gem-tasks/calendar.rake\n\n"

all_scripts = [
  'js/jquery.weekcalendar.js',
  'js/jMonthCalendar.js'
].collect {|filename| File.read(File.join(CALENDAR_SRC, filename))}.join "\n\n"

all_stylesheets = [
  'jquery.weekcalendar.css',
  'jMonthCalendar.css'
].collect {|filename| File.read(File.join(CALENDAR_SRC, 'css', filename))}.join "\n\n"

namespace :build do
  desc 'Build the stylesheets and templates for calendar.'
  task :calendar do
    
    FileUtils.remove_dir CALENDAR_DEST_TEMPLATES if File.exists? CALENDAR_DEST_TEMPLATES   
    FileUtils.mkdir_p(File.join(CALENDAR_DEST_TEMPLATES, 'config', 'initializers'))
    
    open File.join(CALENDAR_DEST_TEMPLATES, 'manifest.rb'), 'w' do |manifest|
      manifest.print CALENDAR_MESSAGE1
    
      open File.join(CALENDAR_DEST_TEMPLATES, 'config', 'initializers', 'calendar.rb'), 'w' do |f|
        f.print(File.read(File.join(CALENDAR_SRC, 'config', 'initializers', 'calendar.rb')))
      end
      manifest.print "file 'config/initializers/calendar.rb'\n"  
    
      open File.join(CALENDAR_DEST_TEMPLATES, 'jquery.calendar.js'), 'w' do |f|
        f.print concat_files(all_scripts)
      end
      manifest.print "javascript 'jquery.calendar.js'\n"
    
      open File.join(CALENDAR_DEST_TEMPLATES, 'jquery.calendar.min.js'), 'w' do |f|
        f.print compress_js(all_scripts, "yui")
      end
      manifest.print "javascript 'jquery.calendar.min.js'\n"

#      ['i18n'].each do |path|
#        FileUtils.mkdir_p File.join(CALENDAR_DEST_TRANSLATIONS)
#        Dir.foreach File.join(CALENDAR_SRC, 'js', path) do |file|
#          next unless /\.js$/ =~ file
#          js = File.read File.join(CALENDAR_SRC, 'js', path, file)
#          file.gsub!(/^grid\./,'')          
#          manifest.print "javascript '#{File.join(path, 'calendar', file)}'\n"
#          open File.join(CALENDAR_DEST_TRANSLATIONS, file), 'w' do |f|
#            f.write js
#          end               
#          file.gsub!(/\.js$/, '.min.js')
#          manifest.print "javascript '#{File.join(path, 'calendar', file)}'\n"
#          open File.join(CALENDAR_DEST_TRANSLATIONS, file), 'w' do |f|
#            f.write compress_js(js, "yui")
#          end
#        end
#      end
    
      FileUtils.mkdir_p File.join(CALENDAR_DEST_STYLESHEETS)
      open File.join(CALENDAR_DEST_STYLESHEETS, 'calendar.sass'), 'w' do |f|
        sass = CALENDAR_MESSAGE2 
        IO.popen("css2sass", 'r+') { |ff| ff.print(all_stylesheets); ff.close_write; sass += ff.read }
        f.print sass
      end
      manifest.print "stylesheet 'jquery.ui/calendar.sass'\n"
    end
  end
end