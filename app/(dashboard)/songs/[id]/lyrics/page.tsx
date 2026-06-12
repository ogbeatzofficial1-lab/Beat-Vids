"use client";

import React, { useState, use, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LyricsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [lyricsText, setLyricsText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // This is the magic block that fetches your saved lyrics when the page loads!
  useEffect(() => {
    const fetchLyrics = async () => {
      try {
        console.log("Step 1: Asking database for lyrics for song ID:", resolvedParams.id);
        
        const { data, error } = await supabase
          .from('lyrics')
          .select('*') 
          .eq('song_id', resolvedParams.id)
          .order('line_index', { ascending: true });

        console.log("Step 2: Database responded with:", { data, error });

        if (error) throw error;

        if (data && data.length > 0) {
          console.log("Step 3: We found lyrics! Putting them in the box...");
          // Glue the lines back together and put them in the text box
          const combinedLyrics = data.map((row) => row.text).join('\n');
          setLyricsText(combinedLyrics);
        } else {
          console.log("Step 3: Database returned an empty list [] for this song ID.");
        }
      } catch (error) {
        console.error("Step 4: Error fetching lyrics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLyrics();
  }, [resolvedParams.id]); 

  const handleSave = async () => {
    if (!lyricsText.trim()) {
      alert("Please enter some lyrics first!");
      return;
    }

    setIsSaving(true);

    try {
      const lines = lyricsText.split('\n');
      const lyricsData = lines.map((line, index) => ({
        song_id: resolvedParams.id,
        line_index: index,
        text: line.trim(),
        start_ms: 0
      })).filter(line => line.text !== ""); 

      await supabase
        .from('lyrics')
        .delete()
        .eq('song_id', resolvedParams.id);

      // We added .select() here to force a receipt from the database
      const { data, error } = await supabase
        .from('lyrics')
        .insert(lyricsData)
        .select();

      if (error) throw error;
      
      console.log("Supabase Receipt - What actually saved:", data);

      if (!data || data.length === 0) {
        alert("Warning: The app tried to save, but the database returned an empty receipt!");
        return;
      }

      alert("Success! Your lyrics are saved to the database.");
    } catch (error: any) {
      console.error("Error saving lyrics:", error);
      alert("Uh oh, something went wrong: " + error.message);
    } finally {
      setIsSaving(false); 
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Lyrics Editor</h1>
      
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Type or paste your lyrics below:
        </label>
        
        {isLoading ? (
          <div className="w-full h-80 p-4 border border-gray-300 rounded-md mb-4 flex items-center justify-center text-gray-500">
            Loading your lyrics...
          </div>
        ) : (
          <textarea 
            className="w-full h-80 p-4 border border-gray-300 rounded-md mb-4 text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="e.g., [Verse 1]&#10;The sun goes down..."
            value={lyricsText}
            onChange={(e) => setLyricsText(e.target.value)}
          />
        )}
        
        <button 
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-md transition-colors"
        >
          {isSaving ? "Saving to Database..." : "Save Lyrics"}
        </button>
      </div>
    </div>
  );
}