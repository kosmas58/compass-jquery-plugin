JRAILS_MESSAGE1 = "# Generated by compass-jquery-plugin/gem-tasks/jrailsxx.rake\n# Install with: compass -f jquery -p jrails\n\n"
JRAILS_MESSAGE2 = "// Generated by compass-jquery-plugin/gem-tasks/jrailsxx.rake\n\n"
AUTOCOMPLETE_FIX = "\n\n/* Fix Autocomplete */\n\n.ui-autocomplete-loading { background: white/*{bgColorLoading}*/ url(images/ui-anim_basic_16x16.gif)/*{bgImgUrlLoading}*/ right/*{bgLoadingXPos}*/ center/*{bgLoadingYPos}*/ no-repeat/*{bgLoadingRepeat}*/; }"

class JqueryUiTheme

  VARIABLE_NAME_BASE = 'ui_'
  VARIABLE_MATCHER = /(\S*)\/\*\{(\w*)\}\*\//

  attr_accessor :base_theme

  # Initialize with the base theme
  def initialize(version, base_theme_directory)
    if version == 14
      @prefix = 'jquery.ui'
      @version = 14
    else
      @prefix = 'ui'
      @version = 13
    end
    @theme_filename = "#{@prefix}.theme.css"
    @base_theme_directory = base_theme_directory
    @base_theme = File.read(File.join(@base_theme_directory, @theme_filename))
    if @base_theme[3775..3794] == "#363636/*{fcError}*/"
      print "Fixing up bug in 1.7.1 template\n"
      @base_theme[3775..3794] == "#cd0a0a/*{fcError}*/"
    end
    if @base_theme[416,16] == ".ui-widget input"
      print "Fixing up bug in 1.7.3 template\n"
      @base_theme[416,0] = ".ui-widget .ui-widget { font-size: 1em; }\n"
    end
    # Fix opacity issue
    print "Fixing overlay\n"
    @base_theme.sub!(/\/\*\{bgOverlayRepeat\}\*\/; opacity: (\.\d+)\;filter:Alpha\(Opacity=(\d+)\)\/\*\{opacityOverlay\}\*\/\;/, "/*{bgOverlayRepeat}*/; opacity: #{$1}/*{bgOverlayOpacity}*/;filter:Alpha(Opacity=#{$2})/*{bgOverlayAlpha}*/;")
    @base_theme.sub!(/\/\*\{bgShawdowRepeat\}\*\/; opacity: (\.\d+)\;filter:Alpha\(Opacity=(\d+)\)\/\*\{opacityShadow\}\*\/\;/, "/*{bgShadowRepeat}*/; opacity: #{$1}/*{bgShadowOpacity}*/;filter:Alpha(Opacity=#{$2})/*{bgShadowAlpha}*/;")

    # Fix AutoComplete
    if @version == 14
      @base_theme += AUTOCOMPLETE_FIX
    end
    print @base_theme
  end

  # This sets up the Regexp that will extract the variables from a theme
  def regexp
    return @regexp if @regexp
    placeholder = '___PLACEHOLDER___'
    @regexp = @base_theme.dup
    # Install placeholders for the variable data
    @regexp.gsub!(VARIABLE_MATCHER) {placeholder}
    # Strip the header comments
    @regexp.gsub! /.*^\*\/\s*/m, ''
    # Collapse all whitespace
    @regexp.gsub! /\s+/, ' '
    # Escape the literal strings
    @regexp = Regexp.escape(@regexp)
    # Whitespace means nothing
    @regexp.gsub! /\\\ /, '\s+'
    # Fast variable finder
    @regexp.gsub! placeholder, '([^;]*|\S*)'
    # Get 'er done
    @regexp = Regexp.new(@regexp)
  end

  # You can zip this with the regexp captures to create a variable hash
  def regexp_variables
    return @regexp_variables if @regexp_variables
    @regexp_variables = Array.new
    @base_theme.scan(VARIABLE_MATCHER) {@regexp_variables << $2}
    @regexp_variables
  end

  # Convert all the ui.*.css files into sass goodness
  def convert_css(stylesheets)
    FileUtils.mkdir_p(File.join(stylesheets))
    Dir.foreach @base_theme_directory do |file|
      next unless /^#{@prefix}\..*\.css$/ =~ file
      next if ["{#{@prefix}.all.css", "#{@prefix}.base.css"].include? file
      css = File.read(File.join(@base_theme_directory, file))
      if "{#{@prefix}.autocomplete.css".include? file
        # Removing autocomplete image to add it later by script
        if css[112..135] == ".ui-autocomplete-loading"
          css[220,0] = "*/"
          css[112,0] = "/*"
        end
      end
      open File.join(stylesheets, '_' + file.gsub(/\.css$/,'.scss').gsub(/^#{@prefix}\./,'')), 'w' do |f|
        if file == @theme_filename
          f.print(self.class.theme_css2sass(@base_theme))
        else
          f.print(self.class.css2sass(css))
        end
        f.close
      end
    end
  end

  # Create a sass file of variables names and copy the images
  def convert_theme(name, dir, stylesheets)
    if name == 'base'
      theme = @base_theme
    else
      theme = File.read(File.join(dir, @theme_filename))
      if @version == 14
        theme += AUTOCOMPLETE_FIX
      end
    end
    FileUtils.mkdir_p stylesheets
    # Figure out the variables with the regexp
    vars = Hash.new
    regexp.match(theme).captures.each_with_index do |capture, index|
      # Remove variable comments
      capture.gsub! /\/\*\{\w*\}\*\/$/, ''
      # Update url
      capture.gsub! /^url\(images(.*)\)/, "image_url(\"jquery.ui/#{name}\\1\")"
      # Quote most things
      capture = "\"#{capture}\"" if capture =~ /[^#%0-9a-fptxm\-]/ and !(capture =~ /^image_url/) and !(capture =~ /^[A-Za-z]+/)
      vars[VARIABLE_NAME_BASE + regexp_variables[index]] ||= capture
    end
    # Write out the theme sass
    open File.join(stylesheets, "#{name}.scss"), 'w' do |f|
      f.print JRAILS_MESSAGE2
      # Preserve header comment (css2sass currently doesn't convert comments)
      theme =~ /\/\*\s*(.*)^\*\//m
      $1.each {|line| f.print line.gsub(/^(\s*\*\s*)/,'// ')}
      f.print "\n"
      vars.each do |variable_name, value|
        f.print "$#{variable_name}: #{value} !default;\n"
      end
      f.print "\n@import \"jquery.ui/_theme\"\n"
    end
  end

  # Converter for ui.theme.css which has the variable names
  def self.theme_css2sass(theme_css)
    # Install variable names and convert to sass
    sass = css2sass(theme_css.gsub(VARIABLE_MATCHER){"$#{VARIABLE_NAME_BASE}#{$2}"})
    # Convert select lines from literal to programatic syntax
    sass.gsub!(/.*/){|x| /\!/=~x ? x.gsub(/:/,'=').gsub(/ solid /, ' "solid" ') : x}
    sass
  end

  # Sass is simply awesome
  def self.css2sass(css)
    sass = ''
    IO.popen("sass-convert -F scss -T scss", 'r+') { |f| f.print(css); f.close_write; sass = f.read }
    return sass
  end
end
