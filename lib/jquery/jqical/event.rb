module Jqical
  module Event
    
    def ical_event
      @ical_event ||= RiCal.parse_string(ical_string || '').first || RiCal.Event
    end
    
    def starts_at
      @starts_at ||= dtstart ? dtstart : DateTime.zone.now
    end
    
    def starts_at=(date_time)
      @start_time = @start_date = nil
      @starts_at = date_time
    end
    
    def start_date
      @start_date ||= I18n.l(Date.parse(starts_at.to_s))
    end
    
    def start_date=(string_date)
      if parsed = DateTime.parse("#{string_date} #{start_time}") rescue nil
        @starts_at = parsed
      end
      @start_date = string_date
    end
    
    def start_time
      @start_time ||= I18n.l(Time.parse(starts_at.to_s), :format => :time)
    end
    
    def start_time=(string_time)
      if parsed = DateTime.parse("#{start_date} #{string_time}") rescue nil
        @starts_at = parsed
      end
      @start_time = string_time
    end
    
    def ends_at
      @ends_at ||= dtend ? dtend : starts_at + 60.minutes
    end
    
    def ends_at=(date_time)
      @end_time = @end_date = nil
      @ends_at = date_time
    end
    
    def end_date
      @end_date ||= I18n.l(Date.parse(ends_at.to_s))
    end
    
    def end_date=(string_date)
      if parsed = DateTime.parse("#{string_date} #{end_time}") rescue nil
        @ends_at = parsed
      end
      @end_date = string_date
    end
    
    def end_time
      @end_time ||= I18n.l(Time.parse(ends_at.to_s), :format => :time)
    end
    
    def end_time=(string_time)
      if parsed = DateTime.parse("#{end_date} #{string_time}") rescue nil
        @ends_at = parsed
      end
      @end_time = string_time
    end

    private
      def serialize_ical_event
        ical_event.x_properties["X-MICROSOFT-CDO-ALLDAYEVENT"] = []
        if all_day
          self.all_day = true          
          ical_event.add_x_property("X-MICROSOFT-CDO-ALLDAYEVENT", "1")
          self.dtstart = DateTime.parse("#{start_date}T00:00")
          if starts_at <= ends_at-1.day
            self.dtend = DateTime.parse("#{end_date}T00:00")
          else            
            self.dtend = self.dtstart+1.day
          end
        else
          self.all_day = false
          self.dtstart = DateTime.parse("#{start_date}T#{start_time}")
          if starts_at <= ends_at
            self.dtend = DateTime.parse("#{end_date}T#{end_time}")
          else
            self.dtend = self.dtstart+1.hour
          end
        end
        
        ical_event.dtend       = ends_at
        ical_event.dtstart     = starts_at
        ical_event.summary     = summary
        ical_event.description = description
        ical_event.location    = location
        self.ical_string = ical_event.to_s
      end
  end
end
