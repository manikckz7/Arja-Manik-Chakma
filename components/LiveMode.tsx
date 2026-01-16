
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

const LiveMode: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Utility functions for audio encoding/decoding
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  }

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      if (videoRef.current) videoRef.current.srcObject = stream;

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            
            // Microphone stream
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);

            // Video frames stream
            const frameInterval = setInterval(() => {
              if (videoRef.current && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                canvasRef.current.width = videoRef.current.videoWidth / 2;
                canvasRef.current.height = videoRef.current.videoHeight / 2;
                ctx?.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];
                sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } }));
              }
            }, 1000);
            (sessionRef as any).currentFrameInterval = frameInterval;
          },
          onmessage: async (message: LiveServerMessage) => {
            // Audio output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            // Transcriptions
            if (message.serverContent?.inputTranscription) {
               setTranscriptions(prev => [...prev.slice(-10), { role: 'user', text: message.serverContent?.inputTranscription?.text || '' }]);
            }
            if (message.serverContent?.outputTranscription) {
               setTranscriptions(prev => [...prev.slice(-10), { role: 'ai', text: message.serverContent?.outputTranscription?.text || '' }]);
            }
          },
          onerror: (e) => console.error("Live Error", e),
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are Astra, a sophisticated AI entity capable of seeing and hearing. Respond concisely and with a calm, intellectual tone.'
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      clearInterval((sessionRef as any).currentFrameInterval);
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setIsActive(false);
    setIsConnecting(false);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-black p-6 gap-6">
      <div className="flex-1 relative flex flex-col">
        <div className="flex-1 bg-gray-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative group">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" 
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
            {!isActive ? (
              <button 
                onClick={startSession}
                disabled={isConnecting}
                className="group flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-blue-400 hover:scale-105 transition-all shadow-2xl disabled:opacity-50"
              >
                {isConnecting ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent animate-spin rounded-full" />
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                )}
                <span>{isConnecting ? 'ESTABLISHING LINK...' : 'INITIATE LIVE SYNC'}</span>
              </button>
            ) : (
              <button 
                onClick={stopSession}
                className="px-8 py-4 bg-red-600/90 hover:bg-red-500 text-white rounded-full font-bold transition-all shadow-2xl flex items-center gap-3"
              >
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                TERMINATE SESSION
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full md:w-96 flex flex-col gap-4">
        <div className="flex-1 glass-panel rounded-3xl p-6 flex flex-col">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Neural Feedback</h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {transcriptions.length === 0 ? (
              <div className="text-gray-600 italic text-sm text-center mt-20">
                Waiting for vocal input stream...
              </div>
            ) : (
              transcriptions.map((t, i) => (
                <div key={i} className={`p-3 rounded-xl text-sm ${t.role === 'user' ? 'bg-blue-500/10 border border-blue-500/20 ml-6 text-blue-200' : 'bg-gray-800 border border-white/5 mr-6 text-gray-300'}`}>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">{t.role === 'user' ? 'YOU' : 'ASTRA'}</span>
                  {t.text}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="h-40 glass-panel rounded-3xl p-6 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-1 h-8">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1 bg-blue-500 rounded-full transition-all duration-300 ${isActive ? 'animate-pulse' : 'h-1'}`}
                style={{ height: isActive ? `${Math.random() * 100}%` : '4px', animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
          <span className="text-[10px] font-bold text-blue-400 tracking-tighter uppercase">PCM Stream Active • 16kHz</span>
        </div>
      </div>
    </div>
  );
};

export default LiveMode;
