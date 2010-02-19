desc 'Build all stylesheets and templates.'

namespace :build do
  task :all => ["build:jrails13", "build:jrails14", "build:dynatree"] do
  end
end
