import { useState, useEffect, useCallback } from "react";
import Voice, {
  SpeechErrorEvent,
  SpeechResultsEvent,
} from "@react-native-voice/voice";
import { Platform, PermissionsAndroid, NativeEventEmitter, NativeModules } from 'react-native';

interface IState {
  recognized: string;
  pitch: string;
  error: string;
  end: string;
  started: string;
  results: string[];
  partialResults: string[];
  isRecording: boolean;
  hasPermission: boolean;
  isAvailable: boolean;
  isInitialized: boolean;
}

export const useVoiceRecognition = () => {
  const [state, setState] = useState<IState>({
    recognized: "",
    pitch: "",
    error: "",
    end: "",
    started: "",
    results: [],
    partialResults: [],
    isRecording: false,
    hasPermission: false,
    isAvailable: false,
    isInitialized: false
  });

  const resetState = useCallback(() => {
    setState((prevState) => ({
      recognized: "",
      pitch: "",
      error: "",
      started: "",
      results: [],
      partialResults: [],
      end: "",
      isRecording: false,
      hasPermission: prevState.hasPermission,
      isAvailable: prevState.isAvailable,
      isInitialized: prevState.isInitialized
    }));
  }, []);

  const initializeVoice = useCallback(async () => {
    try {
      // First try to access the Voice module through NativeModules
      const VoiceModule = NativeModules.Voice;
      if (!VoiceModule) {
        console.error("Voice native module is not available");
        setState(prev => ({
          ...prev,
          error: "Voice module is not available",
          isAvailable: false,
          isInitialized: false
        }));
        return false;
      }

      // Create event emitter for Voice module
      const voiceEmitter = new NativeEventEmitter(VoiceModule);

      // Set up event listeners using the emitter
      const subscriptions = [
        voiceEmitter.addListener('onSpeechStart', () => {
          console.log('onSpeechStart');
          setState((prevState) => ({
            ...prevState,
            started: "√",
            isRecording: true,
            results: [],
            partialResults: [],
          }));
        }),

        voiceEmitter.addListener('onSpeechRecognized', () => {
          console.log('onSpeechRecognized');
          setState((prevState) => ({ ...prevState, recognized: "√" }));
        }),

        voiceEmitter.addListener('onSpeechEnd', () => {
          console.log('onSpeechEnd');
          setState((prevState) => {
            const finalResults = prevState.results.length > 0 
              ? prevState.results 
              : prevState.partialResults.length > 0
                ? prevState.partialResults
                : [];
            
            console.log('onSpeechEnd - using results:', finalResults);
            return {
              ...prevState,
              end: "√",
              isRecording: false,
              results: finalResults
            };
          });
        }),

        voiceEmitter.addListener('onSpeechError', (e: SpeechErrorEvent) => {
          console.log('onSpeechError:', e.error);
          setState((prevState) => ({
            ...prevState,
            error: JSON.stringify(e.error),
            isRecording: false,
          }));
        }),

        voiceEmitter.addListener('onSpeechResults', (e: SpeechResultsEvent) => {
          console.log('onSpeechResults:', e.value);
          if (e.value) {
            setState((prevState) => ({ 
              ...prevState, 
              results: e.value!,
              end: "√",
              isRecording: false
            }));
          }
        }),

        voiceEmitter.addListener('onSpeechPartialResults', (e: SpeechResultsEvent) => {
          console.log('onSpeechPartialResults:', e.value);
          if (e.value) {
            setState((prevState) => ({ 
              ...prevState, 
              partialResults: e.value!,
              results: prevState.results.length === 0 ? e.value! : prevState.results
            }));
          }
        })
      ];

      // Store subscriptions for cleanup
      setState(prev => ({ 
        ...prev, 
        isInitialized: true,
        isAvailable: true,
        error: "" 
      }));

      return true;
    } catch (e) {
      console.error("Error initializing voice module:", e);
      setState(prev => ({ 
        ...prev, 
        error: "Failed to initialize voice module",
        isInitialized: false,
        isAvailable: false
      }));
      return false;
    }
  }, []);

  const checkPermissions = useCallback(async () => {
    if (!state.isInitialized) {
      const initialized = await initializeVoice();
      if (!initialized) return false;
    }

    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        setState(prev => ({ ...prev, hasPermission: granted }));
        return granted;
      } else {
        const VoiceModule = NativeModules.Voice;
        if (!VoiceModule) return false;
        const isAvailable = await VoiceModule.isAvailable();
        setState(prev => ({ ...prev, isAvailable: !!isAvailable }));
        return !!isAvailable;
      }
    } catch (e) {
      console.error("Error checking voice recognition permissions:", e);
      setState(prev => ({ 
        ...prev, 
        error: "Error checking permissions",
        hasPermission: false 
      }));
      return false;
    }
  }, [state.isInitialized, initializeVoice]);

  const requestPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "This app needs access to your microphone to record your voice.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        setState(prev => ({ ...prev, hasPermission }));
        return hasPermission;
      } else {
        return true;
      }
    } catch (e) {
      console.error("Error requesting voice recognition permission:", e);
      setState(prev => ({ 
        ...prev, 
        error: "Error requesting permission",
        hasPermission: false 
      }));
      return false;
    }
  }, []);

  const startRecognizing = useCallback(async () => {
    try {
      const VoiceModule = NativeModules.Voice;
      if (!VoiceModule) {
        console.error("Voice module is not available");
        setState(prev => ({
          ...prev,
          error: "Voice module is not available",
          isRecording: false
        }));
        return;
      }

      // Make sure Voice is initialized
      if (!state.isInitialized) {
        const initialized = await initializeVoice();
        if (!initialized) {
          console.error("Failed to initialize voice recognition");
          return;
        }
      }

      // Check permissions
      const permissionGranted = await checkPermissions();
      if (!permissionGranted) {
        const granted = await requestPermission();
        if (!granted) {
          setState(prev => ({
            ...prev,
            error: "Permission denied for voice recognition"
          }));
          return;
        }
      }

      resetState();
      
      // Add a small delay before starting (sometimes helps on Android)
      await new Promise(resolve => setTimeout(resolve, 300));

      if (Platform.OS === 'android') {
        await VoiceModule.startSpeech('en_US', {});
      } else {
        await VoiceModule.startSpeech('en-US', {});
      }
      
      setState(prev => ({ ...prev, isRecording: true }));
    } catch (e) {
      console.error("Error starting voice recognition:", e);
      setState(prev => ({
        ...prev,
        error: "Error starting voice recognition",
        isRecording: false
      }));
    }
  }, [state.isInitialized, checkPermissions, requestPermission, resetState, initializeVoice]);

  const stopRecognizing = useCallback(async () => {
    try {
      const VoiceModule = NativeModules.Voice;
      if (!VoiceModule) return;
      await VoiceModule.stopSpeech();
    } catch (e) {
      console.error("Error stopping voice recognition", e);
      setState(prev => ({
        ...prev,
        error: "Error stopping voice recognition"
      }));
    }
  }, []);

  const cancelRecognizing = useCallback(async () => {
    try {
      const VoiceModule = NativeModules.Voice;
      if (!VoiceModule) return;
      await VoiceModule.cancelSpeech();
    } catch (e) {
      console.error("Error canceling voice recognition", e);
      setState(prev => ({
        ...prev,
        error: "Error canceling voice recognition"
      }));
    }
  }, []);

  const destroyRecognizer = useCallback(async () => {
    try {
      const VoiceModule = NativeModules.Voice;
      if (!VoiceModule) return;
      if (state.isInitialized) {
        await VoiceModule.destroySpeech();
        setState(prev => ({
          ...prev,
          isInitialized: false
        }));
      }
    } catch (e) {
      console.error("Error destroying voice recognition", e);
      setState(prev => ({
        ...prev,
        error: "Error destroying voice recognition"
      }));
    }
    resetState();
  }, [state.isInitialized, resetState]);

  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      // Add a small delay before initialization
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (mounted) {
        await initializeVoice();
      }
    };

    initialize();

    return () => {
      mounted = false;
      destroyRecognizer();
    };
  }, [initializeVoice, destroyRecognizer]);

  return {
    state,
    setState,
    resetState,
    startRecognizing,
    stopRecognizing,
    cancelRecognizing,
    destroyRecognizer,
    checkPermissions,
    requestPermission,
  };
};