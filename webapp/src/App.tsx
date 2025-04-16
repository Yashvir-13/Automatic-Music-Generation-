import React, { useState, useEffect, useCallback } from 'react';
import { Music, Upload, Loader2, PlayCircle, PauseCircle, StopCircle } from 'lucide-react';
import { Midi } from '@tonejs/midi';
import * as Tone from 'tone';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedMidiUrl, setGeneratedMidiUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState<Tone.PolySynth | null>(null);

  useEffect(() => {
    const newSynth = new Tone.PolySynth().toDestination();
    setSynth(newSynth); // Update synth state
  
    return () => {
      newSynth.dispose();
    };
  }, []);

  // Custom cursor movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generate floating notes
  const createNote = useCallback(() => {
    const notes = ['♪', '♫', '♬'];
    const note = notes[Math.floor(Math.random() * notes.length)];
    const opacity = Math.random() * 0.5 + 0.3;
    const left = Math.random() * 100;
    const animationDuration = Math.random() * 4 + 3;
    const delay = Math.random() * 2;

    return {
      symbol: note,
      style: {
        left: `${left}%`,
        opacity,
        animationDuration: `${animationDuration}s`,
        animationDelay: `${delay}s`,
      },
    };
  }, []);

  const [notes] = useState(() => Array.from({ length: 20 }, createNote));

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'audio/midi' || selectedFile.type === 'audio/mid')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid MIDI file');
      setFile(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate music';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (err) {
          console.error('Error parsing error response:', err);
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setGeneratedMidiUrl(url);
      setIsPlaying(false);
    } catch (error) {
      console.error('Error generating music:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  let midiPart: any = null; // <- Declare outside the component or in state if needed

  const playMidi = async () => {
    if (!generatedMidiUrl || !synth) return;
  
    try {
      await Tone.start();
      const response = await fetch(generatedMidiUrl);
      const arrayBuffer = await response.arrayBuffer();
      const midi = new Midi(arrayBuffer);
  
      // Stop previous transport & clear events
      Tone.Transport.stop();
      Tone.Transport.cancel();
  
      if (midiPart) {
        midiPart.dispose();
        midiPart = null;
      }
  
      // Set BPM and Time Signature if available
      Tone.Transport.bpm.value = midi.header.tempos[0]?.bpm || 120;
      if (midi.header.timeSignatures.length > 0) {
        const ts = midi.header.timeSignatures[0];
        Tone.Transport.timeSignature = [ts.numerator, ts.denominator];
      }
  
      // Collect all notes across tracks
      const allNotes = midi.tracks.flatMap(track => track.notes);
  
      // Create a Tone.Part to schedule all notes relative to Transport
      midiPart = new Tone.Part((time, note) => {
        synth.triggerAttackRelease(
          note.name,
          note.duration,
          time,
          note.velocity
        );
      }, allNotes.map(note => [note.time, note]));
  
      midiPart.start(0); // Start at beginning
      Tone.Transport.start();
  
      setIsPlaying(true);
  
    } catch (error) {
      console.error('Error playing MIDI:', error);
      setError('Error playing MIDI file');
    }
  };
  
  const stopPlayback = () => {
    if (synth) {
      synth.releaseAll();
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setIsPlaying(false);
    }
  };
  const handleMidiError = (error: Error) => {
    console.error('MIDI Error:', error);
    setError('Failed to load or parse MIDI file');
  };
  
  // Cleanup URL when component unmounts or new URL is generated
  useEffect(() => {
    return () => {
      if (generatedMidiUrl) {
        URL.revokeObjectURL(generatedMidiUrl);
      }
    };
  }, [generatedMidiUrl]);

  return (
    <>
      <div className="dreamy-background" />
      <div 
        className="custom-cursor"
        style={{ 
          transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)`,
        }}
      >
        ♪
      </div>
      <div className="musical-notes">
        {notes.map((note, index) => (
          <div
            key={index}
            className="note"
            style={note.style}
          >
            {note.symbol}
          </div>
        ))}
      </div>
      <div className="relative min-h-screen text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-center mb-12">
              <Music className="w-12 h-12 mr-4" />
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0066CC] via-[#00A67E] to-[#0099FF]">
                AI Music Generator
              </h1>
            </div>

            {/* Main Content */}
            <div className="bg-[#0A192F]/30 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/5">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-[#00A67E]/50 transition-colors duration-300">
                  <input
                    type="file"
                    accept=".midi,.mid"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 mb-4" />
                    <span className="text-lg mb-2">Drop your MIDI file here</span>
                    <span className="text-sm text-gray-400">
                      or click to browse (only .midi files)
                    </span>
                  </label>
                  {file && (
                    <div className="mt-4 text-[#00CC66]">
                      Selected: {file.name}
                    </div>
                  )}
                  {error && (
                    <div className="mt-4 text-red-500">
                      {error}
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <button
                  type="submit"
                  disabled={!file || isLoading}
                  className="w-full bg-gradient-to-r from-[#0066CC] via-[#00A67E] to-[#0099FF] py-3 px-6 rounded-lg font-semibold 
                           hover:from-[#4169E1] hover:via-[#2E8B57] hover:to-[#0099FF] transition-all duration-300 disabled:opacity-50
                           disabled:cursor-not-allowed flex items-center justify-center border border-white/10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'Generate Music'
                  )}
                </button>
              </form>

              {/* Generated Music Player */}
              {generatedMidiUrl && (
                <div className="mt-8 p-6 bg-[#1A1A1A]/40 rounded-lg border border-white/10">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <PlayCircle className="mr-2" />
                    Generated Music
                  </h2>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={isPlaying ? stopPlayback : playMidi}
                      className="flex items-center px-4 py-2 rounded-lg bg-[#00A67E] hover:bg-[#00CC66] transition-colors"
                    >
                      {isPlaying ? (
                        <>
                          <StopCircle className="w-5 h-5 mr-2" />
                          Stop
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-5 h-5 mr-2" />
                          Play
                        </>
                      )}
                    </button>
                  </div>
                  <a
                    href={generatedMidiUrl}
                    download="generated-music.midi"
                    className="mt-4 inline-block text-sm text-[#00A67E] hover:text-[#00CC66]"
                  >
                    Download MIDI file
                  </a>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-8 text-center text-gray-400 text-sm">
              <p>
                Upload a MIDI file and our AI will generate a new musical piece
                inspired by your input.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;