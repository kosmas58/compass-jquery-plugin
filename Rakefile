require 'bundler'

Bundler::GemHelper.install_tasks

Dir['gem_tasks/**/*.rake'].each { |rake| load rake }

require "rspec/core/rake_task"
Rspec::Core::RakeTask.new(:spec)
