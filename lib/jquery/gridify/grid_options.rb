module Gridify
  class Grid
    # non persistent options:
    #             :build_model
    #             :only
    #             :except     
             
    attr_accessor :name,                # name of the table (required)
                  :resource,            # based on AR model class (assume tableized, plural, string)
                                        # used as basis for all RESTful requests and data format

    # model
                  :columns,             # incoming: hash of presets (native jqGrid); internally: array of GridColumn objects
                                        # { :body => { "title" => {"width" => 98} }} 

                  #:widths,             # hash of column width (key = data type)
                  :searchable,          # default: true (used in generating columns, changing has no effect on existing cols)
                  :sortable,            # default: true (used in generating columns, changing has no effect on existing cols)
                  :editable,            # default: false (used in generating columns, changing has no effect on existing cols)
                      
    # grid
                  :dom_id,                # defaults to #{resource}_#{name} eg "notes_grid"
                  
                  :jqgrid_options,        # hash of additional jqGrid options that override any other settings


    # grid layout options
                  :width,                 # in pixels, or nil (nil means calculated based on overflow setting)
                  :width_fit,             # :fluid, :scroll, or :visible
                                          #   :fluid will always fit container (presently ignores width option)
                                          #   :scroll uses horizontal scrollbars
                                          #   :fitted scales columns to fit in width, not fluid
                  
                  :height,                # in pixels, '100%', or :auto (150) 
                                          #   :auto means makes it as tall as needed per number of rows

                  :resizable,             # allow gride resize with mouse, (true) (or {}) for default options; 
                                          #   nil or false for disabled; or hash of jqUI options
                                          #   see http://jqueryui.com/demos/resizable/
                                          #   defaults (differ from jqUI ones) "minWidth" => 150, "minHeight" => 80
                                          #   when overflow is fluid, "handles" => 's', otherwise 'e, s, se'

                  :arranger,           # :sortable, :hide_show, :chooser, or nil for none (nil) , 
                                          #   can combine with array of options
                                          #   or can be a hash with options
                                          #   see http://www.trirand.com/jqgridwiki/doku.php?id=wiki:show_hide_columns
    
    # rows    
                  :alt_rows,              # true for odd/even row classes, or odd row style name string (nil)

                  :row_numbers,           # true to display row numbers in left column; or numeric width in pixels (nil)

                  :select_rows,           # true for rows are selectable (eg for pager buttons); or js function when row is selected, false disables hover (true if pager buttons else false)

    # header layer
                  :title,                 # title string (aka caption), or true for resource.titleize, nil for no title (nil)
                  
                  :collapsible,           # when true generates collapse icon (false) 
                  :collapsed,             # when true initial state is collapsed (false)
                  
    # pager layer
                  :pager,                 # id of the pager, or true => dom_id+"_pager", false or nil for no pager (nil)
                  :paging_controls,       # false to disable all (true); or hash with native jqGrid options
                  :paging_choices,        # array of rows_per_page choices ([10,25,50,100])

    # nav buttons
                  :view_button,           # true, or hash of native jqGrid parameters and events for the action
                  :add_button,
                  :edit_button,
                  :delete_button,
                  
                  :search_button,         # enable search button and dialog
                  :search_advanced,       # instead of search_button
                  :search_toolbar,        # toggleable search bar, true or :visible, :hidden (other options?)  (nil)
                  
                  :refresh_button,
                  :jqgrid_nav_options,    # native jqGrid button options (added to 2nd arg in navGrid method)
                  
                  
    # data
                  :restful,               # use restful url and mtype (true) for all actions
                  :finder,                # default: :find
                  :url,                   # request url (required unless table_to_grid or derived from resource)
                                          #   if nil, uses "/#{resource}" eg "/notes"
                                          #   note, to force "editurl" use jqgrid_options
                  
                  :data_type,             # :xml, :json, and other defined in jqGrid options doc (xml)
                  :data_format,           # (defaults to rails conventin based on resource) <chickens><chicken><title><body> format
                                          #   set false for jqGrid default <rows><records><row><cell> format
                  
                  :sort_by,           # name of sort column of next request
                  :sort_order,            # sort direction of next request, 'asc' or 'desc' ('asc')
                  :case_sensitive,        # sort and search are case sensitive (false)
                  
                  :current_page,                 # current page requested
                  :rows_per_page,         # number of items to be requested in the next request (paging_choices.first or -1 if pager false)
                  
                  :table_to_grid,         # when true generates tableToGrid (false) from html table, then use as local data
                                          #   note, we assume table rows are not selectable. 
                                          #   (tableToGrid sets multiselect when first col has checkboxes or radio buttons, 
                                          #   we dont know to preserve this so you also need to set in options)
                                          
                  :load_once,             # true to use local data after first load (false)
                  :error_handler,         # javacript: method for crud error handling (default to "after_submit")
                  :error_container,       # selector for posting error/flash messages (.errorExplanation)
                                          
               
                  :z
        
    # ----------------------  
    # attribute defaults and special value handling
    # (sure it'd be easier to initialize defaults using a hash but we want nil to mean the jqGrid default - might be true - and not pass a value at all)
    
    def restful
      @restful==false ? false : true
    end
    
    def finder
      @finder || :find
    end
    
    def searchable
      @searchable==false ? false : true
    end
    
    def sortable
      @sortable==false ? false : true
    end
        
            
    def dom_id
      @dom_id || "#{resource}_#{name}"
    end
    
    def jqgrid_options
      @jqgrid_options || {}
    end
    
    def width_fit
      @width_fit || :fluid
    end
    
    def resizable
      return false if @resizable == false
      rs = { "minWidth" => 150, "minHeight" => 80 }
      rs.merge!({ "handles" => 's' }) if width_fit == :fluid
      rs.merge!( @resizable ) if @resizable.is_a?(Hash)
      rs
    end
    
    def arranger_type #read-only
      if arranger.is_a?(Hash)
        arranger.keys
      else
        Array(arranger)
      end
    end
    
    def arranger_options(type) #read-only       
      (arranger[type] if arranger.is_a?(Hash)) || {}
    end
    
    def select_rows
      if @select_rows
        @select_rows
      else
        pager && (view_button || edit_button || delete_button)
      end
    end
    
    # header layer
    def title
      case @title
      when String:  @title
      when true:    resource.titleize
      else          
        ('&nbsp;' if collapsible || collapsed) #show header with blank title
      end
    end

    def collapsible
      @collapsible || @collapsed
    end
    
    # pager layer
    def pager
      case @pager
      when String:  @pager
      when true:    dom_id+'_pager'
      end
    end
    
    def paging_controls
      @paging_controls.nil? ? true : @paging_controls
    end
    
    def paging_choices
      @paging_choices || [10,25,50,100]
    end
    
    # data
    def url
      @url || "/#{resource}"
    end

    def rows_per_page
      #debugger
      # all rows when pager controls or rows per page are off
      if !pager || paging_controls==false || @rows_per_page==false || @rows_per_page==-1
        -1
      elsif @rows_per_page.nil?
        paging_choices.first
      else
        @rows_per_page
      end
    end
    
    def data_type
      @data_type || :xml
    end

    def data_format
      if @data_format || @data_format==false #explicit false for no param
        @data_format
      elsif resource && data_type == :xml
        {
          :root        => resource,
          :page        => resource+'>page',
          :total       => resource+'>total_pages',
          :records     => resource+'>total_records',
          :row         => resource.singularize,
          :repeatitems => false,
          :id          => :id
        }
      elsif resource && data_type == :json
        {
          :root        => resource,
          :page        => 'page',
          :total       => 'total_pages',
          :records     => 'total_records',
          :row         => resource.singularize,
          :repeatitems => false,
          :id          => :id
        }
      end
    end
    
    def error_handler
      @error_handler || 'gridify_action_error_handler'
    end
    
    def error_handler_return_value
      error_handler ? error_handler : 'true;'
    end
    
    def error_container
      @error_container || '.errorExplanation'
    end

  end
end
