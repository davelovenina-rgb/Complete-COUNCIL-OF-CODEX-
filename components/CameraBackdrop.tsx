
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldAlert, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export const CameraBackdrop: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'ACTIVE' | 'ERROR'>('IDLE');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

    const startCamera = useCallback(async () => {
        setStatus('LOADING');
        let stream: MediaStream | null = null;
        try {
            // Get all video devices
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
            setDevices(videoDevices);

            const constraints: MediaStreamConstraints = {
                video: videoDevices.length > 0 
                    ? { deviceId: { exact: videoDevices[currentDeviceIndex].deviceId } }
                    : { facingMode },
                audio: false
            };

            stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setStatus('ACTIVE');
            }
        } catch (err) {
            console.error("Camera Bridge Error:", err);
            setStatus('ERROR');
        }
        return stream;
    }, [facingMode, currentDeviceIndex]);

    useEffect(() => {
        let activeStream: MediaStream | null = null;
        startCamera().then(s => activeStream = s);

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [startCamera]);

    const cycleCamera = () => {
        triggerHaptic('medium');
        if (devices.length > 1) {
            setCurrentDeviceIndex((prev) => (prev + 1) % devices.length);
        } else {
            setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        }
    };

    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none">
            <AnimatePresence>
                {status === 'ACTIVE' && (
                    <motion.video
                        key={`${facingMode}-${currentDeviceIndex}`}
                        ref={videoRef}
                        autoPlay
                        playsInline
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full object-cover grayscale-[0.3] contrast-[1.1] brightness-[0.6]"
                    />
                )}
            </AnimatePresence>

            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 backdrop-blur-[2px]" />

            {status === 'LOADING' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={32} className="text-lux-gold animate-spin opacity-40" />
                </div>
            )}

            {status === 'ACTIVE' && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-auto z-50">
                    <button 
                        onClick={cycleCamera}
                        className="p-4 bg-black/60 border border-white/20 rounded-full text-white backdrop-blur-xl hover:bg-white hover:text-black transition-all shadow-2xl"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            )}

            {status === 'ERROR' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 p-8 text-center">
                    <ShieldAlert size={48} className="mb-4 opacity-20" />
                    <p className="text-xs uppercase tracking-widest font-bold">Reality Bridge Offline</p>
                    <p className="text-[10px] mt-2">Check camera permissions, Papi.</p>
                </div>
            )}
        </div>
    );
};
