export type AssistantState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

export interface VoiceControllerCallbacks {
  onStateChange: (state: AssistantState) => void;
  onTranscript: (text: string, isFinal: boolean) => void;
  onResponse: (response: string) => void;
  onAudioLevel: (level: number) => void; // 0 to 1
}

export class JarvisVoiceController {
  private state: AssistantState = 'IDLE';
  private callbacks: VoiceControllerCallbacks;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isSimulatedTalking: boolean = false;
  private animFrameId: number | null = null;
  private simVolume: number = 0;

  constructor(callbacks: VoiceControllerCallbacks) {
    this.callbacks = callbacks;
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis || null;
      this.initSpeechRecognition();
    }
  }

  private initSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.setState('LISTENING');
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        this.callbacks.onTranscript(text, !!finalTranscript);

        if (finalTranscript) {
          this.processUserQuery(finalTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error', event.error);
        if (this.state === 'LISTENING') {
          this.setState('IDLE');
        }
      };

      this.recognition.onend = () => {
        if (this.state === 'LISTENING') {
          this.setState('IDLE');
        }
      };
    }
  }

  public setState(newState: AssistantState) {
    this.state = newState;
    this.callbacks.onStateChange(newState);

    if (newState === 'IDLE' || newState === 'THINKING') {
      this.stopMicAudioAnalysis();
    }
  }

  public getState(): AssistantState {
    return this.state;
  }

  public async startListening() {
    if (this.state === 'SPEAKING') {
      this.stopSpeaking();
    }

    this.setState('LISTENING');
    await this.startMicAudioAnalysis();

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (err) {
        console.warn('Recognition already started or error:', err);
      }
    } else {
      console.log('Web Speech API not supported; using audio input simulation');
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.stopMicAudioAnalysis();
    if (this.state === 'LISTENING') {
      this.setState('IDLE');
    }
  }

  private async startMicAudioAnalysis() {
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
        }
      }

      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (this.audioContext) {
          const source = this.audioContext.createMediaStreamSource(this.micStream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 64;
          source.connect(this.analyser);
          this.loopAudioAnalysis();
        }
      }
    } catch (err) {
      console.warn('Microphone access denied or error:', err);
      this.startSimulatedAudioLoop();
    }
  }

  private stopMicAudioAnalysis() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private loopAudioAnalysis = () => {
    if (!this.analyser || this.state !== 'LISTENING') return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    const normalizedLevel = Math.min(1, avg / 128); // 0 to 1

    this.callbacks.onAudioLevel(normalizedLevel);

    this.animFrameId = requestAnimationFrame(this.loopAudioAnalysis);
  };

  private startSimulatedAudioLoop() {
    const simLoop = () => {
      if (this.state === 'LISTENING' || this.state === 'SPEAKING' || this.isSimulatedTalking) {
        this.simVolume += (Math.random() * 0.4 - 0.2);
        this.simVolume = Math.max(0.2, Math.min(0.95, this.simVolume));
        this.callbacks.onAudioLevel(this.simVolume);
        this.animFrameId = requestAnimationFrame(simLoop);
      } else {
        this.callbacks.onAudioLevel(0.05);
      }
    };
    simLoop();
  }

  public processUserQuery(query: string) {
    this.setState('THINKING');
    this.callbacks.onTranscript(query, true);

    setTimeout(() => {
      const response = this.generateJarvisReply(query);
      this.callbacks.onResponse(response);
      this.speak(response);
    }, 1200);
  }

  public generateJarvisReply(query: string): string {
    const q = query.toLowerCase();
    if (q.includes('status') || q.includes('system')) {
      return "All core systems operational, sir. GSAP canvas engines running at 60 FPS with full color spectrum output.";
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('greetings')) {
      return "Greetings, sir. I am Jarvis. How may I assist your voice interface today?";
    }
    if (q.includes('blob') || q.includes('design') || q.includes('animation')) {
      return "I am rendered using a 32-color radial gradient canvas particle system, morphed dynamically in response to your voice input.";
    }
    if (q.includes('who are you')) {
      return "I am Jarvis, your AI voice assistant powered by neural audio dynamics and interactive canvas visualizers.";
    }
    return `Understood. Processing your request regarding "${query}". I am ready to perform next directives.`;
  }

  public speak(text: string) {
    this.stopSpeaking();
    this.setState('SPEAKING');
    this.isSimulatedTalking = true;
    this.startSimulatedAudioLoop();

    if (this.synthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = this.synthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David') || v.lang.startsWith('en')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        this.isSimulatedTalking = false;
        this.setState('IDLE');
        this.callbacks.onAudioLevel(0);
      };

      utterance.onerror = () => {
        this.isSimulatedTalking = false;
        this.setState('IDLE');
        this.callbacks.onAudioLevel(0);
      };

      this.synthesis.speak(utterance);
    } else {
      const talkDuration = Math.min(6000, Math.max(2500, text.length * 70));
      setTimeout(() => {
        this.isSimulatedTalking = false;
        this.setState('IDLE');
        this.callbacks.onAudioLevel(0);
      }, talkDuration);
    }
  }

  public stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.isSimulatedTalking = false;
  }
}
