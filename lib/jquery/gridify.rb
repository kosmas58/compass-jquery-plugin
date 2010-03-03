require 'jquery/gridify/grid'

module Gridify
  
  def self.included(base)
    base.extend(ClassMethods)
  end
  
  module ClassMethods
    attr_accessor :grids
    
    def gridify(*args, &block)
      # debugger
      grid = Gridify::Grid.new( self, *args, &block)
      @grids ||= {}
      @grids[grid.name.to_sym] = grid 
      
      unless self.respond_to?(:find_for_grid)
        class_eval <<-EOV
            named_scope :find_for_grid, lambda {|name, params|
              grid = grids[name]
              grid.update_from_params( params )
              grid.current_scope
            }    
        EOV
      end
    end
    
    def grids
      @grids || {}
    end
    
    def grid(name=nil)
      name ? grids[name] : grids[:grid]  
    end
    
    
  end
end
 
class ActiveRecord::Base
  include Gridify
end

