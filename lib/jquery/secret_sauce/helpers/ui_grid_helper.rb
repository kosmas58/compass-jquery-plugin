module SecretSauce
  module Helpers
    # This module wraps the great jqGrid plugin for jQuery and jQuery UI (http://www.trirand.com/blog).
    module UiGridHelper
      # Renders a table using jqGrid[http://www.trirand.com/blog]. This method can be used for quickly
      # 'scaffolding' a model resource. It accepts arguments similiar to form_for. The first argument
      # must be either Symbol, or an Array. If a Symbol, it should be the name of the resource to build
      # the grid for.
      # == Parameters
      # Most of the documentation for the parameters are pulled from the jqGrid documentation found here:
      # http://www.secondpersonplural.ca/jqgriddocs/index.htm
      # * <tt>:alternate_rows -</tt> Set a zebra-striped grid. Default is set to false.
      # * <tt>:caption -</tt>  	Defines the caption for the grid. This caption appear above the 
      #   table header. If caption is nil, no caption will be referenced. By default the
      #   caption will be guessed from the <tt>name_or_array</tt> arguement.
      # * <tt>:cell_edit -</tt> Enables (disables) cell editing. 
      #   See CellEditing[http://www.secondpersonplural.ca/jqgriddocs/_2h30tykyb.htm] for more details.
      # * <tt>:cell_submit -</tt> Determines where the contents of the cell are saved: 'remote' or 'clientArray'. 
      #   See CellEditing[http://www.secondpersonplural.ca/jqgriddocs/_2h30tykyb.htm] for more details.
      # * <tt>:cell_url -</tt> The url where the cell is to be saved.
      #   See CellEditing[http://www.secondpersonplural.ca/jqgriddocs/_2h30tykyb.htm] for more details.
      # * <tt>:column_model -</tt>  	Array which describes the parameters of the columns. 
      #   For a full description of all valid values see 
      #   colModel[http://www.secondpersonplural.ca/jqgriddocs/_2eb0fihps.htm]. By default column_model
      #   is set for ActiveRecord::Base#find_for_grid.
      # * <tt>:column_names -</tt> Array which describes the column labels in the grid.
      # * <tt>:datastring -</tt> The string of data when datatype parameter is set to xmlstring or jsonstring.
      # * <tt>:datatype -</tt> Defines what type of information to expect to represent data in the grid. 
      #   Valid options are xml - we expect xml data; xmlstring - we expect xml data as string; 
      #   json - we expect JSON data; jsonstring - we expect JSON data as string; 
      #   clientSide - we expect data defined at client side (array data)
      # * <tt>:deselect_after_sort -</tt> Applicable only when we use <tt>datatype => "clientSide"</tt>. 
      #   Deselects currently-selected row(s) when a sort is applied.
      # * <tt>:edit_url -</tt> Defines the url for inline and form editing.
      # * <tt>:expand_column -</tt> Indicates which column (name from <tt>:column_model</tt>) 
      #   should be used to expand the tree grid. If not set the first one is used. Valid only when 
      #   treeGrid option is set to true.
      # * <tt>:force_fit -</tt>If set to true, and resizing the width of a column, 
      #   the adjacent column (to the right) will resize so that the overall grid width is 
      #   maintained (e.g., reducing the width of column 2 by 30px will increase the size of column 3 by 
      #   30px). In this case there is no horizontal scrolbar. Note: this option is not compatible with
      #   <tt>shrink_to_fit</tt> option - i.e if <tt>:shrink_to_fit</tt> is set to false, 
      #   <tt>:force_fit</tt> is ignored.
      # * <tt>:grid_state -</tt> 	Determines the current state of the grid (i.e. when used with hiddengrid, 
      #   <tt>:hide_grid</tt> and caption options). Can have either of two states: 'visible' or 'hidden'
      # * <tt>:hidden_grid -</tt> If set to true the grid initially is hidden. The data is not 
      #   loaded (no request is sent) and only the caption layer is shown. When the show/hide
      #   button is clicked the first time to show grid, the request is sent to the server,
      #   the data is loaded, and grid is shown. From this point we have a regular grid. This option
      #   has effect only if the caption property is not empty and the <tt>:hide_grid</tt> property (see below) 
      #   is set to true.
      # * <tt>:hide_grid -</tt> Enables or disables the show/hide grid button, which appears on the right side
      #   of the Caption layer. Takes effect only if the caption property is not an empty string.
      # * <tt>:height -</tt> The height of the grid. Can be set as percentage or any valid measured value.
      # * <tt>:image_path -</tt>Defines the path to the images that are used in the grid. Set this option 
      #   without / at end.
      # * <tt>:json_reader -</tt> Array which describes the structure of the expected json data. For a full 
      #   description and default setting, see JSONData[http://www.secondpersonplural.ca/jqgriddocs/_2eb0f6jhe.htm].
      # * <tt>:load_once -</tt> If this flag is set to true, the grid loads the data from the server
      #   only once (using the appropriate datatype). After the first request the <tt>:data_type</tt> parameter is
      #   automatically changed to clientSide and all further manipulations are done on the client side.
      #   The functions of the pager (if present) are disabled.
      # * <tt>:load_text -</tt> The text which appear when requesting and sorting data.
      # * <tt>:load_ui -</tt> This option controls what to do when an ajax operation is in progress.
      #   * disable - disables the jqGrid progress indicator. This way you can use your own indicator.
      #   * enable (default) - enables the red "Loading" message in the upper left of the grid.
      #   * block - enables the progress indicator using the characteristics you have specified in the
      #     css for div.loadingui and blocks all actions in the grid until the ajax request is finished.
      #     Note that this disables paging, sorting and all actions on toolbar, if any.
      # * <tt>:request_type -</tt> Defines the type of request to make ("POST" or "GET").
      # * <tt>:multikey -</tt> This parameter have sense only multiselect option is set to true. 
      #   Defines the key which will be pressed when we make multiselection. The possible values are: 
      #   shiftKey - the user should press Shift Key altKey - the user should press 
      #   Alt Key ctrlKey - the user should press Ctrl Key.
      # * <tt>:multibox -</tt> This option works only when <tt>:multiselect => true</tt>. 
      #   When multiselect is set to true, clicking anywhere on a row selects that row; 
      #   when multiboxonly is also set to true, the row is selected only when the checkbox 
      #   is clicked (Yahoo style).
      # * <tt>:multiselect -</tt>  	If this flag is set to true a multi selection of rows is enabled.
      #   A new column at left side is added. Can be used with any datatype option.
      # * <tt>:param_keys -</tt> Customizes names of the fields sent to the server on a Post: 
      #   default values for these fields are "page", "rows", "sidx", and "sord". 
      #   For example, with this setting, you can change the sort order element from "sidx" to "mysort":
      #   The string that will be posted to the server will then be 
      #   /foo/bars?page=1&rows=10&mysort=myindex&sord=asc rather than
      #   /foo/bars?page=1&rows=10&sidx=myindex&sord=asc.
      # * <tt>:post_data -</tt> This array is passed directly to the url. This is associative 
      #   array and can be used this way: {name1:value1...}.
      # * <tt>:resize_class -</tt> Assigns a class to columns that are resizable so that we can show
      #   a resize handle only for ones that are resizable.
      # * <tt>:scroll -</tt> Creates dynamic scrolling grids. When enabled, the pager elements are
      #   disabled and we can use the vertical scrollbar to load data. This option currently should be
      #   used carefully on big data sets, since the swapper isn't that intelligent, which means that
      #   all the data is loaded and a lot of memory will be used if the dataset is large. 
      #   You must be sure to have a initial vertical scroll in grid, i.e. the height 
      #   should not be set to auto.
      # * <tt>:scroll_rows -</tt> When enabled, selecting a row with setSelection scrolls the grid so 
      #   that the selected row is visible. This is especially useful when we have a verticall 
      #   scrolling grid and we use form editing with navigation buttons (next or previous row). 
      #   On navigating to a hidden row, the grid scrolls so the selected row becomes visible.
      # * <tt>:sort_class -</tt> The class to be applied to the currently sorted column, i.e. applied 
      #   to the th element.
      # * <tt>:shrink_to_fit -</tt> This option describes the type of calculation of the initial width of 
      #   each column against with the width of the grid. If the value is true and the value in width
      #   option is set then: Every column width is scaled according to the defined option width. 
      #   Example: if we define two columns with a width of 80 and 120 pixels, but want the grid to
      #   have a 300 pixels - then the columns are recalculated as 
      #   follows: 1- column = 300(new width)/200(sum of all width)*80(column width) = 120 and 2 column = 
      #   300/200*120 = 180. The grid width is 300px. If the value is false and the value in width option is set 
      #   then: The width of the grid is the width set in option. The column width are not recalculated and have the 
      #   values defined in colModel.
      # * <tt>:sort_asc_image -</tt> Links to image url which are used when the user sort a column.
      # * <tt>:sort_desc_image -</tt> Links to image url which are used when the user sort a column.
      # * <tt>:sort_name -</tt> The initial sorting name when we use datatypes xml or json
      #   (data returned from server).
      # * <tt>:sort_order -</tt> The initial sorting order when we use datatypes xml 
      #   or json (data returned from server).
      # * <tt>:toolbar -</tt> This option defines the toolbar of the grid. This is array with two
      #   values in which the first value enables the toolbar and the second defines the position 
      #   relative to body Layer. Possible values "top" or "bottom".
      # * <tt>:tree_grid -</tt> Enables (disables) the tree grid format. For more details see 
      #   TreeGrid[http://www.secondpersonplural.ca/jqgriddocs/_2h30rxa7u.htm]
      # * <tt>:user_data -</tt> This array contain custom information from the request. Can be used at any time. 
      # * <tt>:width -</tt> If this option is not set, the width of the grid is a sum of the widths of the 
      #   columns defined in the colModel (in pixels). If this option is set, the initial width of each 
      #   column is set according to the value of <tt>:shrink_to_fit</tt> option.
      # * <tt>:xml_reader -</tt> Array which describes the structure of the expected xml data. 
      #   For a full description refer to Data Types.
      def ui_grid_for(*args)
        name_or_array = args.first
        options = args.extract_options!
        option_map = {
          :alternate_rows => "altRows", # bool
          :caption => "caption", # string
          :cell_edit => "cellEdit", # bool
          :cell_submit => "cellSubmit", # string
          :cell_url => "cellUrl", # string
          :column_model => "colModel", # array
          :column_names => "colNames", # array
          :datastring => "dataStr", # string
          :datatype => "datatype", # string
          :deslect_after_sort => "deselectAfterSort", # bool
          :edit_url => "editUrl", # string
          :expand_column => "ExpandColumn", # string
          :footer_row => "footerrow", # bool TODO: ADD DOCUMENTATION
          :force_fit => "forceFit", # bool
          :grid_state => "gridstate", # string
          :hidden_grid => "hiddengrid", # bool
          :hide_grid => "hidegrid", # bool
          :height => "height", # string
          :image_path => "imgpath", # string
          :json_reader => "jsonReader", # array
          :load_complete => "loadComplete", # string TODO: ADD DOCUMENTATION
          :load_once => "loadonce", # bool
          :load_text => "load_text", # string
          :load_ui => "loadui", # string
          :request_method => "mtype", # string
          :multikey => "multikey", # string
          :multibox => "multiboxonly", # bool
          :multiselect => "multiselect", # bool
          :pager => "pager", # string TODO: ADD DOCUMENATION
          :param_keys => "prmnames", # array
          :post_data => "postData", # array 
          :resize_class => "resizeclass", # string
          :restful => "restful", # bool
          :row_num => "rowNum", # integer TODO: ADD DOCUMENATION
          :row_list => "rowList", # array TODO: ADD DOCUMENATION
          :scroll => "scroll", # bool
          :scroll_rows => "scrollrows", # bool
          :sort_class => "sortclass", # string
          :shrink_to_fit => "shrinkToFit", # bool
          :sort_asc_image => "sortascimg", # string
          :sort_desc_image => "sortdescimg", # string
          :sort_name => "sortname", # string
          :sort_order => "sortorder", # string
          :toolbar => "toolbar", # array
          :tree_grid => "treeGrid", # bool
          :user_data => "userData", # array
          :url => "url", # string TODO: ADD DOCUMENATION
          :view_records => "viewrecords", # bool TODO: ADD DOCUMENTATION
          :width => "width", # string
          :xml_reader => "xmlReader", # array
        }
        if name_or_array.class == Symbol
          options[:grid] = {} unless options[:grid]
          options[:nav] = {} unless options[:nav]
          options[:actions] = {} unless options[:actions]
          options[:url] = "/#{name_or_array}" unless options[:url]
          column_model = name_or_array.to_s.singularize.classify.constantize.new.attributes.keys.collect do |m|
            {:name => m, :index => m, :label => m.titleize, :width => (1024 / name_or_array.to_s.singularize.classify.constantize.new.attributes.length)}
          end
          grid_options = {
            ##########################################
            #:url => "/#{name_or_array}.json", 
            :url => "#{options[:url]}.json", 
            ##########################################
            :alternate_rows => true,
            :caption => "#{name_or_array}".titleize,
            :column_model => column_model,
            :datatype => "json",
            :restful => true,
            :json_reader => {:repeatitems => false},
            #:height => 22 * 30,
            :height => :auto,
            :row_num => 20,
            :row_list => [10, 20, 30],
            :pager => "#{name_or_array}_pager",
            :hide_grid => false,
            :view_records =>  true,
          } 
          grid_options.merge!(options[:grid])
          mapped_options = {}
          grid_options.each do |k,v|
            mapped_options[option_map[k]] = v
          end
          options[:nav].replace({
            :edit => false,
            :add => false,
            :del => false
          }.merge(options[:nav]))    
          render(:file => 'ui/_ui_grid_for_without_block.js.haml', :locals => {:options => mapped_options, :name => name_or_array, :url => options[:url], :nav => options[:nav], :actions => options[:actions]})
        end
      end
    end   
  end
end