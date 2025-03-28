import Header from "@/components/ui/header";
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' // a plugin!
export default function Calendar() {
    return (
        <div className="min-h-svh" style={{ backgroundColor: '#BAA68E' }}>
            <Header />
            {/* This is the Calendar page */}
            <h1 className="text-black text-3xl font-bold text-center mt-10">Calendar Page</h1>
            {/* You can add your calendar component here */}
            <FullCalendar
                plugins={[ dayGridPlugin ]}
                initialView="dayGridMonth"
                events=
                {[
                { title: 'event 1', date: '2019-04-01' },
                { title: 'event 2', date: '2019-04-02' }
                ]}
                />
        </div>
    )
}