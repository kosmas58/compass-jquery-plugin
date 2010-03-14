desc 'Build all stylesheets and templates.'

namespace :build do
  task :all => ["build:jrails13", "build:jrails14", "build:dynatree14", "build:dynatree13", "build:jqgrid"] do
  end
end
