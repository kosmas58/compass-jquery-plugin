module ActiveRecord
  class Base
      
      # takes params from request and returns records serialized to json. handles the majority of the functionality
      # for searching, sorting, and serializing records to be consumed by jqGrid.
      def self.find_for_grid(params)
        search_options = {:limit => params["rows"]}
        search_options[:offset] = (params["page"].to_i * params["rows"].to_i) - params["rows"].to_i
        search_options[:order] = "#{params['sidx']} #{params['sord']}" if params["sidx"] != ""
        if params["_search"] == "true"
          string_search_operations = {
            "eq" => "=",
            "ne" => "<>",
            "bw" => "LIKE",
            "bn" => "NOT LIKE",
            "ew" => "LIKE",
            "en" => "NOT LIKE",
            "cn" => "LIKE",
            "nc" => "NOT LIKE"
          }
          integer_search_operations = {
            "eq" => "=",
            "ne" => "<>",
            "lt" => "<",
            "le" => "<=",
            "gt" => ">",
            "ge" => ">="
          }
          if [:text, :string].include?(self.columns.select {|c| c.name == params["searchField"]}.first.type) && string_search_operations.keys.include?(params["searchOper"])
            search_options[:conditions] = "#{params["searchField"]} "
            search_options[:conditions] << "#{string_search_operations[params["searchOper"]]}"
            search_options[:conditions] << "'#{"%" if ["ew", "en", "cn", "nc"].include?(params["searchOper"])}#{params["searchString"]}#{"%" if ["nc", "cn", "bn", "bw"].include?(params["searchOper"])}'"
          elsif [:integer].include?(self.columns.select {|c| c.name == params["searchField"]}.first.type) && integer_search_operations.keys.include?(params["searchOper"])
            search_options[:conditions] = "#{params["searchField"]} #{integer_search_operations[params["searchOper"]]} #{params["searchString"]}"
          end
        end
        count  = self.count(:all, :conditions => search_options[:conditions]).to_f
        # raise count.inspect
        array = self.find(:all, search_options).collect {|r| r.attributes }
        {:total => (count / params["rows"].to_f).ceil, :page => params["page"], :records => count, :rows => array }.to_json
      end
    
  
  end
end