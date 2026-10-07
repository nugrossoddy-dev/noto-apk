import React, { useState, useEffect, useRef } from 'react';
import { LiveAudioPlayer, floatTo16BitPCM, arrayBufferToBase64 } from '../utils/liveAudio';

interface AILiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userContextSummary: string;
}

export const AILiveVoiceModal: React.FC<AILiveVoiceModalProps> = ({
  isOpen,
  onClose,
  userContextSummary,
}) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error' | 'idle'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [transcriptNotice, setTranscriptNotice] = useState<string>('Connecting to Gemini 3.8 Live API...');

  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    startLiveSession();

    return () => {
      cleanup();
    };
  }, [isOpen]);

  const cleanup = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.close();
      audioPlayerRef.current = null;
    }
    setStatus('idle');
  };

  const startLiveSession = async () => {
    try {
      setStatus('connecting');
      setTranscriptNotice('Connecting to Gemini 3.8 Live API voice bridge...');
      audioPlayerRef.current = new LiveAudioPlayer();

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setTranscriptNotice('Microphone calibrating for 16kHz deep flow audio...');
        // Send initial user tasks context to prime the model
        if (userContextSummary) {
          ws.send(
            JSON.stringify({
              text: `[System Context: User current agenda: ${userContextSummary}. Speak briefly and gently.]`,
            })
          );
        }
        await setupMicrophone(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.connected) {
            setStatus('listening');
            setTranscriptNotice('Listening... Speak naturally with your AI coach.');
          }
          if (data.audio) {
            setStatus('speaking');
            setTranscriptNotice('AI Coach speaking...');
            audioPlayerRef.current?.playChunk(data.audio);
          }
          if (data.interrupted) {
            audioPlayerRef.current?.interrupt();
            setStatus('listening');
            setTranscriptNotice('Listening...');
          }
          if (data.error) {
            setStatus('error');
            setErrorMessage(data.error);
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        setStatus('error');
        setErrorMessage('Failed to connect to Live API audio socket.');
      };

      ws.onclose = () => {
        if (status !== 'error') {
          setStatus('idle');
          setTranscriptNotice('Voice session ended.');
        }
      };
    } catch (err: unknown) {
      console.error('Error starting live session:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Unknown audio error');
    }
  };

  const setupMicrophone = async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      // Buffer size 4096 gives smooth 256ms audio slices
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        if (ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBuffer = floatTo16BitPCM(inputData);
        const base64Audio = arrayBufferToBase64(pcmBuffer);

        ws.send(JSON.stringify({ audio: base64Audio }));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
    } catch (err: unknown) {
      console.error('Microphone permission or audio capture error:', err);
      setStatus('error');
      setErrorMessage(
        'Could not access microphone. Please grant audio permissions to converse via Live API.'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-surface-container-high">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-on-surface">
              Gemini 3.8 Live API
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Visual Zen Soundwave / Breathing Orb */}
        <div className="relative w-36 h-36 flex items-center justify-center my-2">
          {/* Subtle pulsating rings */}
          <div
            className={`absolute inset-0 rounded-full bg-secondary/15 transition-all duration-700 ${
              status === 'speaking'
                ? 'scale-110 opacity-70 animate-ping'
                : status === 'listening'
                ? 'scale-105 opacity-40 animate-pulse'
                : 'scale-90 opacity-20'
            }`}
          />
          <div
            className={`absolute inset-3 rounded-full border border-secondary/40 transition-transform duration-500 ${
              status === 'speaking' ? 'scale-105' : 'scale-95'
            }`}
          />

          {/* Central orb */}
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
              status === 'speaking'
                ? 'bg-secondary text-white ring-4 ring-secondary/30'
                : status === 'listening'
                ? 'bg-[#191919] text-white'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[32px]">
              {status === 'speaking'
                ? 'graphic_eq'
                : status === 'listening'
                ? 'mic'
                : status === 'error'
                ? 'error_outline'
                : 'hourglass_top'}
            </span>
          </div>
        </div>

        {/* Status text */}
        <div className="space-y-1.5 max-w-xs">
          <h3 className="text-[16px] font-semibold text-on-surface tracking-tight">
            {status === 'speaking'
              ? 'AI Coach Speaking'
              : status === 'listening'
              ? 'Listening to You'
              : status === 'connecting'
              ? 'Opening Audio Stream'
              : status === 'error'
              ? 'Connection Issue'
              : 'Voice Session Ready'}
          </h3>
          <p className="text-[12px] text-on-surface-variant leading-relaxed">
            {errorMessage || transcriptNotice}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4 pt-1">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full border border-surface-container-highest flex items-center justify-center transition-colors ${
              isMuted
                ? 'bg-error/10 text-error border-error/30'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isMuted ? 'mic_off' : 'mic'}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-12 px-6 rounded-full bg-primary text-on-primary text-[14px] font-medium hover:bg-[#222222] transition-transform active:scale-95 flex items-center space-x-2"
          >
            <span className="material-symbols-outlined text-[18px]">call_end</span>
            <span>End Call</span>
          </button>
        </div>

        <div className="pt-2 text-[10px] uppercase tracking-wider text-outline">
          Low-latency real-time voice streaming with model Zephyr
        </div>
      </div>
    </div>
  );
};
