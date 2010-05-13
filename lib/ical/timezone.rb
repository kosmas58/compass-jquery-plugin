module Ical
  module Timezone
    
    def ical_timezone
      @ical_timezone ||= RiCal.parse_string(ical_string || '').first || RiCal.Timezone
    end
      
    private
      def serialize_ical_timezone
        ical_timezone.dtend = ends_at
        self.ical_string = ical_timezone.to_s
      end
    
  end
end

#- tzid
#- last-modified
#- tzurl
