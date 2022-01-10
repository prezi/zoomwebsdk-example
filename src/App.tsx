import React, {useCallback, useEffect, useRef} from 'react';
import logo from './logo.svg';
import './App.css';

const API_KEY = "WXAK2vDQSq6b55j9Y5QLgA";
const API_SECRET = "vhueopJKVC9pRsnzx6uQkCFysIHe4XM7Gpgz";

function App() {
    const zoomDiv = useRef(null);
    const handlePaste = useCallback(async (event) => {
        if (zoomDiv.current) {
            const pastedData = event.clipboardData.getData('Text');
            //https://prezi.zoom.us/j/96520041636?pwd=Z3Axdkk1dURsV2c5NVU5QUdaK0lGUT09
            if (pastedData.includes('prezi.zoom.us/j')) {
                const meetingId = pastedData.split('/j/')[1].split('?pwd')[0];
                const passWord = pastedData.split('?pwd=')[1];
                const {joinZoomMeeting, monkeyPatchMediaDevices} = await import("./zoomAPI");
                monkeyPatchMediaDevices('Prezi Web Camera', 'Prezi Web Camera');
                const client = await joinZoomMeeting(
                    API_KEY,
                    API_SECRET,
                    meetingId,
                    'Prezi Guest',
                    passWord,
                    'https://prezi.com', //TODO
                    '', // TODO
                    zoomDiv.current,
                );
                console.log(client);
            }
        }
    }, []);

    useEffect(() => {
        window.addEventListener("paste", handlePaste);
        return () => {
            window.removeEventListener("paste", handlePaste);
        };
    }, [handlePaste]);

    return (
        <div className="App">
            <div ref={zoomDiv}/>
        </div>
    );
}

export default App;
