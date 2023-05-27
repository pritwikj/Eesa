import React, { useState } from 'react'
import { useEffect } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

const VoiceToText = (lparams) => {
  const [message, setMessage] = useState('')
  const commands = [
    {
      command: ['isha', 'essa', 'isa'],
      callback: (command) =>{ resettext()  },
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 0.2,
      bestMatchOnly: true
    }
  ]
  const {transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition({ commands })

  useEffect(() => {
    SpeechRecognition.startListening() 
  }, []);

  function resettext(){
    resetTranscript();
    SpeechRecognition.getRecognition().stop();
    // lparams.updatespeechend(false);
    lparams.startlisten();
  }

  lparams.showtext(transcript);
 
  SpeechRecognition.getRecognition().onend= (event) => {
    // resetTranscript();
    // lparams.updatespeechend(true);
    setTimeout(() => {
      // lparams.updatespeechend(false);
      SpeechRecognition.getRecognition().start();
    }, 500);
    
  };

  if (!browserSupportsSpeechRecognition) {
    return null
  }

  return (
    <div style={{'display' : 'none'}}>
      <p>{message}</p>
      <p id="transcript_l">{transcript}</p>
    </div>
  )
}
export default VoiceToText
