GEM_ROOT = File.expand_path(File.join(File.dirname(__FILE__), '..'))
GOOGLE_JS_COMPRESSOR = File.join(GEM_ROOT, 'lib', 'compiler.jar')
YUI_JS_COMPRESSOR = File.join(GEM_ROOT, 'lib', 'yuicompressor-2.4.2.jar')

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

def concat_files(files)
  out = ''
  files.each do |file| 
    out += file
  end
  out
end

def all_files(pattern) 
  FileList[pattern].collect {|filename| File.read(filename)}.join "\n\n"
end


 
      