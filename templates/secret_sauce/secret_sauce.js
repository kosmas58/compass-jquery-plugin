// extracts form data from an existing rails form, and replaces it's own contents with the contents
// of data
jQuery.fn.addSauceFromForm = function(data) {
    var formData = $(data).find(".ui-dialog-content").children();
    var formToken = $(data).find("input[name='authenticity_token']");
    var formMethod = $(data).find("input[name='_method']");
    $(data).children().remove();
    $(data).append(formData);
    $(data).append(formToken);
    $(data).append(formMethod);
    $(this).append(data);
};