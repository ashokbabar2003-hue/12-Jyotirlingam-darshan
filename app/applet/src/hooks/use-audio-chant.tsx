import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);
  const synthOscRef = useRef<OscillatorNode | null>(null);
  const synthOsc2Ref = useRef<OscillatorNode | null>(null);

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [volume, setVolume] = useState(0.55);
  const [useSynth, setUseSynth] = useState(false);

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

  // Sync volume with Audio Element and Synth
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (synthGainRef.current && audioCtxRef.current) {
      synthGainRef.current.gain.setValueAtTime(volume * 0.15, audioCtxRef.current.currentTime);
    }
    try {
      localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      /* ignore */
    }
  }, [volume]);

  const stopSynth = () => {
    try {
      if (synthGainRef.current && audioCtxRef.current) {
        synthGainRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      }
      if (synthOscRef.current) {
        synthOscRef.current.stop();
        synthOscRef.current.disconnect();
        synthOscRef.current = null;
      }
      if (synthOsc2Ref.current) {
        synthOsc2Ref.current.stop();
        synthOsc2Ref.current.disconnect();
        synthOsc2Ref.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch {
      /* ignore */
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopSynth();
    };
  }, []);

  const startSynthChant = useCallback(() => {
    try {
      stopSynth();
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
      masterGain.connect(ctx.destination);
      synthGainRef.current = masterGain;

      // Om frequency: 136.1 Hz (C#)
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(136.1, ctx.currentTime);

      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(272.2, ctx.currentTime); // 1st harmonic

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.7, ctx.currentTime);

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.3, ctx.currentTime);

      osc1.connect(oscGain);
      osc2.connect(osc2Gain);
      oscGain.connect(masterGain);
      osc2Gain.connect(masterGain);

      osc1.start();
      osc2.start();

      synthOscRef.current = osc1;
      synthOsc2Ref.current = osc2;

      setPlaying(true);
      setLoading(false);
      setError(false);
      setUseSynth(true);
      return true;
    } catch (e) {
      console.warn("[AudioChant] Web Audio Synth fallback failed:", e);
      return false;
    }
  }, [volume]);

  const toggle = useCallback(() => {
    if (playing) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      stopSynth();
      setPlaying(false);
      return;
    }

    setLoading(true);
    setError(false);

    if (useSynth) {
      const ok = startSynthChant();
      if (!ok) setError(true);
      return;
    }

    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audio.loop = true;
      audio.preload = "none";
      audio.volume = volume;

      audio.onwaiting = () => setLoading(true);
      audio.onplaying = () => {
        setLoading(false);
        setPlaying(true);
        setError(false);
      };
      audio.onpause = () => setPlaying(false);
      audio.onerror = () => {
        const errMsg = audio?.error ? `MediaError code ${audio.error.code}` : "Audio element error";
        console.warn("[AudioChant] MP3 play failed, using Om synth chant:", errMsg);
        const synthOk = startSynthChant();
        if (!synthOk) {
          setError(true);
          setLoading(false);
          setPlaying(false);
        }
      };

      audioRef.current = audio;
    }

    audio.src = CHANT_URL;
    audio
      .play()
      .then(() => {
        setPlaying(true);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const errStr = err instanceof Error ? err.message : String(err);
        console.warn("[AudioChant] MP3 play blocked or failed, using Om synth chant:", errStr);
        const synthOk = startSynthChant();
        if (!synthOk) {
          setError(true);
          setLoading(false);
          setPlaying(false);
        }
      });
  }, [playing, useSynth, volume, startSynthChant]);

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
