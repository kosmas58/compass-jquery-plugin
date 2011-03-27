require 'fileutils'
require 'find'

GEM_ROOT = File.expand_path(File.join(File.dirname(__FILE__), '..'))
GOOGLE_JS_COMPRESSOR = File.join(GEM_ROOT, 'lib', 'google-compiler-20100917.jar')
YUI_JS_COMPRESSOR = File.join(GEM_ROOT, 'lib', 'yuicompressor-2.4.4.jar')

def compress_js(scripts, compressor)
  min_js = ''
  if (compressor.downcase == "google")
    cmd = %Q/java -jar "#{GOOGLE_JS_COMPRESSOR}" --charset utf8/
  else
    cmd = %Q/java -jar "#{YUI_JS_COMPRESSOR}" --type js --charset utf8/
  end
  IO.popen(cmd, 'r+') { |f| f.print(scripts); f.close_write; min_js = f.read }
  min_js
end

def compress_css(src)
  min_css = ''
  cmd = %Q/java -jar "#{YUI_JS_COMPRESSOR}" --type css --charset utf8/
  IO.popen(cmd, 'r+') { |f| f.print(src); f.close_write; min_css = f.read }
  min_css
end

def concat_files(files)
  out = ''
  files.each do |file|
    out += file
  end
  out
end

def all_files(pattern)
  FileList[pattern].collect { |filename| File.read(filename) }.join "\n\n"
end

def handleTinyMCEDir(manifest, srcDir, destDir)
  len = srcDir.length
  actualDir = destDir
  FileUtils.mkdir_p(destDir)
  Find.find(srcDir) do |entry|
    if File.directory?(entry) and entry != srcDir and entry != actualDir
      actualDir = File.join(destDir, entry[len, 255])
      FileUtils.mkdir_p(actualDir)
    end
  end
  Find.find(srcDir) do |entry|
    if File.file?(entry)
      ending = entry[len, 255]
      if /\.css$/ =~ entry or  /\.htm$/ =~ entry
        css = File.read entry
        open File.join(destDir, ending), 'w' do |f|
          f.write compress_css(css)
        end
      elsif /\.js$/ =~ entry
        js = File.read entry
        open File.join(destDir, ending), 'w' do |f|
          f.write compress_js(js, "yui")
        end
      else
        FileUtils.cp(entry, File.join(destDir, ending))
      end
      manifest.print "javascript 'tiny_mce/#{ending}'\n"
    end
  end
end
