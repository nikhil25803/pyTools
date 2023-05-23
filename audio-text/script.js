
var result = document.getElementById('audio_to_text');

function startConverting() {

    if ('webkitSpeechRecognition' in window) {
        var speechRecognizer = new webkitSpeechRecognition();
        speechRecognizer.continuous = true;
        speechRecognizer.interimResults = true;
        speechRecognizer.lang = 'en-US';
        speechRecognizer.start();
        console.log("Hello");
        var finalTranscripts = '';

        speechRecognizer.onresult = function (event) {
            var interimTranscripts = '';
            for (var i = event.resultIndex; i < event.results.length; i++) {
                var transcript = event.results[i][0].transcript;
                transcript.replace("\n", "<br>");
                if (event.results[i].isFinal) {
                    finalTranscripts += transcript;
                } else {
                    interimTranscripts += transcript;
                }
            }
            result.innerHTML = finalTranscripts + interimTranscripts;
        };

        // To stop recording -> Not working Properly
        speechRecognizer.onspeechend = () => {
            speechRecognizer.stop();
        };

        speechRecognizer.onerror = (event) => {
            speechRecognizer.textContent = `Error occurred in recognition: ${event.error}`;
        };

    } else {
        result.innerHTML = 'Your browser is not supported.';
    }
}

