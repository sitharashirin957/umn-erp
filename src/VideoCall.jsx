import React, { useState } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Minimize2, Maximize2 } from 'lucide-react';

export default function VideoCall({ roomId, userName, userId, onLeave }) {
    const [isMinimized, setIsMinimized] = useState(false);

    const myMeeting = async (element) => {
        const appID = 217028234;
        const serverSecret = "4a320beab45aa059904c35c074d9e790";
        
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            appID, 
            serverSecret, 
            roomId, 
            userId, 
            userName
        );

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
            showPreJoinView: false, 
            onLeaveRoom: () => {
                if(onLeave) onLeave(); 
            }
        });
    };

    return (
        <div className={`fixed z-[99999] transition-all duration-300 shadow-2xl bg-black overflow-hidden border border-slate-700 ${
            isMinimized 
                ? 'bottom-6 right-6 w-80 h-48 rounded-2xl' 
                : 'inset-0 w-screen h-screen rounded-none'
        }`}>
            {/* മുകളിൽ വലതുഭാഗത്തുള്ള Minimize / Maximize ബട്ടൺ */}
            <div className="absolute top-3 right-3 z-[100000] flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                <button 
                    onClick={() => setIsMinimized(!isMinimized)} 
                    className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors"
                    title={isMinimized ? "Expand Fullscreen" : "Minimize Window"}
                >
                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
            </div>

            {/* വീഡിയോ കോൾ കണ്ടെയ്നർ */}
            <div ref={myMeeting} style={{ width: '100%', height: '100%' }}></div>
        </div>
    );
}