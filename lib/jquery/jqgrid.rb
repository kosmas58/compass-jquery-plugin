module ActionView
  module Helpers
    
    def jqgrid_javascripts(locale)
      js = capture { javascript_include_tag "i18n/jqgrid/locale-#{locale}.min" } 
      js << capture {javascript_tag "jQuery.jgrid.no_legacy_api = true;" }
      js << capture { javascript_include_tag 'jquery.jqGrid.min' }  
    end

    def jqgrid_from_xml(name, opts={})
      @@grid_name = name.to_s
      grid_data = YAML::load_file("#{RAILS_ROOT}/config/jquery/jqGrid/#{name}.yml")
    
      before = grid_data[:before]
      params = grid_data[:params]
      
      def param_body(value)
        value.scan(/^\((.+?)\)(.+)/).flatten
      end
      
      jquery_grid_code = <<-CODE
          <script type="text/javascript">
            <%= before %>_n_
            jQuery(document).ready(function(){ 
              jQuery("#<%= name %>").jqGrid({               
              <% params.each do |key,value| %>
                <% if opts.keys.include?(key) %>
                  _ss_<%= key %>: <%= opts[key].to_json %>,
                <% elsif (value.is_a? String) && (value[0..0] == "$") %>
                  _ss_<%= key %>: <%= "jQuery"+value[1,value.length] %>,
                <% elsif (key.to_s[0..8] == 'function_') %>
                  <% js_params, body = param_body(value) %>
                  _ss_<%= key.to_s[9..-1] %>: function(<%= js_params %>) {
                    _ss__ss_<%= body %> 
                  _ss_},
                <% else %>
                  _ss_<%= key %>: <%= value.to_json %>,
                <% end %>
              <% end %>                            
              <% opts.each do |key,value| %>
                <% unless params.keys.include?(key) %>
                  _ss_<%= key %>: <%= value.to_json %>,
                <% end %>
              <% end %> });
            });
          </script>
      CODE
      ::ERB.new(jquery_grid_code, nil, '>').result(binding).gsub("_n_", "\n").
      gsub(/[ \t]{2,}/,' ').
      gsub(/,\s+\}\);/, "\n  });").
      gsub(/\n\s*\n/m, "\n").
      gsub("_ss_", "  ").
      gsub("<grid_name>", @@grid_name)
    end


    def jqgrid(title, id, action, columns = {}, 
               options = {}, edit_options = "", add_options = "", del_options = "", search_options = "",
               custom1_button = nil, custom2_button = nil, custom3_button = nil, custom4_button = nil, custom5_button = nil )
               
      # Default options
      options = 
      { 
        :rows_per_page       => '10',
        :sort_column         => '',
        :sort_order          => '',
        :height              => '150',
        :gridview            => 'false',
        :error_handler       => 'null',
        :inline_edit_handler => 'null',
        :add                 => 'false',
        :delete              => 'false',
        :search              => 'true',
        :edit                => 'false',          
        :inline_edit         => 'false',
        :autowidth           => 'false',
        :hidegrid            => 'true',
        :rownumbers          => 'false'                    
      }.merge(options)
      
      # Stringify options values
      options.inject({}) do |options, (key, value)|
        options[key] = (key != :subgrid) ? value.to_s : value
        options
      end
      
      options[:error_handler_return_value] = (options[:error_handler] == 'null') ? 'true;' : options[:error_handler]
      edit_button = (options[:edit] == 'true' && options[:inline_edit] == 'false').to_s

      # Generate columns data
      col_names, col_model = gen_columns(columns)

      # Enable filtering (by default)
      search = ""
      filter_toolbar = ""
      if options[:search] == 'true'
        search = %Q/jQuery("##{id}").jqGrid('navButtonAdd', "##{id}_pager",{caption:"",title:"Toggle Search Toolbar", buttonicon :'ui-icon-search', onClickButton:function(){ mygrid[0].toggleToolbar() } })/
        filter_toolbar = "mygrid.filterToolbar();"
        filter_toolbar << "mygrid[0].toggleToolbar()"
      end

      # Enable multi-selection (checkboxes)
      multiselect = "multiselect: false,"
      if options[:multi_selection]
        multiselect = "multiselect: true,"
        multihandler = %Q/
          jQuery("##{id}_select_button").click( function() { 
            var s; s = jQuery("##{id}").jqGrid('getGridParam', 'selarrrow'); 
            #{options[:selection_handler]}(s); 
            return false;
          });/
      end

      # Enable master-details
      masterdetails = ""
      if options[:master_details]
        masterdetails = %Q/
          onSelectRow: function(ids) { 
            if(ids == null) { 
              ids=0; 
              if(jQuery("##{id}_details").jqGrid('getGridParam', 'records') >0 ) 
              { 
                jQuery("##{id}_details").jqGrid('setGridParam', {url:"#{options[:details_url]}?q=1&id="+ids,page:1})
                jQuery("##{id}_details").jqGrid('setCaption', "#{options[:details_caption]}: "+ids)
                jQuery("##{id}_details").trigger('reloadGrid'); 
              } 
            } 
            else 
            { 
              jQuery("##{id}_details").jqGrid('setGridParam', {url:"#{options[:details_url]}?q=1&id="+ids,page:1})
              jQuery("##{id}_details").jqGrid('setCaption', "#{options[:details_caption]} : "+ids)
              jQuery("##{id}_details").trigger('reloadGrid'); 
            } 
          },/
      end

      # Enable selection link, button
      # The javascript function created by the user (options[:selection_handler]) will be called with the selected row id as a parameter
      selection_link = ""
      if options[:direct_selection].blank? && options[:selection_handler].present? && options[:multi_selection].blank?
        selection_link = %Q/
        jQuery("##{id}_select_button").click( function(){ 
          var id = jQuery("##{id}").jqGrid('getGridParam', 'selrow'); 
          if (id) { 
            #{options[:selection_handler]}(id); 
          } else { 
            alert("Please select a row");
          }
          return false; 
        });/
      end

      # Enable direct selection (when a row in the table is clicked)
      # The javascript function created by the user (options[:selection_handler]) will be called with the selected row id as a parameter
      direct_link = ""
      if options[:direct_selection] && options[:selection_handler].present? && options[:multi_selection].blank?
        direct_link = %Q/
        onSelectRow: function(id){ 
          if(id){ 
            #{options[:selection_handler]}(id); 
          } 
        },/
      end

      # Enable grid_loaded callback
      # When data are loaded into the grid, call the Javascript function options[:grid_loaded] (defined by the user)
      grid_loaded = ""
      if options[:grid_loaded].present?
        grid_loaded = %Q/
        loadComplete: function(){ 
          #{options[:grid_loaded]}();
        },
        /
      end

      # Enable inline editing
      # When a row is selected, all fields are transformed to input types
      editable = ""
      if options[:edit] && options[:inline_edit] == 'true'
        editable = %Q/
        onSelectRow: function(id){ 
          if(id && id!==lastsel){ 
            jQuery('##{id}').jqGrid('restoreRow', lastsel);
            jQuery('##{id}').jqGrid('editRow', id, true, #{options[:inline_edit_handler]}, #{options[:error_handler]});
            lastsel=id; 
          } 
        },/
      end
      
      # Enable subgrids
      subgrid = ""
      subgrid_enabled = "subGrid:false,"

      if options[:subgrid].present?
        
        subgrid_enabled = "subGrid:true,"
        
        options[:subgrid] = 
          {
            :rows_per_page => '10',
            :sort_column   => 'id',
            :sort_order    => 'asc',
            :add           => 'false',
            :edit          => 'false',
            :delete        => 'false',
            :search        => 'false'
          }.merge(options[:subgrid])

        # Stringify options values
        options[:subgrid].inject({}) do |suboptions, (key, value)|
          suboptions[key] = value.to_s
          suboptions
        end
        
        subgrid_inline_edit = ""
        if options[:subgrid][:inline_edit] == true
          options[:subgrid][:edit] = 'false'
          subgrid_inline_edit = %Q/
          onSelectRow: function(id){ 
            if(id && id!==lastsel){ 
              jQuery('#'+subgrid_table_id).jqGrid('restoreRow', lastsel);
              jQuery('#'+subgrid_table_id).jqGrid('editRow', id,true); 
              lastsel=id; 
            } 
          },
          /
        end
          
        if options[:subgrid][:direct_selection] && options[:subgrid][:selection_handler].present?
          subgrid_direct_link = %Q/
          onSelectRow: function(id){ 
            if(id){ 
              #{options[:subgrid][:selection_handler]}(id); 
            } 
          },
          /
        end     
        
        sub_col_names, sub_col_model = gen_columns(options[:subgrid][:columns])
        
        subgrid = %Q(
        subGridRowExpanded: function(subgrid_id, row_id) {
            var subgrid_table_id, pager_id;
            subgrid_table_id = subgrid_id+"_t";
            pager_id = "p_"+subgrid_table_id;
            $("#"+subgrid_id).html("<table id='"+subgrid_table_id+"' class='scroll'></table><div id='"+pager_id+"' class='scroll'></div>");
            jQuery("#"+subgrid_table_id).jqGrid({
              url:"#{options[:subgrid][:url]}?q=2&id="+row_id,
              editurl:'#{options[:subgrid][:edit_url]}?parent_id='+row_id,                            
              datatype: "json",
              colNames: #{sub_col_names},
              colModel: #{sub_col_model},
              rowNum:#{options[:subgrid][:rows_per_page]},
              pager: pager_id,
              imgpath: '/images/jqgrid',
              sortname: '#{options[:subgrid][:sort_column]}',
              sortorder: '#{options[:subgrid][:sort_order]}',
              viewrecords: true,
              toolbar : [true,"top"], 
              #{subgrid_inline_edit}
              #{subgrid_direct_link}
              height: '100%'
            });
            jQuery("#"+subgrid_table_id).jqGrid('navGrid', "#"+pager_id,{edit:#{options[:subgrid][:edit]},add:#{options[:subgrid][:add]},del:#{options[:subgrid][:delete]},search:false})
            jQuery("#"+subgrid_table_id).jqGrid('navButtonAdd', "#"+pager_id,{caption:"Search",title:"Toggle Search",buttonimg:'/images/jqgrid/search.png',
              onClickButton:function(){ 
                if(jQuery("#t_"+subgrid_table_id).css("display")=="none") {
                  jQuery("#t_"+subgrid_table_id).css("display","");
                } else {
                  jQuery("#t_"+subgrid_table_id).css("display","none");
                }
              } 
            });
            jQuery("#t_"+subgrid_table_id).height(25).hide().jqGrid('filterGrid', ""+subgrid_table_id,{gridModel:true,gridToolbar:true});
          },
          subGridRowColapsed: function(subgrid_id, row_id) {
          },
        )
      end

      # Generate required Javascript & html to create the jqgrid
      %Q(
        <script type="text/javascript">
          var lastsel;
          jQuery(document).ready(function(){
            var mygrid = jQuery("##{id}").jqGrid({
              url:'#{action}?q=1',
              editurl:'#{options[:edit_url]}',
              datatype: "json",
              colNames:#{col_names},
              colModel:#{col_model},
              pager: '##{id}_pager',
              rowNum:#{options[:rows_per_page]},
              rowList:[10,25,50,100],
              imgpath: '/images/jqgrid',
              sortname: '#{options[:sort_column]}',
              viewrecords: true,
              height: #{options[:height]},
              sortorder: '#{options[:sort_order]}',
              gridview: #{options[:gridview]},
              hidegrid: #{options[:hidegrid]},
              scrollrows: true,
              autowidth: #{options[:autowidth]},
              rownumbers: #{options[:rownumbers]},
              #{multiselect}
              #{masterdetails}
              #{grid_loaded}
              #{direct_link}
              #{editable}
              #{subgrid_enabled}
              #{subgrid}
              caption: "#{title}"
            });
            jQuery("##{id}").jqGrid('navGrid', '##{id}_pager',
              {edit:#{edit_button},add:#{options[:add]},del:#{options[:delete]},search:false,refresh:true},
              {afterSubmit:function(r,data){return #{options[:error_handler_return_value]}(r,data,'edit');}},
              {afterSubmit:function(r,data){return #{options[:error_handler_return_value]}(r,data,'add');}},
              {afterSubmit:function(r,data){return #{options[:error_handler_return_value]}(r,data,'delete');}}
            );
          });
        </script>
      )
    end     

    private
    
    def gen_columns(columns)
      # Generate columns data
      col_names = "[" # Labels
      col_model = "[" # Options
      columns.each do |c|
        col_names << "'#{c[:label]}',"
        col_model << "{name:'#{c[:field]}', index:'#{c[:field]}'#{get_attributes(c)}},"
      end
      col_names.chop! << "]"
      col_model.chop! << "]"
      [col_names, col_model]
    end    
    
    # Generate a list of attributes for related column (align:'right', sortable:true, resizable:false, ...)
    def get_attributes(column)
      options = ","
      column.except(:field, :label).each do |couple|
        if couple[0] == :editoptions
          options << "editoptions:#{get_sub_options(couple[1])},"
        elsif couple[0] == :formoptions
          options << "formoptions:#{get_sub_options(couple[1])},"
        elsif couple[0] == :searchoptions
          options << "searchoptions:#{get_sub_options(couple[1])},"
        elsif couple[0] == :editrules
          options << "editrules:#{get_sub_options(couple[1])},"
        else
          if couple[1].class == String
            options << "#{couple[0]}:'#{couple[1]}',"
          else
            options << "#{couple[0]}:#{couple[1]},"
          end
        end
      end
      options.chop!
    end

    # Generate options for editable fields (value, data, width, maxvalue, cols, rows, ...)
    def get_sub_options(editoptions)
      options = "{"
      editoptions.each do |couple|
        if couple[0] == :value # :value => [[1, "Rails"], [2, "Ruby"], [3, "jQuery"]]
          options << %Q/value:"/
          couple[1].each do |v|
            options << "#{v[0]}:#{v[1]};"
          end
          options.chop! << %Q/",/
        elsif couple[0] == :data # :data => [Category.all, :id, :title])
          options << %Q/value:"/
          couple[1].first.each do |obj|
            options << "%s:%s;" % [obj.send(couple[1].second), obj.send(couple[1].third)]
          end
          options.chop! << %Q/",/
        else # :size => 30, :rows => 5, :maxlength => 20, ...
          if couple[1].instance_of?(Fixnum) || couple[1] == 'true' || couple[1] == 'false' || couple[1] == true || couple[1] == false
            options << %Q/#{couple[0]}:#{couple[1]},/
          else
            options << %Q/#{couple[0]}:"#{couple[1]}",/            
          end
        end
      end
      options.chop! << "}"
    end   
  end
end

module JqgridJson
  include ActionView::Helpers::JavaScriptHelper

  def to_jqgrid_json(attributes, current_page, per_page, total)
    json = %Q({"page":"#{current_page}","total":#{total/per_page.to_i+1},"records":"#{total}")
    if total > 0
      json << %Q(,"rows":[)
      each do |elem|
        elem.id ||= index(elem)
        json << %Q({"id":"#{elem.id}","cell":[)
        couples = elem.attributes.symbolize_keys
        attributes.each do |atr|
          value = get_atr_value(elem, atr, couples)
          value = escape_javascript(value) if value and value.is_a? String
          json << %Q("#{value}",)
        end
        json.chop! << "]},"
      end
      json.chop! << "]}"
    else
      json << "}"
    end
  end
  
  private
  
  def get_atr_value(elem, atr, couples)
    if atr.to_s.include?('.')
      value = get_nested_atr_value(elem, atr.to_s.split('.').reverse) 
    else
      value = couples[atr]
      value = elem.send(atr.to_sym) if value.blank? && elem.respond_to?(atr) # Required for virtual attributes
    end
    value
  end
  
  def get_nested_atr_value(elem, hierarchy)
    return nil if hierarchy.size == 0
    atr = hierarchy.pop
    raise ArgumentError, "#{atr} doesn't exist on #{elem.inspect}" unless elem.respond_to?(atr)
    nested_elem = elem.send(atr)
    return "" if nested_elem.nil?
    value = get_nested_atr_value(nested_elem, hierarchy)
    value.nil? ? nested_elem : value
  end
end

class Array
  include JqgridJson
end