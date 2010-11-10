desc 'Build all stylesheets and templates.'

namespace :build do
  task :all => [
    "build:jrails",
    "build:tools",
    "build:dynatree",
    "build:jstree",
    "build:jqgrid",
    "build:secret_sauce",
    "build:ribbon",
    "build:ical",
    "build:jqtouch",
    "build:mobile",
    "build:emulators"
  ] do
  end
end
