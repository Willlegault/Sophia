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
      <Header />
    </div>
  );
}