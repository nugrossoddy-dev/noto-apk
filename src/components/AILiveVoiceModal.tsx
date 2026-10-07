import React, { useState, useEffect, useRef } from 'react';
import { LiveAudioPlayer, floatTo16BitPCM, arrayBufferToBase64 } from '../utils/liveAudio';

interface AILiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userContextSummary: string;
  onSwitchToTextChat?: () => void;
}

export const AILiveVoiceModal: React.FC<AILiveVoiceModalProps> = ({
  isOpen,
  onClose,
  userContextSummary,
  onSwitchToTextChat,
}) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error' | 'idle'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcriptNotice, setTranscriptNotice] = useState<string>('Menghubungkan ke Gemini 3.8 Live API...');
  const [textInput, setTextInput] = useState('');

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
    setIsPermissionDenied(false);
    setErrorMessage('');
  };

  const startLiveSession = async () => {
    try {
      setStatus('connecting');
      setIsPermissionDenied(false);
      setErrorMessage('');
      setTranscriptNotice('Menghubungkan ke Gemini 3.8 Live API voice bridge...');
      audioPlayerRef.current = new LiveAudioPlayer();

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setTranscriptNotice('Menyiapkan audio mikrofon 16kHz deep flow...');
        if (userContextSummary) {
          ws.send(
            JSON.stringify({
              text: `[System Context: User agenda saat ini: ${userContextSummary}. Bicara dengan tenang, singkat, dan bahasa Indonesia yang ramah.]`,
            })
          );
        }
        await setupMicrophone(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.connected) {
            if (!isPermissionDenied) {
              setStatus('listening');
              setTranscriptNotice('Mendengarkan... Bicaralah secara santai dengan AI Coach Anda.');
            }
          }
          if (data.audio) {
            setStatus('speaking');
            setTranscriptNotice('AI Coach sedang berbicara...');
            audioPlayerRef.current?.playChunk(data.audio);
          }
          if (data.interrupted) {
            audioPlayerRef.current?.interrupt();
            setStatus('listening');
            setTranscriptNotice('Mendengarkan...');
          }
          if (data.error) {
            setStatus('error');
            setErrorMessage(data.error);
          }
        } catch (e) {
          console.warn('Live API response parsing notice:', e);
        }
      };

      ws.onerror = () => {
        setStatus('error');
        setErrorMessage('Tidak dapat terhubung ke audio socket Gemini Live API.');
      };

      ws.onclose = () => {
        if (status !== 'error') {
          setStatus('idle');
          setTranscriptNotice('Sesi suara selesai.');
        }
      };
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Gangguan koneksi audio');
    }
  };

  const setupMicrophone = async (ws: WebSocket) => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setStatus('error');
      setIsPermissionDenied(true);
      setErrorMessage('Browser ini tidak mendukung audio input mikrofon.');
      return;
    }

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
      setIsPermissionDenied(false);

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBuffer = floatTo16BitPCM(inputData);
        const base64Audio = arrayBufferToBase64(pcmBuffer);

        ws.send(JSON.stringify({ audio: base64Audio }));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      setStatus('listening');
      setTranscriptNotice('Mendengarkan... Bicaralah atau gunakan teks di bawah.');
    } catch (err: unknown) {
      // Tangani izin mikrofon yang ditolak secara ramah tanpa crash
      setIsPermissionDenied(true);
      setStatus('error');
      setErrorMessage(
        'Akses mikrofon belum diizinkan atau dinonaktifkan di peramban. Anda dapat mengaktifkannya di pengaturan peramban atau beralih ke obrolan teks.'
      );
    }
  };

  const handleRetryPermission = async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      await setupMicrophone(wsRef.current);
    } else {
      startLiveSession();
    }
  };

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ text: textInput.trim() }));
    setTranscriptNotice(`Pesan terkirim: "${textInput.trim()}"`);
    setTextInput('');
    setStatus('speaking');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-surface-container-high">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'error' ? 'bg-error' : 'bg-secondary animate-pulse'
              }`}
            ></span>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-on-surface">
              Gemini 3.8 Live Voice
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Visual Zen Soundwave / Breathing Orb */}
        <div className="relative w-32 h-32 flex items-center justify-center my-1">
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
                : status === 'error'
                ? 'bg-surface-container-high text-error'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[32px]">
              {status === 'speaking'
                ? 'graphic_eq'
                : status === 'listening'
                ? 'mic'
                : status === 'error'
                ? 'mic_off'
                : 'hourglass_top'}
            </span>
          </div>
        </div>

        {/* Status text */}
        <div className="space-y-1.5 max-w-xs">
          <h3 className="text-[16px] font-semibold text-on-surface tracking-tight">
            {status === 'speaking'
              ? 'AI Coach Sedang Berbicara'
              : status === 'listening'
              ? 'Mendengarkan Suara Anda'
              : status === 'connecting'
              ? 'Menghubungkan Saluran Suara'
              : status === 'error'
              ? 'Akses Mikrofon Diperlukan'
              : 'Sesi Suara Siap'}
          </h3>
          <p className="text-[12px] text-on-surface-variant leading-relaxed">
            {errorMessage || transcriptNotice}
          </p>
        </div>

        {/* Jika izin mikrofon belum aktif / error */}
        {isPermissionDenied && (
          <div className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container-highest space-y-2 text-left">
            <div className="flex items-start space-x-2">
              <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 pt-0.5">
                info
              </span>
              <p className="text-[11px] text-on-surface-variant leading-snug">
                Klik ikon gembok/pengaturan di address bar browser untuk mengizinkan mikrofon, atau gunakan tombol di bawah:
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={handleRetryPermission}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-secondary text-white text-[11px] font-semibold hover:bg-[#2d523e] transition-colors cursor-pointer text-center"
              >
                Coba Izin Lagi
              </button>
              {onSwitchToTextChat && (
                <button
                  type="button"
                  onClick={onSwitchToTextChat}
                  className="flex-1 py-1.5 px-2.5 rounded-lg border border-surface-container-highest bg-white text-on-surface text-[11px] font-semibold hover:bg-surface-container transition-colors cursor-pointer text-center"
                >
                  Beralih ke Chat
                </button>
              )}
            </div>
          </div>
        )}

        {/* Fallback Text Input (bisa tetap berinteraksi dengan Live API lewat teks) */}
        <form onSubmit={handleSendTextMessage} className="w-full flex items-center space-x-1.5">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Atau ketik pesan untuk AI Coach..."
            className="flex-1 px-3 py-2 rounded-full border border-surface-container-highest bg-surface-container-low/40 focus:bg-white text-[12px] text-on-surface outline-none focus:border-on-surface"
          />
          <button
            type="submit"
            disabled={!textInput.trim()}
            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-30 cursor-pointer"
            title="Kirim pesan teks ke Live API"
          >
            <span className="material-symbols-outlined text-[15px]">send</span>
          </button>
        </form>

        {/* Controls */}
        <div className="flex items-center space-x-4 pt-1">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-11 h-11 rounded-full border border-surface-container-highest flex items-center justify-center transition-colors cursor-pointer ${
              isMuted
                ? 'bg-error/10 text-error border-error/30'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
            }`}
            title={isMuted ? 'Aktifkan Mikrofon' : 'Bisukan Mikrofon'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isMuted ? 'mic_off' : 'mic'}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-full bg-primary text-on-primary text-[13px] font-medium hover:bg-[#222222] transition-transform active:scale-95 flex items-center space-x-2 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">call_end</span>
            <span>Tutup Sesi</span>
          </button>
        </div>

        <div className="pt-1 text-[10px] uppercase tracking-wider text-outline">
          Low-latency real-time voice streaming with model Zephyr
        </div>
      </div>
    </div>
  );
};
