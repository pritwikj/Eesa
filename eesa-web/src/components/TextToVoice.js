import { useState } from 'react';
import textToSpeech from './textToSpeech';

const TextToVoice = (lparam) => {
  
  // Define a state variable to hold the audio URL
  var audio = new Audio();

  // Define a function to fetch the audio data and set the URL state variable
  const handleAudioFetch = async (text, callback) => {
    // Call the textToSpeech function to generate the audio data for the text "Hello welcome"
    const data = await textToSpeech(text)
    // Create a new Blob object from the audio data with MIME type 'audio/mpeg'
    const blob = new Blob([data], { type: 'audio/mpeg' });
    // Create a URL for the blob object
    const url = URL.createObjectURL(blob);
    // Set the audio URL state variable to the newly created URL
    callback(url)
  };

  setInterval(async () => {


    // stop audio
    if(localStorage.getItem("stopmeet") && localStorage.getItem("stopmeet") == 1) {
      audio.pause();
    }

    // get audio url based on text array
    if(localStorage.getItem("serive_strt") && localStorage.getItem("serive_strt") == 0){
      if(localStorage.getItem('voicetext') && JSON.parse(localStorage.getItem('voicetext')).length > 0){
        var old_texts = JSON.parse(localStorage.getItem('voicetext'));
        var text_toread = old_texts.shift();
        localStorage.setItem('voicetext', JSON.stringify(old_texts))
        localStorage.setItem("serive_strt", 1);
        await handleAudioFetch(text_toread, async (url)=>{
          var old_texts = JSON.parse(localStorage.getItem('voiceurl'));
          old_texts.push(url);
          localStorage.setItem('voiceurl', JSON.stringify(old_texts))
        })
      }
    }

//play voice based on url array
if(localStorage.getItem("voice_playing") && localStorage.getItem("voice_playing") == 0){
  if(localStorage.getItem('voiceurl') && JSON.parse(localStorage.getItem('voiceurl')).length > 0){
    var voiceurl = JSON.parse(localStorage.getItem('voiceurl'));
    var url = voiceurl.shift();
    localStorage.setItem('voiceurl', JSON.stringify(voiceurl))
    localStorage.setItem("voice_playing", 1);
    audio.src = url;
    audio.onended = (event) => {
      localStorage.setItem("voice_playing", 0);
    };
    await audio.play();
  }
}

}, 2000);

return (
    <></>
  );
}
export default TextToVoice;
