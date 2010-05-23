module Jqical
  module Event
    
    def ical_event
      @ical_event ||= RiCal.parse_string(ical_string || '').first || RiCal.Event
    end
    
    def starts_at
      @starts_at ||= ical_event.dtstart ? ical_event.dtstart.to_datetime : DateTime.now
    end
    
    def starts_at=(date_time)
      @start_time = @start_date = nil
      @starts_at = date_time
    end
    
    def ends_at
      @ends_at ||= ical_event.dtend ? ical_event.dtend.to_datetime : starts_at + 60 * 60
    end
    
    def ends_at=(date_time)
      @end_time = @end_date = nil
      @ends_at = date_time
    end
    
    def summary
      @summary ||= ical_event.summary
    end
    attr_writer :summary
    
    private
      def serialize_ical_event
        ical_event.dtend = ends_at
        ical_event.dtstart = starts_at
        ical_event.summary = summary
        self.ical_string = ical_event.to_s
      end
  end
end

#- class
#- created
#- description
#- dtstart 
#- geo
#- last-modified
#- location
#- organizer
#- priority
#- dtstamp
#- sequence
#- status
#- summary
#- transp
#- uid
#- url
#- recurrence-id
#- dtend:
#    conflicts_with: duration
#- duration:
#    conflicts_with: dtend
#- attach:
#    multi: *
#- attendee:
#    multi: *
#- categories:
#    multi: *
#- comment:
#    multi: *
#- contact:
#    multi: *
#- exdate:
#    multi: *
#- rdate:
#    multi: *
#- exrule:
#    multi: *
#- request-status:
#    multi: *
#- related-to:
#    multi: *
#- resources:
#    multi: *
#- rrule:
#    multi: *

