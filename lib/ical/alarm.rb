module Ical
  module Alarm
    
    def ical_alarm
      @ical_alarm ||= RiCal.parse_string(ical_string || '').first || RiCal.Alarm
    end
      
    private
      def serialize_ical_alarm
        ical_alarm.dtend = ends_at
        self.ical_string = ical_alarm.to_s
      end
    
  end
end

#- action
#- description
#- trigger
#- duration
#- repeat
#- summary
#- attendee:
#    multi: *
#- attach:
#    multi: *
