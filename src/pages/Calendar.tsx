import Header from "@/components/ui/header";

export default function Calendar() {
    return (
        <div className="min-h-svh" style={{ backgroundColor: '#BAA68E' }}>
            <Header />
            {/* This is the Calendar page */}
            <h1 className="text-black text-3xl font-bold text-center mt-10">Calendar Page</h1>
            {/* You can add your calendar component here */}
        </div>
    )
}