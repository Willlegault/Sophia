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

const MOOD_OPTIONS = [
  { value: 1, emoji: '😔', label: 'Very low' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
];

const PHILOSOPHICAL_QUOTES = [
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "Between stimulus and response there is a space. In that space is our power to choose our response.", author: "Viktor Frankl" },
  { text: "We suffer more in imagination than in reality.", author: "Seneca" },
  { text: "Life is not a problem to be solved, but a reality to be experienced.", author: "Søren Kierkegaard" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { text: "Your task is not to seek for love, but merely to seek and find all the barriers within yourself that you have built against it.", author: "Rumi" },
  { text: "Not how long, but how well you have lived is the main thing.", author: "Seneca" },
  { text: "The present moment is the only moment available to us, and it is the door to all moments.", author: "Thich Nhat Hanh" },
  { text: "To thine own self be true.", author: "William Shakespeare" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "The soul that sees beauty may sometimes walk alone.", author: "Johann Wolfgang von Goethe" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama XIV" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "You yourself, as much as anybody in the entire universe, deserve your love and affection.", author: "Buddha" },
  { text: "The only way out is through.", author: "Robert Frost" },
  { text: "Everything can be taken from a man but one thing: to choose one's attitude in any given set of circumstances.", author: "Viktor Frankl" },
  { text: "Wherever you are, be all there.", author: "Jim Elliot" },
  { text: "Almost everything will work again if you unplug it for a few minutes — including you.", author: "Anne Lamott" },
];

interface JournalEntry {
  id: string;
  content: string;
  prompt_id: string;
  mood?: number;
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
  // const [showHistory, setShowHistory] = useState(false);
  const [historicalEntries, setHistoricalEntries] = useState<HistoricalEntry[]>([]);
  const [streakInfo, setStreakInfo] = useState<StreakInfo>({
    current_streak: 0,
    last_entry_date: null
  });
  const [selectedEntry, setSelectedEntry] = useState<HistoricalEntry | null>(null);
  const [moods, setMoods] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HistoricalEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

          // Update entries and moods state with today's entries
          const entriesMap: Record<string, string> = {};
          const moodsMap: Record<string, number> = {};
          entriesData?.forEach((entry: JournalEntry) => {
            entriesMap[entry.prompt_id] = entry.content;
            if (entry.mood) moodsMap[entry.prompt_id] = entry.mood;
          });
          setEntries(entriesMap);
          setMoods(moodsMap);
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
        .maybeSingle();

      if (latestError) throw latestError;

      if (latestEntry) {
        const lastEntryDate = new Date(latestEntry.entry_date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Format dates to compare just the date portion
        const lastEntryStr = lastEntryDate.toISOString().split('T')[0];
        // const todayStr = today.toISOString().split('T')[0];
        // const yesterdayStr = yesterday.toISOString().split('T')[0];

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

  useEffect(() => {
    if (!searchQuery.trim() || !user) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
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
          .ilike('content', `%${searchQuery}%`)
          .order('entry_date', { ascending: false })
          .limit(20);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error('Error searching entries:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user]);

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
            streak_count: existingEntry.streak_count,
            mood: moods[promptId] || null,
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
            streak_count: newStreakCount,
            mood: moods[promptId] || null,
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
          mood: moods[promptId] || undefined,
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

  const handleUpdateEntry = async (id: string, content: string, mood: number | undefined) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({ content: content.trim(), mood: mood || null })
        .eq('id', id);

      if (error) throw error;

      const applyUpdate = (e: HistoricalEntry) =>
        e.id === id ? { ...e, content: content.trim(), mood } : e;

      setHistoricalEntries(prev => prev.map(applyUpdate));
      setSearchResults(prev => prev.map(applyUpdate));
      setSelectedEntry(prev => (prev?.id === id ? { ...prev, content: content.trim(), mood } : prev));

      setError('Entry updated successfully!');
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Error updating entry:', err);
      setError('Error updating entry');
    }
  };

  // Modify to handle local state changes without saving
  const handleInputChange = (promptId: string, content: string) => {
    setEntries(prev => ({
      ...prev,
      [promptId]: content
    }));
  };

  const EntryDisplay = ({ entry, onBack, onUpdate }: {
    entry: HistoricalEntry;
    onBack: () => void;
    onUpdate: (id: string, content: string, mood: number | undefined) => Promise<void>;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(entry.content);
    const [editMood, setEditMood] = useState<number | undefined>(entry.mood);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      if (!editContent.trim()) return;
      setSaving(true);
      await onUpdate(entry.id, editContent, editMood);
      setSaving(false);
      setIsEditing(false);
    };

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-[#5E503F]">{entry.prompt.title}</h2>
          <div className="flex gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-[#5E503F] text-white px-4 py-2 rounded hover:bg-[#4E4030] transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onBack}
              className="bg-[#834D4D] text-white px-4 py-2 rounded hover:bg-[#733D3D] transition-colors"
            >
              Back to Journal
            </button>
          </div>
        </div>

        <p className="text-gray-600 mb-4">{entry.prompt.description}</p>

        {isEditing ? (
          <>
            <textarea
              className="w-full p-3 border rounded-lg mb-4"
              rows={8}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
            />
            <div className="flex items-center gap-1 mb-4">
              <span className="text-sm text-gray-500 mr-1">Mood:</span>
              {MOOD_OPTIONS.map(({ value, emoji, label }) => (
                <button
                  key={value}
                  type="button"
                  title={label}
                  onClick={() => setEditMood(value)}
                  className={`text-xl transition-transform hover:scale-125 ${
                    editMood === value ? 'scale-125 opacity-100' : 'opacity-40 hover:opacity-70'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setIsEditing(false); setEditContent(entry.content); setEditMood(entry.mood); }}
                className="px-4 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editContent.trim()}
                className="bg-[#834D4D] text-white px-4 py-2 rounded hover:bg-[#733D3D] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 whitespace-pre-wrap">{entry.content}</p>
            </div>
            <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
              <span>
                {entry.mood && (
                  <span title={MOOD_OPTIONS.find(m => m.value === entry.mood)?.label}>
                    {MOOD_OPTIONS.find(m => m.value === entry.mood)?.emoji}
                    <span className="ml-1">{MOOD_OPTIONS.find(m => m.value === entry.mood)?.label}</span>
                  </span>
                )}
              </span>
              <span>{new Date(entry.entry_date).toLocaleDateString()}</span>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-svh" style={{ backgroundColor: '#BAA68E' }}>
      <Header />
      <div className="flex">
        {/* History Sidebar */}
        <div className="w-80 bg-white h-[calc(100vh-4rem)] overflow-y-auto shadow-lg">
          <div className="border-b">
            <div className="p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Journal History</h2>
              <div className="flex items-center bg-[#834D4D] text-white px-3 py-1 rounded">
                <span className="text-lg font-bold">{streakInfo.current_streak}</span>
                <span className="ml-1 text-sm">day streak</span>
              </div>
            </div>
            {user && (
              <div className="px-4 pb-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search entries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-[#834D4D]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {user ? (
            isSearching ? (
              <div className="p-4 text-gray-500 text-center text-sm">Searching...</div>
            ) : (() => {
              const displayedEntries = searchQuery.trim() ? searchResults : historicalEntries;
              return displayedEntries.length > 0 ? (
                <div>
                  {searchQuery.trim() && (
                    <div className="px-4 py-2 text-xs text-gray-500 border-b">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                    </div>
                  )}
                  <div className="divide-y">
                    {displayedEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-800">{entry.prompt.title}</h3>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            {entry.mood && (
                              <span title={MOOD_OPTIONS.find(m => m.value === entry.mood)?.label}>
                                {MOOD_OPTIONS.find(m => m.value === entry.mood)?.emoji}
                              </span>
                            )}
                            <span>{new Date(entry.entry_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{entry.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-gray-500 text-center">
                  {searchQuery.trim() ? `No entries found for "${searchQuery}"` : 'No journal entries yet'}
                </div>
              );
            })()
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
                error === 'Entry saved successfully!' || error === 'Entry updated successfully!'
                  ? 'bg-white border border-gray-200 text-gray-700'
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}>
                {error}
              </div>
            )}
          </div>
          
          {(() => {
            const dayOfYear = Math.floor(
              (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
            );
            const quote = PHILOSOPHICAL_QUOTES[dayOfYear % PHILOSOPHICAL_QUOTES.length];
            return !selectedEntry ? (
              <div className="bg-white/80 rounded-lg p-5 mb-6 border-l-4 border-[#834D4D]">
                <p className="text-gray-700 italic leading-relaxed">"{quote.text}"</p>
                <p className="text-[#5E503F] text-sm font-medium mt-2">— {quote.author}</p>
              </div>
            ) : null;
          })()}

          {loading ? (
            <div className="text-white">Loading prompts...</div>
          ) : selectedEntry ? (
            <EntryDisplay
              entry={selectedEntry}
              onBack={() => setSelectedEntry(null)}
              onUpdate={handleUpdateEntry}
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
                  <div className="flex items-center gap-1 mb-4">
                    <span className="text-sm text-gray-500 mr-1">Mood:</span>
                    {MOOD_OPTIONS.map(({ value, emoji, label }) => (
                      <button
                        key={value}
                        type="button"
                        title={label}
                        onClick={() => setMoods(prev => ({ ...prev, [prompt.id]: value }))}
                        className={`text-xl transition-transform hover:scale-125 ${
                          moods[prompt.id] === value
                            ? 'scale-125 opacity-100'
                            : 'opacity-40 hover:opacity-70'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
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