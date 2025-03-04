class SpeechService {
  constructor() {
    this.voices = null;
    this.currentUtterance = null;
    this.queue = [];
    this.speaking = false;
    this.initialized = false;
    
    // Try to initialize voices if speech synthesis is available
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.initVoices();
      
      // Handle dynamic voice loading
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoices();
      };
    }
  }
  
  // Initialize available voices
  initVoices() {
    if (window.speechSynthesis) {
      this.voices = window.speechSynthesis.getVoices();
      this.initialized = true;
      
      // Select a preferred voice
      this.preferredVoice = this.voices.find(voice => 
        voice.lang === 'en-US' && voice.name.includes('Google') && !voice.name.includes('Female')
      ) || this.voices.find(voice => 
        voice.lang === 'en-US'
      );
    }
  }
  
  // Speak text
  speak(text, options = {}) {
    // If speech synthesis is not available, just return
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis not available');
      return;
    }
    
    // Make sure voices are initialized
    if (!this.initialized) {
      this.initVoices();
    }
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    
    // Apply options
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    
    // Add to queue
    this.queue.push(utterance);
    
    // Process queue if not already speaking
    if (!this.speaking) {
      this.processQueue();
    }
  }
  
  // Process the speech queue
  processQueue() {
    if (this.queue.length === 0) {
      this.speaking = false;
      return;
    }
    
    this.speaking = true;
    
    // Get the next utterance
    const utterance = this.queue.shift();
    this.currentUtterance = utterance;
    
    // Add event listener for when speech ends
    utterance.onend = () => {
      this.currentUtterance = null;
      this.processQueue();
    };
    
    // Add event listener for errors
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.currentUtterance = null;
      this.processQueue();
    };
    
    // Speak the utterance
    window.speechSynthesis.speak(utterance);
  }
  
  // Stop speaking
  stop() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.queue = [];
      this.speaking = false;
      this.currentUtterance = null;
    }
  }
  
  // Pause speaking
  pause() {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }
  
  // Resume speaking
  resume() {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }
}

export default SpeechService;

