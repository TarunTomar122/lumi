import React, { useState, useEffect, useCallback } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionResultEvent
} from 'expo-speech-recognition';

interface IState {
  recognized: string;
  error: string;
  end: string;
  started: string;
  results: string[];
  partialResults: string[];
  isRecording: boolean;
  hasPermission: boolean;
  isAvailable: boolean;
}

export const useVoiceRecognition = () => {
  const [state, setState] = useState<IState>({
    recognized: '',
    error: '',
    end: '',
    started: '',
    results: [],
    partialResults: [],
    isRecording: false,
    hasPermission: false,
    isAvailable: false,
  });

  const resetState = useCallback(() => {
    setState((prevState: IState) => ({
      recognized: '',
      error: '',
      started: '',
      results: [],
      partialResults: [],
      end: '',
      isRecording: false,
      hasPermission: prevState.hasPermission,
      isAvailable: prevState.isAvailable,
    }));
  }, []);

  // Set up event listeners
  useSpeechRecognitionEvent('start', () => {
    console.log('onSpeechStart');
    setState((prevState: IState) => ({
      ...prevState,
      started: '√',
      isRecording: true,
      results: [],
      partialResults: [],
    }));
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('onSpeechEnd');
    setState((prevState: IState) => {
      const finalResults = prevState.results.length > 0 
        ? prevState.results 
        : prevState.partialResults.length > 0
          ? prevState.partialResults
          : [];
      
      console.log('onSpeechEnd - using results:', finalResults);
      return {
        ...prevState,
        end: '√',
        isRecording: false,
        results: finalResults
      };
    });
  });

  useSpeechRecognitionEvent('error', (event: ExpoSpeechRecognitionErrorEvent) => {
    console.log('onSpeechError:', event.error);
    setState((prevState: IState) => ({
      ...prevState,
      error: event.message,
      isRecording: false,
    }));
  });

  useSpeechRecognitionEvent('result', (event: ExpoSpeechRecognitionResultEvent) => {
    console.log('onSpeechResults:', event.results);
    if (event.results) {
      const results = event.results.map(result => result.transcript);
      setState((prevState: IState) => ({ 
        ...prevState, 
        results,
        end: event.isFinal ? '√' : prevState.end,
        isRecording: !event.isFinal
      }));
    }
  });

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      const isAvailable = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
      
      setState(prev => ({ 
        ...prev, 
        hasPermission: result.granted,
        isAvailable: isAvailable
      }));
      
      return result.granted && isAvailable;
    } catch (e) {
      console.error('Error checking speech recognition permissions:', e);
      setState(prev => ({ 
        ...prev, 
        error: 'Error checking permissions',
        hasPermission: false,
        isAvailable: false
      }));
      return false;
    }
  }, []);

  const startRecognizing = useCallback(async (): Promise<void> => {
    try {
      // Check permissions first
      const permissionGranted = await checkPermissions();
      if (!permissionGranted) {
        setState(prev => ({
          ...prev,
          error: 'Permission denied for speech recognition'
        }));
        return;
      }

      resetState();
      
      // Start speech recognition
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        continuous: true,
        androidIntentOptions: {
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 10000,
        },
        androidRecognitionServicePackage: "com.google.android.tts",
      });

      console.log('startRecognizing');
      
      setState(prev => ({ ...prev, isRecording: true }));
    } catch (e) {
      console.error('Error starting speech recognition:', e);
      setState(prev => ({
        ...prev,
        error: 'Error starting speech recognition',
        isRecording: false
      }));
    }
  }, [checkPermissions, resetState]);

  const stopRecognizing = useCallback(async (): Promise<void> => {
    try {
      await ExpoSpeechRecognitionModule.stop();
      console.log('stopRecognizing');
    } catch (e) {
      console.error('Error stopping speech recognition', e);
      setState(prev => ({
        ...prev,
        error: 'Error stopping speech recognition'
      }));
    }
  }, []);

  const cancelRecognizing = useCallback(async (): Promise<void> => {
    try {
      console.log('cancelRecognizing');
      await ExpoSpeechRecognitionModule.abort();
    } catch (e) {
      console.error('Error canceling speech recognition', e);
      setState(prev => ({
        ...prev,
        error: 'Error canceling speech recognition'
      }));
    }
  }, []);

  useEffect(() => {
    checkPermissions();
    
    return () => {
      // Cleanup
      if (state.isRecording) {
        cancelRecognizing();
      }
    };
  }, []);

  return {
    state,
    setState,
    resetState,
    startRecognizing,
    stopRecognizing,
    cancelRecognizing,
    checkPermissions,
  };
};