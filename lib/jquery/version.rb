module CompassJqueryPlugin#:nodoc:

  class VERSION #:nodoc:
    
    PATCH = 4 # Set to nil for official release
    TINY  = 1
    MINOR = 2
    MAJOR = 0

    STRING = [MAJOR, MINOR, TINY, PATCH].compact.join('.')
    STABLE_STRING = [MAJOR, MINOR, TINY].join('.')
  end
end