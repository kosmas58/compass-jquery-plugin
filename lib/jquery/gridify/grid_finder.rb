module Gridify
  class Grid

    attr_accessor :search_rules,        # current search/filter rules, as hash
                  :search_rules_op      # :and, :or

    # finds records based on request params
    # e.g. params from jqGrid
    #   :_search      do search (true/false)  ["false"]
    #   :sidx         sort index (column to search on)  [""]
    #   :sord         sort direction (desc/asc)  ["asc"]
    #   :nd           ?
    #   :rows         number of items to get   ["20"]
    #   :page         page number (starts at 1) ["1"]

    def update_from_params( params )
      params.symbolize_keys!
      params_to_rules params
      self.data_type     = params[:datatype] if params[:datatype]
      self.sort_by       = params[:sidx] if params[:sidx]
      self.sort_order    = params[:sord] if params[:sord]
      self.current_page  = params[:page].to_i if params[:page]
      self.rows_per_page = params[:rows].to_i if params[:rows]
      self.total_rows    = params[:total_rows].to_i if params[:total_rows]
      if tree_grid
        self.nodeid  = params[:nodeid].to_i if params[:nodeid]
        self.n_level = params[:n_level].to_i if params[:n_level]
        self.n_left  = params[:n_left].to_i if params[:n_left]
        self.n_right = params[:n_right].to_i if params[:n_right]
      end
    end

    # return find args (scope) for current settings
    def current_scope
      #debugger
      find_args = {}
      find_args[:include] = colInclude if colInclude
      if sort_by.present? && col = columns_hash[sort_by]
        if (sort_by.include? ".")
          # Workaround for :include and nested attributes
          field = sort_by.split('.', 2)
          if field.length == 2
            self.sort_by = field[0].pluralize + "." + field[1]
          end
        end
        if case_sensitive || !([:string, :text].include?(col.value_type))
          find_args[:order] = "#{sort_by} #{sort_order}"
        else
          find_args[:order] = "upper(#{sort_by}) #{sort_order}"
        end
      end
      
      if total_rows.present? && total_rows > 0
        find_args[:limit] = total_rows
        offset = (current_page.to_i-1) * rows_per_page if current_page.present?
        find_args[:offset] = offset if offset && offset > 0
      elsif rows_per_page.present? && rows_per_page > 0
        find_args[:limit] = rows_per_page
        offset = (current_page.to_i-1) * rows_per_page if current_page.present?
        find_args[:offset] = offset if offset && offset > 0
      end
      
      cond = rules_to_conditions
      find_args[:conditions] = cond unless cond.blank?
      find_args
    end
    
    def find( params )
      #debugger
      update_from_params params
      klass = resource.classify.constantize
      records = klass.send( finder, :all, current_scope )
    end

    def encode_records( records, userdata=nil, total_count=nil )
      #debugger
      klass = resource.classify.constantize
      total_count ||= klass.count
      total_pages = total_count / rows_per_page + 1
      #TODO: :only => [attributes], :methods => [virtual attributes]
      case data_type
      when :xml
        if colInclude
          xml = records.to_xml( :include => colInclude, :skip_types => true, :dasherize => false ) do |xml|
            if rows_per_page > 0
              xml.page     current_page
              xml.total    total_pages
              xml.records  total_count
            end
          end
        else
          xml = records.to_xml( :skip_types => true, :dasherize => false ) do |xml|
            if rows_per_page > 0
              xml.page    current_page
              xml.total   total_pages
              xml.records total_count
            end
          end
        end
      when :json
        #debugger
        data = { resource => records }
        if rows_per_page > 0
          data.merge!(
            :page    => current_page,
            :total   => total_pages,
            :records => total_count
          )
        end
        data.merge!( :userdata => userdata ) if userdata
        save = ActiveRecord::Base.include_root_in_json
        ActiveRecord::Base.include_root_in_json = false
        if colInclude
          json = data.to_json(:include => colInclude)
        else
          json = data.to_json
        end
        ActiveRecord::Base.include_root_in_json = save
        json
      #others...
      else #nop ?
        records.to_s
      end
    end

    def find_and_encode( params )
      encode_records( find( params ) )
    end

    # grid doesnt nest attributes inside the resource
    # could change this behavior in jqGrid, see grid.postext.js ?
    #   http://www.trirand.com/jqgridwiki/doku.php?id=wiki:post_data_module
    #
    def member_params( params )
      params.inject({}) {|h, (name, value)| h[name] = value if columns_hash[name]; h }
    end

    protected

    OPS = { 'eq' => '=', 'lt' => '<', 'le' => '<=', 'gt' => '>', 'ge' => '>=', 'ne' => '!=' }
    #['eq','ne','lt','le','gt','ge',
    # 'bw','bn','in','ni','ew','en','cn','nc']
    #['equal','not equal', 'less', 'less or equal','greater','greater or equal',
    # 'begins with','does not begin with','is in','is not in','ends with','does not end with','contains','does not contain']

    OPS_PATTERN = {
      'bw' => '?%',
      'bn' => '?%',
      # 'in'
      # 'ni'
      'ew' => '%?',
      'en' => '%?',
      'cn' => '%?%',
      'nc' => '%?%',
    }

    STRING_OPS = {
      'bw' => 'LIKE',
      'bn' => 'NOT LIKE',
      'ew' => 'LIKE',
      'en' => 'NOT LIKE',
      'cn' => 'LIKE',
      'nc' => 'NOT LIKE',
    }

    # params[:filters] => {"groupOp"=>"AND",
    #              "rules"=>[{"data"=>"b", "op"=>"ge", "field"=>"title"}, {"data"=>"f", "op"=>"le", "field"=>"title"}] }
    def params_to_rules( params )
      #debugger
      if params[:_search]=='true' || params[:_search]==true
        if params[:filters]
          # advanced search
          filters = ActiveSupport::JSON.decode( params[:filters] )
          self.search_rules = filters['rules']
          self.search_rules_op = filters['groupOp']
        elsif params[:searchField]
          # simple search
          self.search_rules = [{ "field" => params[:searchField], "op" => params[:searchOper], "data" => params[:searchString]}]
        else
          # toolbar search
          self.search_rules = []
          self.search_rules_op = :and
          colModel.each do |col|
            name = col.name
            data = params[name.to_sym]
            self.search_rules << { "field" => name, "op" => "cn", "data" => data } if data
          end
        end
      end
      search_rules
    end

    def rules_to_conditions
      # note: ignoring case_sensitive as an option, ActiveRecord find is insensitive by default (have to model the db to let it be case sensitive?)
      return nil if search_rules.blank?
      cond = nil
      expr = ''
      vals = []
      search_rules.each do |rule|

        # Workaround for :include and nested attributes
        field = rule['field'].split('.', 2)
        if field.length == 2
          rule['field'] = field[0].pluralize + "." + field[1]
        end

        expr << " #{search_rules_op} " unless expr.blank?
        if op = OPS[rule['op']]
          expr << "#{rule['field']} #{op} ?"
          vals << rule['data']
        elsif op = STRING_OPS[rule['op']]
          expr << "#{rule['field']} #{op} ?"
          vals << OPS_PATTERN[rule['op']].gsub('?', rule['data'])
        end
      end
      cond = [ expr ] + vals
    end
  end
end

# # If you need to display error messages
# err = ""
# if user
#   user.errors.entries.each do |error|
#     err << "<strong>#{error[0]}</strong> : #{error[1]}<br/>"
#   end
# end
#
# render :text => "#{err}"

# { :add => true, :edit => true, :inline_edit => false, :delete => true, :edit_url => "/users/post_data", :error_handler => "after_submit" }
