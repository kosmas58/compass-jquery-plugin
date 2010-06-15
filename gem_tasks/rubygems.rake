desc 'Build all stylesheets and templates.'

namespace :build do
  task :all => ["build:jrails", "build:dynatree", "build:jqgrid", "build:secret_sauce", "build:ribbon", "build:jqtouch", "build:jqical"] do
  end
end
