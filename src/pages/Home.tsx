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

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historicalEntries, setHistoricalEntries] = useState<HistoricalEntry[]>([]);

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

  // Add this new effect for fetching historical entries
  useEffect(() => {
    async function fetchHistory() {
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
    }

    fetchHistory();
  }, [user]);

  const handleSaveEntry = async (promptId: string, content: string) => {
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
          .update({ content })
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
              entry_date: today
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

  return (
    <div className="min-h-svh" style={{ backgroundColor: '#BAA68E' }}>
      <header style={{ backgroundColor: '#5E503F' }} className="p-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-white text-2xl font-bold">Health Tracker</h1>
          
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => navigate('/')}
              className="text-white hover:text-gray-200"
            >
              Journal
            </button>
            <button 
              onClick={() => navigate('/calendar')}
              className="text-white hover:text-gray-200"
            >
              Calendar
            </button>
            <button 
              onClick={() => navigate('/resources')}
              className="text-white hover:text-gray-200"
            >
              Resources
            </button>
            
            {user ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-white hover:text-gray-200"
              >
                Dashboard
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="text-white hover:text-gray-200"
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate('/register')}
                  className="text-white hover:text-gray-200 border border-white px-3 py-1 rounded"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* History Sidebar */}
        <div className="w-80 bg-white h-[calc(100vh-4rem)] overflow-y-auto shadow-lg">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Journal History</h2>
          </div>
          
          {user ? (
            historicalEntries.length > 0 ? (
              <div className="divide-y">
                {historicalEntries.map((entry) => (
                  <div key={entry.id} className="p-4 hover:bg-gray-50">
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
          <h2 className="text-2xl font-bold text-white mb-6">Daily Journal</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-white">Loading prompts...</div>
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
                    className="w-full p-3 border rounded-lg mb-2"
                    rows={4}
                    placeholder="Write your thoughts here..."
                    value={entries[prompt.id] || ''}
                    onChange={(e) => handleSaveEntry(prompt.id, e.target.value)}
                  />
                  {!user && (
                    <p className="text-sm text-gray-500">
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