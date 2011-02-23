module ActionController
  class Base

    def render_close_dialog(dialog_id)
      render :js => close_dialog
    end

    private

    def close_dialog(dialog_id)
      "jQuery('##{dialog_id}').dialog('close');"
    end
  end
end