module SecretSauce
  module Helpers    
    module UiFormHelper  
      class UiFormBuilder < ActionView::Helpers::FormBuilder

        def submit(value, options={})
          options = {:id => "#{object_name}_submit"}.merge(options)
          @template.instance_variable_set("@ui_form_submit", [value, options])
          nil
        end

        def error_messages
          @template.error_messages_for(object_name)
        end
      end  
  
      # renders a jquery-ui templated static dialog box (cannot be resized or moved, appears on base z-index)
      # to be used for things like forms
      def ui_static_dialog(options={}, &block)
        body = capture(&block)
        concat(ui_static_dialog_tags(options))
        body
        concat(%q{
              </div>
            </div>
          </div>
        })
      end

      # flat tags for static dialog
      def ui_static_dialog_tags(options={})
        options[:width] = 100 unless options[:width]
        options[:height] = 100 unless options[:height]
        options[:title] = "Dialog" unless options[:title]
        options[:parent] = '' unless options[:parent]
        options[:style] = "width: #{options[:width]}px;"
        if options[:center]
          options[:parent] = "width: 100%;"
          options[:style] << " margin-left: auto; margin-right: auto;"
        end
        render :partial => 'shared/ui_static_dialog', :locals => options
      end

      # builds a form within a ui_static_dialog using UiFormBuilder in this case we are using a
      # custom version of form_for instead of the original to wrap jquery-ui components inside
      # of the form
      def ui_form_for(record_or_name_or_array, *args, &proc)
        raise ArgumentError, "Missing block" unless block_given?
    
        if params[:layout] == "dialog"
          return form_for(record_or_name_or_array, *args, &proc)
        else
          options = args.extract_options!
          options[:builder] = UiFormBuilder

          if !options[:submit]
            options[:submit] = {:value => "Save Changes", :options => {}}
          else
            options[:submit][:value] = "Save Changes" if !options[:submit][:value]
            options[:submit][:options] = {} if !options[:submit][:options]
          end

          case record_or_name_or_array
          when String, Symbol
            object_name = record_or_name_or_array
          when Array
            object = record_or_name_or_array.last
            object_name = ActionController::RecordIdentifier.singular_class_name(object)
            apply_form_for_options!(record_or_name_or_array, options)
            args.unshift object
          else
            object = record_or_name_or_array
            object_name = ActionController::RecordIdentifier.singular_class_name(object)
            apply_form_for_options!([object], options)
            args.unshift object
          end
          concat("<div id='#{object_name}_form_container'>")
          concat(form_tag(options.delete(:url) || {}, options.delete(:html) || {}))
          concat(ui_static_dialog_tags(options[:dialog_options]))
            fields_for(object_name, *(args << options), &proc)
          concat(%Q{
                  </div>
                  <div class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix">
                    #{ui_submit_tag(@ui_form_submit[0], @ui_form_submit[1]) if @ui_form_submit}
                  </div>
                </div>
              </div>
            </form>
          </div>})
        end
      end

      # render a button pane
       def ui_button_pane(&block)
         body = capture(&block)
         concat("<div class='ui-dialog-buttonpane ui-widget-content ui-helper-clearfix'>")
         body
         concat("</div>")
       end

       # render a submit tag themed with jquery ui
       def ui_submit_tag(value = "Save changes", options = {})
         if options[:class]
           options[:class] << " ui-state-default ui-corner-all"
         else
           options[:class] = "ui-state-default ui-corner-all"
         end
         submit_tag(value, options)
       end

       def error_messages_for(*params)
         render :partial => "shared/ui_form_error_messages", :locals => {:messages => super(*params) }
       end         
     end     
   end
 end
      
      