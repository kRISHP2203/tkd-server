
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { History, X } from 'lucide-react';
import type { MatchResult } from '@/hooks/use-match-engine';
import { Badge } from '@/components/ui/badge';

export default function HistoryPage() {
  const [history, setHistory] = useState<MatchResult[]>([]);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('matchHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load match history from localStorage", error);
    }
  }, []);
  
  const handleClearHistory = () => {
    try {
        localStorage.removeItem('matchHistory');
        setHistory([]);
    } catch (error) {
        console.error("Failed to clear match history from localStorage", error);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-body">
      <Card className="w-full max-w-2xl relative">
        <Link href="/" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
        </Link>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-6 w-6" />
            <span>Match History</span>
          </CardTitle>
          <CardDescription>
            Showing the last {history.length} of 2 recorded matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {history.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Winner</TableHead>
                        <TableHead className="text-right">Final Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.map((match) => (
                        <TableRow key={match.id}>
                            <TableCell>{new Date(match.date).toLocaleString()}</TableCell>
                            <TableCell>
                                <Badge variant={match.winner === 'tie' ? 'secondary' : match.winner === 'red' ? 'destructive' : 'default'}>
                                    {match.winner.charAt(0).toUpperCase() + match.winner.slice(1)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">{match.finalScore.red} - {match.finalScore.blue}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground text-center py-10">
                    <p>No match history found.</p>
                </div>
            )}
             {history.length > 0 && (
                <div className="flex justify-end mt-4">
                    <Button variant="destructive" onClick={handleClearHistory}>
                        Clear History
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
