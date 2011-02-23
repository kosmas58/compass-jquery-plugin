module ActionController
  class Base

    def render_refresh_grid
      render :js => refresh_grid("#{params[:controller]}_table")
    end

    def render_close_dialog_and_refresh_grid
      render :js => close_dialog("#{params["controller"]}_#{params["action"]}_dialog")+refresh_grid("#{params[:controller]}_table")
    end

    private

    def refresh_grid(grid_id)
      "jQuery('##{grid_id}').trigger('reloadGrid');"
    end
  end
end
