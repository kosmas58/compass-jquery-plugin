require 'fileutils'
SRC = File.join(RAILS_ROOT, 'tmp', 'jquerytools')

def convert2haml(src, dest)
  system "html2haml -x #{src} #{dest}"
  puts "Converted: #{src}"
end

def cleanup(pattern)
  puts "Cleanup started for: #{pattern}"
  Dir["#{pattern}"].each do |file|
    FileUtils.remove_file file if File.exists? file
    puts "Removed: #{file}"
  end
  puts "Cleanup finished for: #{pattern}"
end

namespace :jquery do
  namespace :tools do
    
    namespace :haml do
      desc 'Cleanup directory'
      task :cleanup, :dir do | t, args |
        cleanup(args[:dir])
      end
    end
    
    namespace :convert do
      desc 'Convert /test files to haml'
      task :test do
        puts "Haml conversion started for /test files:"
        
        path = File.join(SRC, 'test')
        cleanup("#{path}/**/*.html.haml")
        Dir["#{path}/**/*.htm"].each do |src|
          dest = src.gsub(/\.htm$/, '.html.haml')
          convert2haml(src, dest)
        end
        puts "Haml conversion finished for /test files."
      end
    end
  end
end
