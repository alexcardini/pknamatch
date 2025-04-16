import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface DataEntry {
  id: number;
  name: string;
  email: string;
}

const dummyData: DataEntry[] = [
  { id: 1, name: 'Juan Pérez', email: 'juan@example.com' },
  { id: 2, name: 'Ana López', email: 'ana@example.com' },
  { id: 3, name: 'Carlos García', email: 'carlos@example.com' },
];

const DataMatchingApp: React.FC = () => {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<DataEntry[]>([]);

  const handleSearch = () => {
    const results = dummyData.filter(
      (entry) =>
        entry.name.toLowerCase().includes(query.toLowerCase()) ||
        entry.email.toLowerCase().includes(query.toLowerCase())
    );
    setMatches(results);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold text-center">🔍 Data Matcher</h1>
      <div className="flex gap-2">
        <Input
          placeholder="Enter name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button onClick={handleSearch}>Match</Button>
      </div>
      <div className="space-y-2">
        {matches.map((match) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-4">
                <p className="font-medium">{match.name}</p>
                <p className="text-sm text-gray-500">{match.email}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {matches.length === 0 && query && (
          <p className="text-center text-gray-400">No matches found.</p>
        )}
      </div>
    </div>
  );
};

export default DataMatchingApp;
