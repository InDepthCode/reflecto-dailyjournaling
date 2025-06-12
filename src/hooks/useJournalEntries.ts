import { useState, useEffect } from 'react';
// @ts-ignore
import { useAuth } from '@clerk/clerk-react';

interface JournalEntry {
  id: string;
  date: string;
  content: string;
}

export const useJournalEntries = () => {
  const { userId } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    if (userId) {
      const storedEntries = localStorage.getItem(`reflecto-entries-${userId}`);
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      }
    }
  }, [userId]);

  const addEntry = (content: string) => {
    if (!userId) return;

    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      content,
    };

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    localStorage.setItem(`reflecto-entries-${userId}`, JSON.stringify(updatedEntries));
  };

  const deleteEntry = (id: string) => {
    if (!userId) return;

    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    localStorage.setItem(`reflecto-entries-${userId}`, JSON.stringify(updatedEntries));
  };

  return {
    entries,
    addEntry,
    deleteEntry,
  };
};

export type { JournalEntry }; 