module Ical
  module Journal
    
    def ical_journal
      @ical_journal ||= RiCal.parse_string(ical_string || '').first || RiCal.Journal
    end
      
    private
      def serialize_ical_journal
        ical_journal.dtend = ends_at
        self.ical_string = ical_journal.to_s
      end
    
  end
end

#- class
#- created
#- description
#- dtstart 
#- dtstamp
#- last-modified
#- organizer
#- recurrence-id
#- sequence
#- status
#- summary
#- uid
#- url
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
#- exrule:
#    multi: *
#- related-to:
#    multi: *
#- rdate:
#    multi: *
#- rrule:
#    multi: *
#- request-status:
#    multi: *
