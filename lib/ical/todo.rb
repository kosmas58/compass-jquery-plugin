module Ical
  module Todo
    
    def ical_todo
      @ical_todo ||= RiCal.parse_string(ical_string || '').first || RiCal.Todo
    end
      
    private
      def serialize_ical_todo
        ical_todo.dtend = ends_at
        self.ical_string = ical_todo.to_s
      end
    
  end
end

#- class
#- completed
#- created
#- description
#- dtstamp
#- dtstart
#- geo
#- last-modified
#- location
#- organizer
#- percent-complete
#- priority
#- recurrence-id
#- sequence
#- status
#- summary
#- uid
#- url
#- due:
#    conflicts_with: duration
#- duration:
#    conflicts_with: due
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
#- request-status:
#    multi: *
#- related-to:
#    multi: *
#- resources:
#    multi: *
#- rdate:
#    multi: *
#- rrule:
#    multi: *
