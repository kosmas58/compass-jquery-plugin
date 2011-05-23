desc 'Build all stylesheets and templates.'

namespace :build do
  task :all => [
      "build:jquery",
      "build:tools",
      "build:dynatree",
      "build:jstree",
      "build:jqgrid",
      "build:secret_sauce",
      "build:ribbon",
      "build:ical",
      "build:graphics",
      "build:mobile",
      "build:jqtouch",
      "build:emulators",
      "build:tiny_mce",
      "build:markitup",
  ] do
  end
end
