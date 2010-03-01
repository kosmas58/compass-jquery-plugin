# reference: http://github.com/ahe/2dc_jqgrid

module Gridify
  class Grid
    
    # ----------------------
    # generate the grid javascript for a view
    # options:
    #     :script => true generates <script> tag (true)
    #     :ready  => true generates jquery ready function (true)
    def to_javascript( options={} )
      options = { :script => true, :ready => true }.merge(options)
      
      s = ''
      if options[:script]
        s << %Q^<script type="text/javascript">^       
      end

      s << js_helpers

      if options[:ready]
        s << %Q^jQuery(document).ready(function(){^    
      end
      
      s << jqgrid_javascript(options)
                  
      if options[:ready]
        s << %Q^});^ 
      end
      if options[:script]
        s << %Q^</script>^
      end
      s     
    end
    
    
    def to_json
      jqgrid_properties.to_json_with_js
    end
  
    # alias :to_s, :to_javascript
    def to_s( options={} )
      to_javascript( options )
    end
            
    # ------------------
    protected
    # ------------------
  
    # //{ url: '/notes/{id}', mtype: 'PUT', reloadAfterSubmit: false, closeAfterEdit: true },  // edit settings
    # //{ url: '/notes', mtype: 'POST', reloadAfterSubmit: false, closeAfterEdit: true },  // add settings
    # //{ url: '/notes/{id}', mtype: 'DELETE', reloadAfterSubmit: false },  // delete settings
  
    # get the button options
    def edit_button_options
      # 'url' => '/notes/{id}', 'mtype' => 'PUT'
      #         {afterSubmit:function(r,data){return #{options[:error_handler_return_value]}(r,data,'edit');}},
      
      # note, closeAfterEdit will not close if response returns a non-empty string (even if "success" message)
      merge_options_defaults( edit_button, 
        'reloadAfterSubmit' => false, 
        'closeAfterEdit' => true,
        'afterSubmit' => "javascript: function(r,data){return #{error_handler_return_value}(r,data,'edit');}"
      )
    end
    
    def add_button_options
      # 'url' => '/notes', 'mtype' => 'POST'
      merge_options_defaults( add_button, 
        'reloadAfterSubmit' => false, 
        'closeAfterEdit' => true,
        'afterSubmit' => "javascript: function(r,data){return #{error_handler_return_value}(r,data,'add');}"
      )
    end
    
    def delete_button_options
      # 'url' => '/notes/{id}', 'mtype' => 'DELETE'
      merge_options_defaults( delete_button, 
        'reloadAfterSubmit' => false,
        'afterSubmit' => "javascript: function(r,data){return #{error_handler_return_value}(r,data,'delete');}"
      )
    end
    
    def search_button_options
      if search_advanced
        merge_options_defaults( search_advanced, 'multipleSearch' => true)
      else
        merge_options_defaults( search_button)
      end
    end
    
    def view_button_options
      merge_options_defaults( view_button)
    end
    
    
    # generate the jqGrid initial values in json
    #   maps our attributes to jqGrid options; omit values when same as jqGrid defaults
    def jqgrid_properties
      vals                     = {}
     
      # data and request options
      vals['url']               = url if url
      vals['restful']           = true if restful
      vals['postData']          = { :grid => name } #identify which grid making the request
      # vals['colNames']          = column_names if columns.present?
      vals['colModel']          = column_model if columns.present?
      vals['datatype']          = data_type if data_type
      if data_format.present?
        if data_type == :xml
          vals['xmlReader']     = data_format
        elsif data_type == :json
          vals['jsonReader']    = data_format
        end
      end
        
      vals['loadonce']          = load_once if load_once

      vals['sortname']          = sort_by if sort_by
      vals['sortorder']         = sort_order if sort_order && sort_by
      vals['rowNum']            = rows_per_page if rows_per_page
      vals['page']              = current_page if current_page

       # grid options
       vals['height']           = height if height
       vals['gridview']         = true      # faster views, NOTE theres cases when this needs to be disabled
      
      case width_fit
        when :fitted
          #vals[:autowidth]    = false #default
          #vals[:shrinkToFit]  = true #default
          vals['forceFit']      = true
          vals['width']         = width if width
        
        when :scroll
          #vals[:autowidth]    = false #default
          vals['shrinkToFit']   = false
          #vals['forceFit']     = #ignored by jqGrid
          vals['width']         = width if width
        
        else #when :fluid
          vals['autowidth']     = true
          #vals['shrinkToFit']  = true #default
          vals['forceFit']      = true
          #vals['width']        = is ignored
          vals['resizeStop']    = 'javascript: gridify_fluid_recalc_width'
      end
      
      vals['sortable']          = true if arranger_type.include?(:sortable)
      
      # header layer
      vals['caption']           = title if title
      vals['hidegrid']          = false unless collapsible
      vals['hiddengrid']        = true if collapsed
      
      # row formatting
      vals['altrows']           = true if alt_rows
      vals['altclass']          = alt_rows if alt_rows.is_a?(String)
      
      vals['rowNumbers']        = true if row_numbers
      vals['rownumWidth']       = row_numbers if row_numbers.is_a?(Numeric)
      
      if select_rows.present?
        vals['scrollrows']      = true
        #handler...
      else
        vals['hoverrows']       = false
        vals['beforeSelectRow'] = "javascript: function(){ false; }"
      end
      
      # pager layer
      if pager
        vals['pager']           = "##{pager}" 
        vals['viewrecords']     = true     # display total records in the query (eg "1 - 10 of 25")
        vals['rowList']         = paging_choices
        if paging_controls.is_a?(Hash)
          # allow override of jqGrid pager options
          vals.merge!(paging_controls)
        elsif !paging_controls
          vals['rowList']       = []
          vals['pgbuttons']     = false
          vals['pginput']       = false
          vals['recordtext']    = "{2} records"
        end
      end
      
      # allow override of native jqGrid options
      vals.merge(jqgrid_options)
    end
    
    # -----------------
    def jqgrid_javascript( options={} )
      s = ''

      if table_to_grid
        s << %Q^ tableToGrid("##{dom_id}", #{to_json});^
        s << %Q^ grid = jQuery("##{dom_id}") ^ 
      else
        s << %Q^ grid = jQuery("##{dom_id}").jqGrid(#{to_json})^
      end

      # tag the grid as fluid so we can find it on resize events  
      if width_fit == :fluid 
        s << %Q^ .addClass("fluid")^                    
      end

      # override tableToGrid colmodel options as needed (sortable)
      #s << %Q^ .jqGrid('setColProp','Title',{sortable: false})^

      # resize method
      if resizable
        s << %Q^ .jqGrid('gridResize', #{resizable.to_json})^  
      end

      # pager buttons (navGrid)
      if pager
        nav_params = { 
          'edit' => edit_button.present?,
          'add' => add_button.present?,
          'del' => delete_button.present?,
          'search' => search_button.present? || search_advanced.present?,
          'view' => view_button.present?,
          'refresh' => refresh_button.present?
        }.merge(jqgrid_nav_options||{})
        
        s << %Q^ .navGrid('##{pager}',
                      #{nav_params.to_json},
                      #{edit_button_options.to_json_with_js},
                      #{add_button_options.to_json_with_js},
                      #{delete_button_options.to_json_with_js},
                      #{search_button_options.to_json_with_js},
                      #{view_button_options.to_json_with_js}
                    )^
      end
      
      if arranger_type.include?(:hide_show)
        s << %Q^ .jqGrid('navButtonAdd','##{pager}',{ 
                      caption: "Columns", 
                      title: "Hide/Show Columns", 
                      onClickButton : function (){ jQuery("##{dom_id}").jqGrid('setColumns',
                        #{arranger_options(:hide_show).to_json_with_js} );
                        }
                      })^
      end
      if arranger_type.include?(:chooser)
        # hackey way to build the string but gets it done
        chooser_code = %Q^ function (){ jQuery('##{dom_id}').jqGrid('columnChooser', {
                          done : function (perm) {
                            if (perm)  {
                              this.jqGrid('remapColumns', perm, true);
                              var gwdth = this.jqGrid('getGridParam','width');
                              this.jqGrid('setGridWidth',gwdth);
                            }
                          } })}^
        chooser_opts = {
          'caption' => 'Columns',
          'title' => 'Arrange Columns',
          'onClickButton' => 'chooser_code'
        }.merge(arranger_options(:chooser))
        s << %Q^ .jqGrid('navButtonAdd','##{pager}', #{chooser_opts.to_json.gsub('"chooser_code"', chooser_code)} )^
      end
      
      if search_toolbar
        # I wish we could put this in the header rather than the pager
        s << %Q^ .jqGrid('navButtonAdd',"##{pager}", { caption:"Toggle", title:"Toggle Search Toolbar", buttonicon: 'ui-icon-pin-s', onClickButton: function(){ grid[0].toggleToolbar() } })  
                 .jqGrid('navButtonAdd',"##{pager}", { caption:"Clear", title:"Clear Search", buttonicon: 'ui-icon-refresh', onClickButton: function(){ grid[0].clearToolbar() } }) 
                 .jqGrid('filterToolbar')^
      end
      
      # TODO: built in event handlers, eg
      # loadError 
      # onSelectRow, onDblClickRow, onRightClickRow etc
      
      s << '; '
      
      unless search_toolbar == :visible
        s << %Q^ grid[0].toggleToolbar(); ^
      end

      # # keep page controls centered (jqgrid bug) [eg appears when :width_fit => :scroll]
      # s << %Q^ $("##{pager}_left").css("width", "auto"); ^
        
      s     
    end

    # ------------------
    def js_helpers
      # just move this into appliaction.js?

      # gridify_fluid_recalc_width: allow grid resize on window resize events
      # recalculate width of grid based on parent container; handles multiple grids
      # ref: http://www.trirand.com/blog/?page_id=393/feature-request/Resizable%20grid/
      
      # afterSubmit: display error message in response
      
      %Q^ function gridify_fluid_recalc_width(){
          if (grids = jQuery('.fluid.ui-jqgrid-btable:visible')) {
            grids.each(function(index) {
              gridId = jQuery(this).attr('id');
              gridParentWidth = jQuery('#gbox_' + gridId).parent().width();
              jQuery('#' + gridId).setGridWidth(gridParentWidth);
            });
          }
        };

        jQuery(window).bind('resize', gridify_fluid_recalc_width);
        
        function gridify_action_error_handler(r, data, action){
          if (r.responseText != '') {
            return [false, r.responseText];
          } else  {
            return true;
          }
        }
      ^
    end


    # if(r.responseText != "") {
    #   $('#{error_container}').html(r.responseText);
    #   $('#{error_container}').slideDown();
    #   //window.setTimeout(function() { // Hide error div after 6 seconds
    #   // $('#{error_container}').slideUp();
    #   //}, 6000);
    #   return false;
    # }
    # return true;
    
    # lets options be true or a hash, merges into defaults and returns a hash
    def merge_options_defaults( options, defaults={} )
      if options
        defaults.merge( options==true ? {} : options)
      else
        {}
      end
    end
       
  end
end

class Hash
  # replace embedded '"javascript: foo"' with 'foo'
  def to_json_with_js
    self.to_json.gsub(/\"javascript: ([^"]*)\"/) {|string| string[1..-2].gsub('javascript:','') }
  end
end
