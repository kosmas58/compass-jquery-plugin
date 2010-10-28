desc 'Build all stylesheets and templates.'

namespace :build do
  task :all => ["build:jrails", "build:jqtools", "build:dynatree", "build:jstree", "build:jqgrid", "build:secret_sauce", "build:ribbon", "build:jqical", "build:jqtouch", "build:jqmobile"] do
  end
end
