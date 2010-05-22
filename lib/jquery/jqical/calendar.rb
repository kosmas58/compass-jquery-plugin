module Jqical
  module Calendar
    
    def ical_calendar
      @ical_calendar ||= RiCal.parse_string(ical_string || '').first || RiCal.Calendar
    end
   
#    def calscale
#      @calscale = "GREOGORIAN"
#    end
#   
#    def method
#    end
#   
#    def prodid
#    end
#   
#    def version
#    end      
      
    private
      def serialize_ical_calendar
        #ical_calendar.dtend = ends_at
        #self.ical_string = ical_calendar.to_s
      end
    
  end
end

#- calscale
#- method
#- prodid
#- version

#method:
#    purpose: This property defines the iCalendar object method associated with the calendar object
#    ruby_name: icalendar_method
#    rfc_ref: "4.7.2 p 74-75"
#prodid:
#    purpose: This property specifies the identifier for the product that created the iCalendar object.
#    required: true
#    default_value: '-//com.denhaven2/NONSGML ri_cal gem//EN'
#    rfc_ref: '4.7.3 pp 75-76'    
#version:
#    purpose: This property specifies the identifier corresponding to thehighest version number or the minimum and maximum range of the iCalendar specification that is required in order to interpret the iCalendar object.
#    constant_value: '2.0'
#    rfc_ref: '4.7.4 pp 76-77' 
