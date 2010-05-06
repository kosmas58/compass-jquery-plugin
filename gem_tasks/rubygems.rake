desc 'Build all stylesheets and templates.'

namespace :build do
  task :all => ["build:jrails13", "build:jrails14", "build:dynatree", "build:jqgrid", "build:secret_sauce", "build:ribbon", "build:jqtouch", "build:calendar"] do
  end
end
