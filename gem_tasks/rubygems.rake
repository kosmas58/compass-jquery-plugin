desc 'Build all stylesheets and templates.'

namespace :build do
  task :all => [
    "build:jrails",
    "build:tools",
    "build:dynatree",
    "build:jstree",
    "build:ribbon",
    "build:ical",
    "build:jqtouch",
    "build:emulators"] do
  end
end
