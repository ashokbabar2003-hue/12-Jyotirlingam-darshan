import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

const VOLUME_KEY = "om-chant-volume";
const CHANT_URL = "/music/om-namah-shivaya.mp3";

interface AudioChantContextType {
  playing: boolean;
  loading: boolean;
  error: boolean;
  volume: number;
  setVolume: (vol: number) => void;
  toggle: () => void;
}

const AudioChantContext = createContext<AudioChantContextType | null>(null);

export function AudioChantProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [volume, setVolume] = useState(0.55);

  // Load saved volume preference
  useEffect(() => {
    try {
      const savedVol = localStorage.getItem(VOLUME_KEY);
      if (savedVol) {
        const v = Number(savedVol);
        if (!isNaN(v) && v >= 0 && v <= 1) {
          setVolume(v);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Sync volume with Audio Element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    try {
      localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      /* ignore */
    }
  }, [volume]);

  // Initialize HTML Audio element
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = volume;
    audio.src = CHANT_URL;

    audio.onwaiting = () => {
      setLoading(true);
    };

    audio.onplaying = () => {
      setLoading(false);
      setPlaying(true);
      setError(false);
    };

    audio.onpause = () => {
      setPlaying(false);
    };

    audio.onerror = (e) => {
      console.error("[AudioChant] Error playing audio:", e);
      setError(true);
      setLoading(false);
      setPlaying(false);
    };

    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      setLoading(true);
      setError(false);
      audio
        .play()
        .then(() => {
          setPlaying(true);
          setLoading(false);
        })
        .catch((err: unknown) => {
          console.error("[AudioChant] Audio play failed:", err);
          setError(true);
          setLoading(false);
          setPlaying(false);
        });
    }
  }, [playing]);

  return (
    <AudioChantContext.Provider value={{ playing, loading, error, volume, setVolume, toggle }}>
      {children}
    </AudioChantContext.Provider>
  );
}

export function useAudioChant() {
  const context = useContext(AudioChantContext);
  if (!context) {
    throw new Error("useAudioChant must be used within an AudioChantProvider");
  }
  return context;
}
