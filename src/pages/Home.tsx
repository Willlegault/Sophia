import Header from '@/components/ui/header';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Prompt {
  id: string;
  title: string;
  description: string;
  prompt_type: string;
}

interface JournalEntry {
  id: string;
  content: string;
  prompt_id: string;
}

interface HistoricalEntry extends JournalEntry {
  entry_date: string;
  prompt: {
    title: string;
    description: string;
  };
}

interface StreakInfo {
  current_streak: number;
  last_entry_date: string | null;
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historicalEntries, setHistoricalEntries] = useState<HistoricalEntry[]>([]);
  const [streakInfo, setStreakInfo] = useState<StreakInfo>({
    current_streak: 0,
    last_entry_date: null
  });
  const [selectedEntry, setSelectedEntry] = useState<HistoricalEntry | null>(null);

  const fetchHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select(`
          *,
          prompt:prompts (
            title,
            description
          )
        `)
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistoricalEntries(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  // Fetch prompts and existing entries
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch prompts
        const { data: promptsData, error: promptsError } = await supabase
          .from('prompts')
          .select('*')
          .limit(3);

        if (promptsError) throw promptsError;
        setPrompts(promptsData);

        // If user is logged in, fetch their entries for today
        if (user) {
          const today = new Date().toISOString().split('T')[0];
          const { data: entriesData, error: entriesError } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', user.id)
            .eq('entry_date', today);

          if (entriesError) throw entriesError;

          // Update entries state with today's entries
          const entriesMap: Record<string, string> = {};
          entriesData?.forEach((entry: JournalEntry) => {
            entriesMap[entry.prompt_id] = entry.content;
          });
          setEntries(entriesMap);
        }
      } catch (err) {
        setError('Error fetching data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  // Add this function to calculate streak
  const calculateStreak = async () => {
    if (!user) return;
    
    try {
      // Get the most recent entry
      const { data: latestEntry, error: latestError } = await supabase
        .from('journal_entries')
        .select('entry_date, streak_count')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(1)
        .single();

      if (latestError) throw latestError;

      if (latestEntry) {
        const lastEntryDate = new Date(latestEntry.entry_date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Format dates to compare just the date portion
        const lastEntryStr = lastEntryDate.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        setStreakInfo({
          current_streak: latestEntry.streak_count,
          last_entry_date: lastEntryStr
        });
      }
    } catch (err) {
      console.error('Error calculating streak:', err);
    }
  };

  // Add streak calculation to initial load
  useEffect(() => {
    if (user) {
      calculateStreak();
    }
  }, [user]);

  const handleSaveEntry = async (promptId: string, content: string, streakCount: number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if entry exists for today
      const { data: existingEntry } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('prompt_id', promptId)
        .eq('entry_date', today)
        .single();

      if (existingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('journal_entries')
          .update({ 
            content,
            streak_count: streakCount 
          })
          .eq('id', existingEntry.id);

        if (error) throw error;
      } else {
        // Create new entry
        const { error } = await supabase
          .from('journal_entries')
          .insert([
            {
              user_id: user.id,
              prompt_id: promptId,
              content,
              entry_date: today,
              streak_count: streakCount
            }
          ]);

        if (error) throw error;
      }

      setEntries(prev => ({
        ...prev,
        [promptId]: content
      }));
    } catch (err) {
      setError('Error saving entry');
      console.error(err);
    }
  };

  const handleSubmitEntry = async (promptId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const content = entries[promptId];
      if (!content || content.trim() === '') {
        setError('Please write something before submitting');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      let newStreakCount = 1; // Default for new streaks

      if (streakInfo.last_entry_date) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (streakInfo.last_entry_date === today) {
          // Already journaled today, keep current streak
          newStreakCount = streakInfo.current_streak;
        } else if (new Date(streakInfo.last_entry_date).toISOString().split('T')[0] === 
                  yesterday.toISOString().split('T')[0]) {
          // Journaled yesterday, increment streak
          newStreakCount = streakInfo.current_streak + 1;
        }
      }

      // Check for existing entry today
      const { data: existingEntry, error: checkError } = await supabase
        .from('journal_entries')
        .select('id, content, streak_count')
        .eq('user_id', user.id)
        .eq('prompt_id', promptId)
        .eq('entry_date', today)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let updatedEntry;
      
      if (existingEntry?.id) {
        const { data, error: updateError } = await supabase
          .from('journal_entries')
          .update({
            content: content.trim(),
            streak_count: existingEntry.streak_count // Keep existing streak
          })
          .eq('id', existingEntry.id)
          .select()
          .single();
          
        if (updateError) throw updateError;
        updatedEntry = data;
      } else {
        const { data, error: insertError } = await supabase
          .from('journal_entries')
          .insert([{
            user_id: user.id,
            prompt_id: promptId,
            content: content.trim(),
            entry_date: today,
            streak_count: newStreakCount // Use new streak count for new entries
          }])
          .select()
          .single();
          
        if (insertError) throw insertError;
        updatedEntry = data;

        // Update streak info for new entries
        setStreakInfo({
          current_streak: newStreakCount,
          last_entry_date: today
        });
      }

      // Update historical entries immediately
      setHistoricalEntries(prev => {
        const prompt = prompts.find(p => p.id === promptId);
        const newEntry = {
          id: updatedEntry.id,
          content: content.trim(),
          prompt_id: promptId,
          entry_date: today,
          prompt: {
            title: prompt?.title || '',
            description: prompt?.description || ''
          }
        };

        // Remove old entry for same prompt if it exists
        const filtered = prev.filter(entry => 
          !(entry.prompt_id === promptId && entry.entry_date === today)
        );

        // Add new entry at the beginning
        return [newEntry, ...filtered];
      });

      setError('Entry saved successfully!');
      setTimeout(() => setError(null), 3000);

    } catch (err) {
      console.error('Full error:', err);
      setError('Error submitting entry');
    }
  };

  // Modify to handle local state changes without saving
  const handleInputChange = (promptId: string, content: string) => {
    setEntries(prev => ({
      ...prev,
      [promptId]: content
    }));
  };

  const EntryDisplay = ({ entry, onBack }: { 
    entry: HistoricalEntry; 
    onBack: () => void;
  }) => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-[#5E503F]">{entry.prompt.title}</h2>
          <button
            onClick={onBack}
            className="bg-[#834D4D] text-white px-4 py-2 rounded hover:bg-[#733D3D] transition-colors"
          >
            Back to Journal
          </button>
        </div>
        <p className="text-gray-600 mb-6">{entry.prompt.description}</p>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-800 whitespace-pre-wrap">{entry.content}</p>
        </div>
        <div className="mt-4 text-sm text-gray-500 text-right">
          {new Date(entry.entry_date).toLocaleDateString()}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-svh" style={{ backgroundColor: '#BAA68E' }}>
      <Header />
      <div className="flex">
        {/* History Sidebar */}
        <div className="w-80 bg-white h-[calc(100vh-4rem)] overflow-y-auto shadow-lg">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Journal History</h2>
            <div className="flex items-center bg-[#834D4D] text-white px-3 py-1 rounded">
              <span className="text-lg font-bold">{streakInfo.current_streak}</span>
              <span className="ml-1 text-sm">day streak</span>
            </div>
          </div>
          
          {user ? (
            historicalEntries.length > 0 ? (
              <div className="divide-y">
                {historicalEntries.map((entry) => (
                  <div key={entry.id} 
                    className="p-4 hover:bg-gray-50 cursor-pointer" 
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">
                        {entry.prompt.title}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {new Date(entry.entry_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {entry.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-gray-500 text-center">
                No journal entries yet
              </div>
            )
          ) : (
            <div className="p-4 text-gray-500 text-center">
              Please login to view your journal history
            </div>
          )}
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white">
              {selectedEntry ? 'Journal Entry' : 'Daily Journal'}
            </h2>
            {error && (
              <div className={`inline-block px-4 py-2 rounded-lg shadow-md transition-opacity duration-300 ${
                error === 'Entry saved successfully!' 
                  ? 'bg-white border border-gray-200 text-gray-700'
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}>
                {error}
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="text-white">Loading prompts...</div>
          ) : selectedEntry ? (
            <EntryDisplay 
              entry={selectedEntry} 
              onBack={() => setSelectedEntry(null)} 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prompts.map((prompt) => (
                <div 
                  key={prompt.id}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold mb-2">{prompt.title}</h3>
                  <p className="text-gray-600 mb-4">{prompt.description}</p>
                  <textarea
                    className="w-full p-3 border rounded-lg mb-4"
                    rows={4}
                    placeholder="Write your thoughts here..."
                    value={entries[prompt.id] || ''}
                    onChange={(e) => handleInputChange(prompt.id, e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSubmitEntry(prompt.id)}
                      className="bg-[#834D4D] text-white px-4 py-2 rounded hover:bg-[#733D3D] transition-colors"
                    >
                      Submit Entry
                    </button>
                  </div>
                  {!user && (
                    <p className="text-sm text-gray-500 mt-2">
                      Please login to save your journal entries
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}