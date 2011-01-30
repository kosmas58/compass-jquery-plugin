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
    "build:mobile",
    "build:jqtouch",
    "build:emulators"
  ] do
  end
end
