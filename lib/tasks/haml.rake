require 'fileutils'

namespace :haml do
  desc "Convert .erb views to haml and stylesheets to sass"
  task :from_erb do
    puts ".erb to .haml started"
    path = File.join(::Rails.root.to_s, 'app', 'views')
    puts path
    Dir["#{path}/**/*.erb"].each do |file|
      system "html2haml -x #{file} #{file.gsub(/\.erb$/, '.haml')}"
      puts "Converted: #{file}"
    end
    path = File.join(::Rails.root.to_s, 'public', 'stylesheets')
    puts path
    Dir["#{path}/**/*.css"].each do |file|
      next unless /\/compiled\/$/ =~ file
      system "css2sass #{file} #{file.gsub(/\.css$/, '.sass')}"
      puts "Converted: #{file}"
    end
    puts ".erb to .haml finished"
  end

  desc "Convert .html views to haml and stylesheets to sass"
  task :from_html do
    puts ".html to .haml started"
    path = File.join(::Rails.root.to_s, 'app', 'views')
    puts path
    Dir["#{path}/**/*.html"].each do |file|
      system "html2haml -x #{file} #{file.gsub(/\.html$/, '.html.haml')}"
      puts "Converted: #{file}"
    end
    Dir["#{path}/**/*.css"].each do |file|
      system "sass-convert -F scss -T scss #{file} #{file.gsub(/\.css$/, '.scss')}"
      puts "Converted: #{file}"
    end
    puts ".html to .haml finished"
  end

  desc "Convert .html views to .html.haml and .js.haml and stylesheets to sass"
  task :from_demo do
    puts "Demo to .haml started"
    path = File.join(::Rails.root.to_s, 'app', 'views')
    puts path
    Dir["#{path}/**/*.html"].each do |file|
      system "html2haml -x #{file} #{file.gsub(/\.html$/, '.html.haml')}"
      system "html2haml -x #{file} #{file.gsub(/\.html$/, '.js.haml')}"
      puts "Converted: #{file}"
    end
    Dir["#{path}/**/*.css"].each do |file|
      system "sass-convert -F scss -T scss #{file} #{file.gsub(/\.css$/, '.scss')}"
      puts "Converted: #{file}"
    end
    puts "Demo to .haml finished"
  end
end
