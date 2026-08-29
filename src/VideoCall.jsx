import React, { useState } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Minimize2, Maximize2, PhoneOff } from 'lucide-react';

export default function VideoCall({ roomId, userName, userId, onLeave }) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [zpInstance, setZpInstance] = useState(null);

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
        setZpInstance(zp); // Zego ഇൻസ്റ്റൻസ് സേവ് ചെയ്തു വെക്കുന്നു

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
                stopRingtoneAndLeave();
            }
        });
    };

    // റിംഗ്‌ടോൺ ഓഫ് ചെയ്ത് കോൾ ലീവ് ചെയ്യാനുള്ള ഫംഗ്ഷൻ
    const stopRingtoneAndLeave = () => {
        const ringtoneEl = document.getElementById('phone-ringtone');
        if (ringtoneEl) {
            ringtoneEl.pause();
            ringtoneEl.currentTime = 0;
        }
        if (onLeave) {
            onLeave();
        }
    };

    const handleEndCall = () => {
        if (zpInstance) {
            zpInstance.destroy(); // Zego റൂം കംപ്ലീറ്റ് ക്ലോസ് ചെയ്യുന്നു
        }
        stopRingtoneAndLeave();
    };

    return (
        <div className={`fixed z-[999999] transition-all duration-300 shadow-2xl bg-black overflow-hidden border border-slate-700 ${
            isMinimized 
                ? 'bottom-24 right-5 sm:right-8 w-80 h-48 rounded-2xl' 
                : 'inset-0 w-screen h-screen rounded-none'
        }`} style={{ WebkitOverflowScrolling: 'touch' }}>
            
            {/* മുകളിൽ വലതുഭാഗത്തുള്ള കൺട്രോൾ ബട്ടണുകൾ */}
            <div className="absolute top-3 right-3 z-[1000000] flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg">
                <button 
                    onClick={() => setIsMinimized(!isMinimized)} 
                    className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                    title={isMinimized ? "Expand Fullscreen" : "Minimize Window"}
                >
                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button 
                    onClick={handleEndCall} 
                    className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-md"
                    title="End Call"
                >
                    <PhoneOff size={16} />
                </button>
            </div>

            {/* വീഡിയോ കോൾ കണ്ടെയ്നർ */}
            <div ref={myMeeting} style={{ width: '100%', height: '100%', position: 'relative' }}></div>
        </div>
    );
}