desc 'Build all stylesheets and templates.'
task :build_all => ["jrails:build", "dynatree:build", "jqgrid:build", "secret_sauce:build", "calendar:build"] do
end
