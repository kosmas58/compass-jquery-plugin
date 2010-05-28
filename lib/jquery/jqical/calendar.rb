module Jqical
  module Calendar    
    def ical_calendar
      @ical_calendar ||= RiCal.parse_string(ical_string || '').first || RiCal.Calendar
    end    
  end
end
