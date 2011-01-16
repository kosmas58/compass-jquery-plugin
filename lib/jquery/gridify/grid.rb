require 'jquery/gridify/assertions'
require 'jquery/gridify/grid_options'
require 'jquery/gridify/grid_view'
require 'jquery/gridify/grid_column'
require 'jquery/gridify/grid_finder'

# NOTE: for readablity/clarity, native jqGrid options should be string; Ruby ones as syms

module Gridify
  class Grid
    include Assertions

    # todo: change this so klass is optional, decouple from active record
    def initialize( klass, *args, &block )
      #debugger
      options = args.extract_options! # => args.last.is_a?(Hash) ? args.pop : {}
      assert_exclusive_keys( options, :only, :except)
      
      @resource = klass.to_s.tableize.pluralize
      @name = args.first || :grid
      
      # non-persistent options
      # generate model unless explicitly say no
      build_model = options.delete(:build_model) == false ? false : true
      only = options.delete(:only)
      except = options.delete(:except)
      col_presets = options.delete(:colModel)
      col_include = options[:colInclude]
      
      # assign options
      update options
      
      # build columns from ActiveRecord model (klass)
      if klass.present? && build_model
        @model = build_columns(klass, only, except, col_presets, col_include)
      end
      
      instance_eval(&block) if block
      #(note instance_eval cannot access things outside its scope; otherwise do this:
      #yield self if block_given?
    end
    
    def update( options )
      options.each {|atr, val| send( "#{atr}=", val )}
      # exception "invalid option..."
    end

    def column( name, options={} )
      name = name.to_s
      klass = resource.classify.constantize
      # TODO: set edit options based on ar_column 
      # TODO: edit
      # TODO: handle file input types
      # TODO: custom input types 
      if col = columns_hash[name]
        # update an existing column
        col.update options
        
      elsif ar = klass.columns.detect {|c| c.name==name}
        #debugger
        # create column from database schema
        edit = editable && 
          # only edit accessible attributes
          (klass.accessible_attributes.nil? || klass.accessible_attributes.include?(ar.name))
        args = {
          :ar_column => ar,
          :name => ar.name,
          :value_type => ar.type,
          :searchable => searchable,
          :sortable => sortable,
          :editable => edit
        }.merge(options)
        colModel << GridColumn.new( args)
        
      else
        # create column from scratch
        args = {
          :name => name,
          :value_type => :string,
          :searchable => searchable,
          :sortable => sortable,
          :editable => edit
        }.merge(options)
        colModel << GridColumn.new( args)
      end
    end
  
    def column_names
      colModel.collect {|col| col.name.titleize }
    end
    
    def column_model
      colModel.collect {|col| col.properties }
    end
    
    # normally we need to keep columns an ordered array, sometimes its convenient to have a hash
    def columns_hash
      colModel.inject({}) {|h, col| h[col.name] = col; h }
    end
    
    protected
    
    # # isnt there something in rails to do this already?
    # def parse_options( keys, options )
    #   ops = keys.inject({}) do |h, k| 
    #     val = options.delete(k) 
    #     h[k] = val unless val.nil?
    #     h
    #   end
    #   ops || {}
    # end

    # generate list of columns based on AR model
    # option:  :only or :except
    #          :col_options  hash of hash of preset values for columns (eg from cookie) { :title => {:width => 98}}
    def build_columns( klass, only, except, presets, col_include )
      #debugger
      # stringify
      only = Array(only).map {|s| s.to_s }
      except = Array(except).map {|s| s.to_s }
      presets ||= []
      
      if presets.length > 0
        hashed_defs = {}
        
        klass.columns.collect do |ar|
          #debugger
          next if only.present? && !only.include?(ar.name)
          next if except.present? && except.include?(ar.name)
          hashed_defs[ar.name] = strct2args(klass, ar)
        end.compact
        
        if col_include
          col_include.each do |sub_model|
            my_model = sub_model.to_s
            if klass.inheritable_attributes[:reflections][sub_model].options[:class_name]
              my_class = klass.inheritable_attributes[:reflections][sub_model].options[:class_name].to_s
              model = klass.inheritable_attributes[:reflections][sub_model].options[:class_name].to_s
            else
              my_class = my_model
            end
            Object.const_get(my_class.capitalize).columns.collect do |ar|
              #debugger
              next if only.present? && !only.include?("#{my_model}.#{ar.name}")
              next if except.present? && except.include?("#{my_model}.#{ar.name}")
              hashed_defs["#{my_model}.#{ar.name}"] = strct2args(klass, ar)
            end
          end
        end

        # Take sequence from colModel
        self.colModel = []
        presets.each do |col|
          # create column with default args merged with options given for this column
          self.colModel << GridColumn.new(hashed_defs[col[:name]].merge(col))
        end
      else
        # Take sequence from database definition
        self.colModel = klass.columns.collect do |ar|
          #debugger
          next if only.present? && !only.include?(ar.name)
          next if except.present? && except.include?(ar.name)
          args = strct2args(klass, ar)
          # create column with default args merged with options given for this column
          GridColumn.new(args)
        end.compact
        
        if col_include
          col_include.each do |sub_model|
            my_model = sub_model.to_s
            if klass.inheritable_attributes[:reflections][sub_model].options[:class_name]
              my_class = klass.inheritable_attributes[:reflections][sub_model].options[:class_name].to_s
              model = klass.inheritable_attributes[:reflections][sub_model].options[:class_name].to_s
            else
              my_class = my_model
            end
            Object.const_get(my_class.capitalize).columns.collect do |ar|
              #debugger
              next if only.present? && !only.include?("#{my_model}.#{ar.name}")
              next if except.present? && except.include?("#{my_model}.#{ar.name}")
              args = strct2args(klass, ar, "#{my_model}.")
              # create column with default args merged with options given for this column
              self.colModel << GridColumn.new(args)
            end
          end
        end
      end
    end
    
    private
  
      def strct2args(my_class, record, prefix="")
        is_key = (record.name=='id')
        edit = editable && !is_key && 
          # only edit accessible attributes
          (my_class.accessible_attributes.nil? || my_class.accessible_attributes.include?(record.name))
        args = {
          :ar_column => record,
          :name => "#{prefix}#{record.name}",
          :value_type => record.type,
          :key => is_key,
          #:hidden => is_key,
          :searchable => searchable,
          :sortable => sortable,
          :editable => edit
        }
      end
  end
end
