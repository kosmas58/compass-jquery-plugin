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
      options[:autowidth] = false if options[:autowidth].blank?
      options[:hidegrid] = true if options[:hidegrid].nil?
      options[:rows_per_page] = "10" if options[:rows_per_page].blank?
      options[:sort_column] = "id" if options[:sort_column].blank?
      options[:sort_order] = "asc" if options[:sort_order].blank?
      options[:height] = "150" if options[:height].blank?
      options[:error_handler] = 'null' if options[:error_handler].blank?
      options[:error_handler_return_value] = options[:error_handler]
      options[:error_handler_return_value] = "true;" if options[:error_handler_return_value] == 'null'
      options[:inline_edit_handler] = 'null' if options[:inline_edit_handler].blank?      

      options[:add] = (options[:add].blank?) ? "false" : options[:add].to_s    
      options[:delete] = (options[:delete].blank?) ? "false" : options[:delete].to_s
      options[:inline_edit] = (options[:inline_edit].blank?) ? "false" : options[:inline_edit].to_s
      edit_button = (options[:edit] == true && options[:inline_edit] == "false") ? "true" : "false" 

      # Generate columns data
      col_names, col_model = gen_columns(columns)

      # Enable multi-selection (checkboxes)
      multiselect = ""
      if options[:multi_selection]
        multiselect = %Q/multiselect: true,/
        multihandler = %Q/
          jQuery("##{id}_select_button").click( function() { 
            var s; s = jQuery("##{id}").getGridParam('selarrrow'); 
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
              if(jQuery("##{id}_details").getGridParam('records') >0 ) 
              { 
                jQuery("##{id}_details").setGridParam({url:"#{options[:details_url]}?q=1&id="+ids,page:1})
                .setCaption("#{options[:details_caption]}: "+ids)
                .trigger('reloadGrid'); 
              } 
            } 
            else 
            { 
              jQuery("##{id}_details").setGridParam({url:"#{options[:details_url]}?q=1&id="+ids,page:1})
              .setCaption("#{options[:details_caption]} : "+ids)
              .trigger('reloadGrid'); 
            } 
          },/
      end

      # Enable selection link, button
      # The javascript function created by the user (options[:selection_handler]) will be called with the selected row id as a parameter
      selection_link = ""
      if (options[:direct_selection].blank? || options[:direct_selection] == false) && options[:selection_handler].present? && (options[:multi_selection].blank? || options[:multi_selection] == false)
        selection_link = %Q/
        jQuery("##{id}_select_button").click( function(){ 
          var id = jQuery("##{id}").getGridParam('selrow'); 
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
      if options[:edit] && options[:inline_edit] == "true"
        editable = %Q/
        onSelectRow: function(id){ 
          if(id && id!==lastsel_#{id}){ 
            jQuery('##{id}').restoreRow(lastsel_#{id});
            jQuery('##{id}').editRow(id, true, #{options[:inline_edit_handler]}, #{options[:error_handler]});
            lastsel_#{id}=id; 
          } 
        },/
      end
      
      # Enable subgrids
      subgrid = ""
      subgrid_enabled = "subGrid:false,"
      if options[:subgrid]
        subgrid_enabled = "subGrid:true,"
        options[:subgrid][:rows_per_page] = "10" if options[:subgrid][:rows_per_page].blank?
        options[:subgrid][:sort_column] = "id" if options[:subgrid][:sort_column].blank?
        options[:subgrid][:sort_order] = "asc" if options[:subgrid][:sort_order].blank?
        subgrid_search = (options[:subgrid][:search].blank?) ? "false" : options[:subgrid][:search]
        options[:subgrid][:add] = (options[:subgrid][:add].blank?) ? "false" : options[:subgrid][:add].to_s    
        options[:subgrid][:delete] = (options[:subgrid][:delete].blank?) ? "false" : options[:subgrid][:delete].to_s
        options[:subgrid][:edit] = (options[:subgrid][:edit].blank?) ? "false" : options[:subgrid][:edit].to_s   
        
        subgrid_inline_edit = ""
        if options[:subgrid][:inline_edit] == true
          options[:subgrid][:edit] = "false"
          subgrid_inline_edit = %Q/
          onSelectRow: function(id){ 
            if(id && id!==lastsel_#{id}){ 
              jQuery('#'+subgrid_table_id).restoreRow(lastsel_#{id});
              jQuery('#'+subgrid_table_id).editRow(id,true); 
              lastsel_#{id}=id; 
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
            jQuery("#"+subgrid_id).html("<table id='"+subgrid_table_id+"' class='scroll'></table><div id='"+pager_id+"' class='scroll'></div>");
            jQuery("#"+subgrid_table_id).jqGrid({
              url:"#{options[:subgrid][:url]}?q=2&id="+row_id,
              editurl:'#{options[:subgrid][:edit_url]}?parent_id='+row_id,
              datatype: "json",
              colNames: #{sub_col_names},
              colModel: #{sub_col_model},
                rowNum:#{options[:subgrid][:rows_per_page]},
                pager: pager_id,
                sortname: '#{options[:subgrid][:sort_column]}',
                sortorder: '#{options[:subgrid][:sort_order]}',
                viewrecords: true,
                toolbar : [true,"top"], 
                #{subgrid_inline_edit}
                #{subgrid_direct_link}
                height: '100%'
            });
            jQuery("#"+subgrid_table_id).jqGrid('navGrid',"#"+pager_id,{edit:#{options[:subgrid][:edit]},add:#{options[:subgrid][:add]},del:#{options[:subgrid][:delete]},search:false});
            jQuery("#"+subgrid_table_id).jqGrid('navButtonAdd',"#"+pager_id,{caption:"Search",title:"Toggle Search",buttonimg:'/images/jquery/search.png',
              onClickButton:function(){ 
                if(jQuery("#t_"+subgrid_table_id).css("display")=="none") {
                  jQuery("#t_"+subgrid_table_id).css("display","");
                } else {
                  jQuery("#t_"+subgrid_table_id).css("display","none");
                }
              } 
            });
            jQuery("#t_"+subgrid_table_id).height(25).hide().jqGrid('filterGrid',""+subgrid_table_id,{gridModel:true,gridToolbar:true});
          },
          subGridRowColapsed: function(subgrid_id, row_id) {
          },
        )
      end
     

      # Generate required Javascript & html to create the jqgrid
      %Q(
        <script type="text/javascript">
        var lastsel_#{id};
        jQuery(document).ready(function(){
          jQuery("##{id}").jqGrid({
            // adding ?nd='+new Date().getTime() prevent IE caching
            url:'#{action}?nd='+new Date().getTime(),
            editurl:'#{options[:edit_url]}',
            datatype: "json",
            colNames:#{col_names},
            colModel:#{col_model},
            pager: jQuery('##{id}_pager'),
            rowNum:#{options[:rows_per_page]},
            rowList:[10,25,50,100],
            sortname: '#{options[:sort_column]}',
            viewrecords: true,
            height: #{options[:height]}, 
            toolbar : [true,"top"],
            autowidth: #{options[:autowidth]},
            sortorder: "#{options[:sort_order]}",
            #{multiselect}
            #{masterdetails}
            #{grid_loaded}
            #{direct_link}
            #{editable}
            #{subgrid_enabled}
            #{subgrid}
            caption: "#{title}", 
            hidegrid: #{options[:hidegrid]}
        });
        jQuery("#t_#{id}").height(25).hide().jqGrid('filterGrid',"#{id}",{gridModel:true,gridToolbar:true});
        #{multihandler}
        #{selection_link}
        jQuery("##{id}").jqGrid('navGrid','##{id}_pager',{edit:#{edit_button},add:#{options[:add]},del:#{options[:delete]},search:false,refresh:true},
        {afterSubmit:function(r,data){return #{options[:error_handler_return_value]}(r,data,'edit');} #{edit_options}},
        {afterSubmit:function(r,data){return #{options[:error_handler_return_value]}(r,data,'add');} #{add_options}},
        {afterSubmit:function(r,data){return #{options[:error_handler_return_value]}(r,data,'delete');} #{del_options}},
        {#{search_options}}
        );
     
        jQuery("##{id}").jqGrid('navButtonAdd',"##{id}_pager",{
          caption:"#{I18n.t('jquery.jqgrid.search')}",
          title:"#{I18n.t('jquery.jqgrid.toogle_search')}",
          buttonicon:"ui-icon-search",
          onClickButton:function(){ 
            if(jQuery("#t_#{id}").css("display")=="none") {
              jQuery("#t_#{id}").css("display","");
            } else {
              jQuery("#t_#{id}").css("display","none");
            }
          } 
        });
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
          options << "editoptions:#{get_edit_options(couple[1])},"
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
    def get_edit_options(editoptions)
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
          couple[1].first.each do |v|
            options << "#{v[couple[1].second]}:#{v[couple[1].third]};"
          end
          options.chop! << %Q/",/
        else # :size => 30, :rows => 5, :maxlength => 20, ...
          options << %Q/#{couple[0]}:"#{couple[1]}",/
        end
      end
      options.chop! << "}"
    end 
  end
end

module JqgridJson
  def to_jqgrid_json(attributes, current_page, per_page, total)
    json = %Q({"page":"#{current_page}","total":#{total/per_page.to_i+1},"records":"#{total}","rows":[)
    each do |elem|
      json << %Q({"id":"#{elem.id}","cell":[)
      couples = elem.attributes.symbolize_keys
      attributes.each do |atr|
        value = couples[atr]
        value = elem.try(atr) if elem.respond_to?(:try) && value.blank?
        json << %Q("#{value}",)
      end
      json.chop! << "]},"
    end
    json.chomp!(',') << "]}"
  end
end

class Array
  include JqgridJson
end