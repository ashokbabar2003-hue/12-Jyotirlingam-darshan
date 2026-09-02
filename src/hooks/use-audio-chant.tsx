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

/**
 * Sacred Om Drone Synthesizer using Web Audio API.
 * Generates the cosmic 136.1 Hz (Om / C#3) tanpura & harmonic meditation drone.
 */
class OmChantSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isRunning = false;
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private lfo: OscillatorNode | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    } catch {
      /* ignore audio context restrictions */
    }
  }

  public start(volume: number) {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    this.stop(); // Clean any previous nodes

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Master Gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume * 0.45), now + 1.2);
    this.masterGain.connect(ctx.destination);

    // Warm Lowpass Filter
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(650, now);
    filter.Q.setValueAtTime(2.5, now);
    filter.connect(this.masterGain);

    // Harmonics for Sacred 136.1 Hz (Om frequency)
    const harmonics = [
      { freq: 136.1, type: "sine" as OscillatorType, gain: 0.5 }, // Fundamental Om (Sa)
      { freq: 204.15, type: "sine" as OscillatorType, gain: 0.3 }, // Pa (Fifth)
      { freq: 272.2, type: "triangle" as OscillatorType, gain: 0.25 }, // Octave
      { freq: 68.05, type: "sine" as OscillatorType, gain: 0.4 }, // Sub-bass resonance
      { freq: 408.3, type: "sine" as OscillatorType, gain: 0.15 }, // Shimmer
    ];

    this.oscillators = [];
    this.gains = [];

    harmonics.forEach((h) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = h.type;
      osc.frequency.setValueAtTime(h.freq, now);

      oscGain.gain.setValueAtTime(h.gain, now);
      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.start(now);
      this.oscillators.push(osc);
      this.gains.push(oscGain);
    });

    // Gentle Breathing LFO Modulation (simulating the meditative rise & fall of Om)
    try {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.08, now); // ~12.5s meditative breath cycle
      lfoGain.gain.setValueAtTime(120, now);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(now);
      this.lfo = lfo;
    } catch {
      /* ignore */
    }

    this.isRunning = true;
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(Math.max(0.001, volume * 0.45), now + 0.1);
    }
  }

  public stop() {
    if (!this.isRunning && !this.oscillators.length) return;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      try {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      } catch {
        /* ignore */
      }
    }

    const currentOscs = [...this.oscillators];
    const currentLfo = this.lfo;

    setTimeout(() => {
      currentOscs.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          /* ignore */
        }
      });
      if (currentLfo) {
        try {
          currentLfo.stop();
          currentLfo.disconnect();
        } catch {
          /* ignore */
        }
      }
    }, 900);

    this.oscillators = [];
    this.gains = [];
    this.lfo = null;
    this.isRunning = false;
  }
}

export function AudioChantProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<OmChantSynthesizer | null>(null);
  const useSynthFallback = useRef(false);

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
    synthRef.current = new OmChantSynthesizer();
  }, []);

  // Sync volume with Audio Element and Synthesizer
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (synthRef.current) {
      synthRef.current.setVolume(volume);
    }
    try {
      localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      /* ignore */
    }
  }, [volume]);

  // Setup HTML Audio element lazily and safely
  const getAudioElement = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (audioRef.current) return audioRef.current;

    try {
      const audio = new Audio();
      audio.loop = true;
      audio.preload = "none";
      audio.volume = volume;
      audio.src = CHANT_URL;

      audio.onwaiting = () => {
        setLoading(true);
      };

      audio.onplaying = () => {
        setLoading(false);
        setPlaying(true);
        setError(false);
        useSynthFallback.current = false;
      };

      audio.onpause = () => {
        if (!useSynthFallback.current) {
          setPlaying(false);
        }
      };

      audio.onerror = () => {
        // Fallback to high-definition harmonic Web Audio synthesis without failing
        useSynthFallback.current = true;
        setLoading(false);
        if (playing && synthRef.current) {
          synthRef.current.start(volume);
        }
      };

      audioRef.current = audio;
      return audio;
    } catch {
      useSynthFallback.current = true;
      return null;
    }
  }, [volume, playing]);

  const toggle = useCallback(() => {
    if (playing) {
      // Stop playback
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (synthRef.current) {
        synthRef.current.stop();
      }
      setPlaying(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    // If fallback is already active or audio element failed before
    if (useSynthFallback.current) {
      if (synthRef.current) {
        synthRef.current.start(volume);
        setPlaying(true);
        setLoading(false);
      }
      return;
    }

    const audio = getAudioElement();
    if (!audio) {
      // Direct to synth
      useSynthFallback.current = true;
      if (synthRef.current) {
        synthRef.current.start(volume);
        setPlaying(true);
        setLoading(false);
      }
      return;
    }

    audio
      .play()
      .then(() => {
        setPlaying(true);
        setLoading(false);
      })
      .catch(() => {
        // Switch gracefully to Web Audio harmonic chant synthesizer
        useSynthFallback.current = true;
        if (synthRef.current) {
          synthRef.current.start(volume);
          setPlaying(true);
          setLoading(false);
          setError(false);
        } else {
          setPlaying(false);
          setLoading(false);
          setError(true);
        }
      });
  }, [playing, volume, getAudioElement]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (synthRef.current) {
        synthRef.current.stop();
      }
    };
  }, []);

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
