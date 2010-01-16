desc 'Build all stylesheets and templates.'

namespace :build do
  task :all => ["build:jrails", "build:dynatree", "build:jqgrid", "build:secret_sauce", "build:calendar", "build:jqtouch"] do
  end
end
