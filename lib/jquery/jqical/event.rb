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
      @ends_at ||= ical_event.dtend ? ical_event.dtend.to_datetime : starts_at + 60.minutes
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
    
    def summary
      @summary ||= ical_event.summary
    end
    attr_writer :summary
    
    def location
      @location ||= ical_event.location
    end
    attr_writer :location    
    
    def description
      @description ||= ical_event.description
    end
    attr_writer :description
    
    def all_day
      @all_day ||= ical_event.x_properties["X-MICROSOFT-CDO-ALLDAYEVENT"][0] ? 1 : 0
    end
    attr_writer :all_day
    
    private
      def serialize_ical_event
        ical_event.summary     = summary
        ical_event.location    = location
        ical_event.description = description
        ical_event.x_properties["X-MICROSOFT-CDO-ALLDAYEVENT"] = []
        
        if all_day == "1"  
          ical_event.add_x_property("X-MICROSOFT-CDO-ALLDAYEVENT", "1")
          if starts_at <= ends_at
            ical_event.dtstart = DateTime.parse("#{start_date}T00:00")
            ical_event.dtend = DateTime.parse("#{end_date}T23:59")
          else       
            ical_event.dtstart = DateTime.parse("#{start_date}T00:00")     
            ical_event.dtend = ical_event.dtstart+1.day-1.minute
          end
        else
          if starts_at <= ends_at
            ical_event.dtstart = DateTime.parse("#{start_date}T#{start_time}")
            ical_event.dtend = DateTime.parse("#{end_date}T#{end_time}")
          else
            ical_event.dtstart = DateTime.parse("#{start_date}T#{start_time}")
            ical_event.dtend = ical_event.dtstart+1.hour
          end
        end
        self.ical_string = ical_event.to_s
      end    
  end  
end