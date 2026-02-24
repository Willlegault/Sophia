import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Header from '@/components/ui/header';

interface EntryData {
  id: string;
  entry_date: string;
  mood: number | null;
  content: string;
  streak_count: number;
}

const MOOD_EMOJI: Record<number, string> = {
  1: '😔',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, entry_date, mood, content, streak_count')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: true });

      if (!error) setEntries(data || []);
      setLoading(false);
    };
    fetchEntries();
  }, [user]);

  // Stats
  const totalEntries = entries.length;
  const totalWords = entries.reduce(
    (sum, e) => sum + (e.content?.trim().split(/\s+/).filter(Boolean).length || 0),
    0
  );
  const currentStreak = entries.length ? entries[entries.length - 1].streak_count : 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentMoodEntries = entries.filter(
    (e) => e.mood && new Date(e.entry_date) >= sevenDaysAgo
  );
  const avgMood = recentMoodEntries.length
    ? recentMoodEntries.reduce((s, e) => s + (e.mood || 0), 0) / recentMoodEntries.length
    : null;

  // Mood trend — average mood per day, last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentEntries = entries.filter((e) => new Date(e.entry_date) >= thirtyDaysAgo);

  const moodByDay: Record<string, number[]> = {};
  recentEntries.forEach((e) => {
    if (e.mood) {
      if (!moodByDay[e.entry_date]) moodByDay[e.entry_date] = [];
      moodByDay[e.entry_date].push(e.mood);
    }
  });
  const moodTrendData = Object.entries(moodByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, moods]) => ({
      date: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: Math.round((moods.reduce((s, m) => s + m, 0) / moods.length) * 10) / 10,
    }));

  // Writing frequency — entries per day, last 30 days
  const freqByDay: Record<string, number> = {};
  recentEntries.forEach((e) => {
    freqByDay[e.entry_date] = (freqByDay[e.entry_date] || 0) + 1;
  });
  const frequencyData = Object.entries(freqByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      entries: count,
    }));

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center" style={{ backgroundColor: '#BAA68E' }}>
        <p className="text-white text-lg">Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="min-h-svh" style={{ backgroundColor: '#BAA68E' }}>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#1E1E1E] mb-8">Insights</h1>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Current Streak', value: `${currentStreak} days` },
            { label: 'Total Entries', value: totalEntries },
            {
              label: 'Avg Mood (7 days)',
              value:
                avgMood !== null
                  ? `${MOOD_EMOJI[Math.round(avgMood)]} ${avgMood.toFixed(1)}`
                  : '—',
            },
            { label: 'Words Written', value: totalWords.toLocaleString() },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow p-5">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-[#5E503F] mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mood trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-[#5E503F] mb-4">
              Mood Trend (Last 30 Days)
            </h2>
            {moodTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={moodTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tickFormatter={(v) => MOOD_EMOJI[v] ?? v}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${MOOD_EMOJI[Math.round(value)]} ${value}`,
                      'Mood',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="#834D4D"
                    strokeWidth={2}
                    dot={{ fill: '#834D4D' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm text-center px-4">
                No mood data yet — start selecting your mood when you journal!
              </div>
            )}
          </div>

          {/* Writing frequency */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-[#5E503F] mb-4">
              Writing Frequency (Last 30 Days)
            </h2>
            {frequencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={frequencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="entries" fill="#5E503F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
                No entries in the last 30 days yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
