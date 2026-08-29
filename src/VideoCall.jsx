import React from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

export default function VideoCall({ roomId, userName, userId, onLeave }) {
    const myMeeting = async (element) => {
        // നിങ്ങളുടെ ZegoCloud അക്കൗണ്ട് ഡീറ്റെയിൽസ്
        const appID = 217028234;
        const serverSecret = "4a320beab45aa059904c35c074d9e790";
        
        // കോൾ കണക്റ്റ് ചെയ്യാനുള്ള ടോക്കൺ ഉണ്ടാക്കുന്നു
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            appID, 
            serverSecret, 
            roomId, 
            userId, 
            userName
        );

        // ZegoCloud സ്ക്രീൻ ജനറേറ്റ് ചെയ്യുന്നു
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zp.joinRoom({
            container: element,
            sharedLinks: [
                {
                    name: 'Share link to Client',
                    url: window.location.origin + '?roomID=' + roomId,
                },
            ],
            scenario: {
                mode: ZegoUIKitPrebuilt.GroupCall, 
            },
            showPreJoinView: false, // വാട്സാപ്പ് പോലെ നേരിട്ട് കോളിലേക്ക് കയറാൻ
            onLeaveRoom: () => {
                if(onLeave) onLeave(); // കോൾ കട്ട് ചെയ്യുമ്പോൾ തിരിച്ച് ആപ്പിലേക്ക് വരാൻ
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[99999] bg-black">
            <div ref={myMeeting} style={{ width: '100vw', height: '100vh' }}></div>
        </div>
    );
}