module Ical
  module TimezonePeriod
    
    def ical_timezone_period
      @ical_timezone_period ||= RiCal.parse_string(ical_string || '').first || RiCal.TimezonePeriod
    end
      
    private
      def serialize_ical_timezone_period
        ical_timezone_period.dtend = ends_at
        self.ical_string = ical_timezone_period.to_s
      end
    
  end
end

#- dtstart
#- tzoffsetto
#- tzoffsetfrom
#- comment:
#    multi: *
#- rdate:
#    multi: *
#- rrule:
#    multi: *
#- tzname:
#    multi: *
