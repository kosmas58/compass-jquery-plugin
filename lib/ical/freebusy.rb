module Ical
  module Freebusy
    
    def ical_freebusy
      @ical_freebusy ||= RiCal.parse_string(ical_string || '').first || RiCal.Freebusy
    end
      
    private
      def serialize_ical_freebusy
        ical_freebusy.dtend = ends_at
        self.ical_string = ical_freebusy.to_s
      end
    
  end
end

#- contact
#- dtstart 
#- dtend
#- duration
#- dtstamp
#- organizer
#- uid
#- url
#- attendee:
#    multi: *
#- comment:
#    multi: *
#- freebusy:
#    multi: *
#- request-status:
#    multi: *
