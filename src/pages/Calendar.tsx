import Header from "@/components/ui/header";
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' // a plugin!
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
            if (!user) return;

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
                    .eq('user_id', user.id);

                if (error) throw error;
                setEntries(data || []);
            } catch (err) {
                console.error('Error fetching entries:', err);
            }
        };

        fetchEntries();
    }, [user]);

    const tileContent = ({ date }: { date: Date }) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayEntries = entries.filter(entry => entry.entry_date === dateStr);

        if (dayEntries.length === 0) return null;

        return (
            <div className="text-xs p-1 overflow-hidden">
                {dayEntries.map(entry => (
                    <div key={entry.id} className="mb-1">
                        <div className="font-semibold text-[#735454]">{entry.prompt.title}</div>
                        <div className="truncate text-gray-600">{entry.content}</div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-svh" style={{ backgroundColor: '#BAA68E' }}>
            <Header />
            {/* This is the Calendar page */}
            <h1 className="text-black text-3xl font-bold text-center mt-10">Calendar Page</h1>
            {/* You can add your calendar component here */}
            <FullCalendar
                plugins={[ dayGridPlugin ]}
                initialView="dayGridMonth"
                events={entries.map(entry => ({
                    title: entry.prompt.title,
                    date: entry.entry_date
                }))}
                dateCellContent={tileContent}
                />
        </div>
    )
}