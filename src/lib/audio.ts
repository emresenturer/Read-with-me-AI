export class AudioStreamer {
  private audioCtx: AudioContext | null = null;
  private nextTime: number = 0;

  constructor() {
    this.init();
  }

  private init() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("AudioContext is not supported in this browser.");
      return;
    }
    try {
      this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
    } catch (e) {
      console.warn("Could not set sampleRate to 24000, using default.");
      this.audioCtx = new AudioContextClass();
    }
    this.nextTime = this.audioCtx.currentTime;
  }

  async playBase64(base64: string) {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }

    const buffer = this.audioCtx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioCtx.destination);

    const currentTime = this.audioCtx.currentTime;
    if (this.nextTime < currentTime) {
      this.nextTime = currentTime;
    }
    source.start(this.nextTime);
    this.nextTime += buffer.duration;
  }

  isPlaying(): boolean {
    if (!this.audioCtx) return false;
    // Add a small buffer (0.1s) to make the visualizer feel more natural
    return this.nextTime > this.audioCtx.currentTime + 0.1;
  }

  stop() {
    if (this.audioCtx) {
      this.audioCtx.close();
      this.init();
    }
  }
}

export class AudioRecorder {
  private audioCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  public analyser: AnalyserNode | null = null;

  async start(onData: (base64: string) => void) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("AudioContext is not supported in this browser.");
    }
    try {
      this.audioCtx = new AudioContextClass({ sampleRate: 16000 });
    } catch (e) {
      console.warn("Could not set sampleRate to 16000, using default.");
      this.audioCtx = new AudioContextClass();
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      }
    });

    this.source = this.audioCtx.createMediaStreamSource(this.stream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;

    const workletCode = `
      class PCMProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input && input.length > 0) {
            const channelData = input[0];
            const pcm16 = new Int16Array(channelData.length);
            for (let i = 0; i < channelData.length; i++) {
              let s = Math.max(-1, Math.min(1, channelData[i]));
              pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
          }
          return true;
        }
      }
      registerProcessor('pcm-processor', PCMProcessor);
    `;

    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    await this.audioCtx.audioWorklet.addModule(url);

    this.processor = new AudioWorkletNode(this.audioCtx, 'pcm-processor');
    this.processor.port.onmessage = (e) => {
      const buffer = e.data;
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      onData(base64);
    };

    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = 0;

    this.source.connect(this.analyser);
    this.analyser.connect(this.processor);
    this.processor.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
  }

  getVolume(): number {
    if (!this.analyser) return 0;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length;
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
