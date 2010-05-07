module Eventually
  
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
      @start_date ||= starts_at.strftime('%m/%d/%Y')
    end
    
    def start_date=(string_date)
      if parsed = DateTime.parse("#{string_date} #{start_time}") rescue nil
        @starts_at = parsed
      end
      @start_date = string_date
    end
    
    def start_time
      @start_time ||= starts_at.strftime('%l:%M%p').strip
    end
    
    def start_time=(string_time)
      if parsed = DateTime.parse("#{start_date} #{string_time}") rescue nil
        @starts_at = parsed
      end
      @start_time = string_time
    end
    
    def ends_at
      @ends_at ||= ical_event.dtend ? ical_event.dtend.to_datetime : starts_at + 60 * 60
    end
    
    def ends_at=(date_time)
      @end_time = @end_date = nil
      @ends_at = date_time
    end
    
    def end_date
      @end_date ||= ends_at.strftime('%m/%d/%Y')
    end
    
    def end_date=(string_date)
      if parsed = DateTime.parse("#{string_date} #{end_time}") rescue nil
        @ends_at = parsed
      end
      @end_date = string_date
    end
    
    def end_time
      @end_time ||= ends_at.strftime('%l:%M%p').strip
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
    
    private
      def serialize_ical_event
        ical_event.dtend = ends_at
        ical_event.dtstart = starts_at
        ical_event.summary = summary
        self.ical_string = ical_event.to_s
      end
  end
  
end