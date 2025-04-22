import { useState, useEffect, useCallback } from "react";
import Voice, {
  SpeechErrorEvent,
  SpeechResultsEvent,
} from "@react-native-voice/voice";
import { Platform, PermissionsAndroid } from 'react-native';

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
      await Voice.destroy();
      await Voice.removeAllListeners();
      
      // Set up event listeners
      Voice.onSpeechStart = () => {
        setState((prevState) => ({
          ...prevState,
          started: "√",
          isRecording: true,
        }));
      };

      Voice.onSpeechRecognized = () => {
        setState((prevState) => ({ ...prevState, recognized: "√" }));
      };

      Voice.onSpeechEnd = () => {
        setState((prevState) => ({ ...prevState, end: "√", isRecording: false }));
      };

      Voice.onSpeechError = (e: SpeechErrorEvent) => {
        setState((prevState) => ({
          ...prevState,
          error: JSON.stringify(e.error),
          isRecording: false,
        }));
      };

      Voice.onSpeechResults = (e: SpeechResultsEvent) => {
        if (e.value) {
          setState((prevState) => ({ ...prevState, results: e.value! }));
        }
      };

      Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
        if (e.value) {
          setState((prevState) => ({ ...prevState, partialResults: e.value! }));
        }
      };

      setState(prev => ({ ...prev, isInitialized: true }));
      return true;
    } catch (e) {
      console.error("Error initializing voice module:", e);
      setState(prev => ({ ...prev, error: "Failed to initialize voice module" }));
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
        // iOS permissions are handled by the Voice API itself
        const isAvailable = await Voice.isAvailable();
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
        // iOS permissions are handled by the Voice API itself
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
    if (!state.isInitialized) {
      const initialized = await initializeVoice();
      if (!initialized) return;
    }

    try {
      // First check if we have permission
      const permissionGranted = await checkPermissions();
      
      if (!permissionGranted) {
        // If no permission, try to request it
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
      if (Platform.OS === 'android') {
        await Voice.start('en_US'); // Note the underscore for Android locale
      } else {
        await Voice.start('en-US'); // Hyphen for iOS locale
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
      await Voice.stop();
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
      await Voice.cancel();
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
      await Voice.destroy();
    } catch (e) {
      console.error("Error destroying voice recognition", e);
      setState(prev => ({
        ...prev,
        error: "Error destroying voice recognition"
      }));
    }
    resetState();
  }, [resetState]);

  useEffect(() => {
    initializeVoice();
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [initializeVoice]);

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