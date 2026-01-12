import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { AlertTriangle } from "lucide-react";

interface VideoPlaneProps {
  url?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  label: string;
  playing: boolean;
  currentTime: number;
  offset: number;
  onDurationLoad?: (duration: number) => void;
  selected?: boolean;
  onClick?: () => void;
}

export function VideoPlane({ 
  url, 
  position, 
  rotation, 
  scale, 
  label, 
  playing, 
  currentTime, 
  offset, 
  onDurationLoad,
  selected,
  onClick
}: VideoPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  // Initialize video element
  useEffect(() => {
    if (!url) return;

    const vid = document.createElement("video");
    vid.src = url;
    vid.crossOrigin = "Anonymous";
    vid.loop = true;
    vid.muted = true; // Chrome requires muted for autoplay, we can unmute later if needed
    vid.playsInline = true;
    
    vid.onloadedmetadata = () => {
      setAspectRatio(vid.videoWidth / vid.videoHeight);
      if (onDurationLoad) onDurationLoad(vid.duration);
    };

    const texture = new THREE.VideoTexture(vid);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    setVideoTexture(texture);
    videoRef.current = vid;

    return () => {
      vid.pause();
      vid.src = "";
      texture.dispose();
    };
  }, [url]);

  // Handle Playback Sync
  useFrame(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - (currentTime + offset)) > 0.3) {
      // If drift is significant, snap to time
       // Only sync if video is loaded and ready
       if(videoRef.current.readyState >= 2) {
          // Clamp time between 0 and duration
          let targetTime = currentTime + offset;
          if (targetTime < 0) targetTime = 0;
          if (targetTime > videoRef.current.duration) targetTime = videoRef.current.duration;
          
          videoRef.current.currentTime = targetTime;
       }
    }
  });

  useEffect(() => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.play().catch(e => console.error("Play failed", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [playing]);

  // Width is base scale, height is derived from aspect ratio
  const width = 4 * scale;
  const height = width / aspectRatio;

  return (
    <group position={position} rotation={rotation} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      {/* The Screen Mesh */}
      <mesh ref={meshRef}>
        <planeGeometry args={[width, height]} />
        {videoTexture ? (
          <meshBasicMaterial map={videoTexture} side={THREE.DoubleSide} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#1a1a1a" side={THREE.DoubleSide} />
        )}
      </mesh>

      {/* Selection Highlight Frame */}
      {selected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
          <lineBasicMaterial color="#00ffff" linewidth={2} toneMapped={false} />
        </lineSegments>
      )}

      {/* Label / No Signal UI */}
      {!url && (
        <Html transform position={[0, 0, 0.1]} center className="pointer-events-none select-none">
          <div className="flex flex-col items-center justify-center w-64 h-32 bg-black/80 border border-primary/30 backdrop-blur-md rounded-lg p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-primary mb-2 animate-pulse" />
            <h3 className="text-primary font-display font-bold text-lg uppercase tracking-widest">{label}</h3>
            <p className="text-xs text-muted-foreground font-mono mt-1">NO SIGNAL DETECTED</p>
          </div>
        </Html>
      )}

      {/* Label when active (small corner label) */}
      {url && (
        <Html transform position={[-width/2 + 0.2, height/2 + 0.2, 0]} className="pointer-events-none select-none">
           <div className="bg-primary/90 text-black px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-tighter">
             {label}
           </div>
        </Html>
      )}
    </group>
  );
}
