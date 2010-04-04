desc 'Build all stylesheets and templates.'

namespace :build do
  task :all => ["build:jrails13", "build:jrails14", "build:dynatree", "build:jqgrid", "build:ribbon", "build:jqtouch"] do
  end
end
