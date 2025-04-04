import Header from "@/components/ui/header";
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface JournalEntry {
  id: string;
  content: string;
  entry_date: string;
  prompt: {
    title: string;
    description: string;
  }
}

export default function Calendar() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<JournalEntry[]>([]);

    useEffect(() => {
        const fetchEntries = async () => {
            if (!user || !user.id) return; // Ensure user and user.id exist

            try {
                const { data, error } = await supabase
                    .from('journal_entries')
                    .select(`
                        id,
                        content,
                        entry_date,
                        prompt:prompts (
                            title,
                            description
                        )
                    `)
                    .eq('user_id', user.id); // Access user.id safely

                if (error) throw error;

                // Transform data to match JournalEntry type
                const transformedData = (data || []).map(entry => ({
                    ...entry,
                    prompt: Array.isArray(entry.prompt) ? entry.prompt[0] : entry.prompt,
                }));

                setEntries(transformedData);
            } catch (err) {
                console.error('Error fetching entries:', err);
            }
        };

        fetchEntries();
    }, [user]);

    const dayCellContent = (arg: { date: Date, dayNumberText: string }) => {
        const dateStr = arg.date.toISOString().split('T')[0];
        const dayEntries = entries.filter(entry => entry.entry_date === dateStr);

        return (
            <div className="h-full flex flex-col">
                <div className="text-right font-semibold text-gray-800 p-1">{arg.dayNumberText}</div>
                {dayEntries.length > 0 ? (
                    <div className="flex-grow overflow-y-auto">
                        {dayEntries.map(entry => (
                            <div key={entry.id} className="text-xs p-1">
                                <div className="font-semibold text-[#735454]">{entry.prompt.title}</div>
                                <div className="truncate text-gray-600">{entry.content}</div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        );
    };

    return (
        <div className="min-h-svh" style={{ backgroundColor: '#BAA68E' }}>
            <Header />
            {/* <h1 className="text-white text-3xl font-bold text-center mt-10">Calendar Page</h1> */}
            <div className="p-4">
                <FullCalendar
                    plugins={[dayGridPlugin]}
                    initialView="dayGridMonth"
                    dayCellContent={dayCellContent}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek'
                    }}
                    height="auto"
                />
            </div>
        </div>
    )
}
