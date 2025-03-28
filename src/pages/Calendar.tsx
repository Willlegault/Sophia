import Header from "@/components/ui/header";
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' // a plugin!
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type CalendarEvent = {
    title: string; // Title of the event
    date: string; // Date of the event in 'YYYY-MM-DD' format
};


export default function Calendar() {
    const { user } = useAuth();
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]); // State to hold calendar events

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                console.error("User not authenticated");
                return;
            }
            // Fetch journal entries from Supabase
            const { data: entries, error } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                console.error("Error fetching journal entries:", error);
                return;
            }

            // Process entries to fit FullCalendar format
            const events = entries.map(entry => ({
                title: entry.title, // Assuming you have a title field in your journal entries
                date: entry.entry_date // Assuming you have an entry_date field in your journal entries
            }));

            setCalendarEvents(events)

            // Here you can set the state for calendar events if needed
        }

        fetchData();
}, [])
    return (
        <div className="min-h-svh" style={{ backgroundColor: '#BAA68E' }}>
            <Header />
            {/* This is the Calendar page */}
            <h1 className="text-black text-3xl font-bold text-center mt-10">Calendar Page</h1>
            {/* You can add your calendar component here */}
            <FullCalendar
                plugins={[ dayGridPlugin ]}
                initialView="dayGridMonth"
                events={calendarEvents}
                />
        </div>
    )
}