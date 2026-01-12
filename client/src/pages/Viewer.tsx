import { useState, useEffect, Suspense } from "react";
import { useParams, Link } from "wouter";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Stars } from "@react-three/drei";
import { useProject, useUpdateProject } from "@/hooks/use-projects";
import { VideoPlane } from "@/components/VideoPlane";
import { CyberButton } from "@/components/CyberButton";
import { CyberInput } from "@/components/CyberInput";
import { Slider } from "@/components/ui/slider";
import { 
  Play, Pause, Save, ArrowLeft, Upload, Settings2, 
  RotateCcw, Monitor, SkipBack, SkipForward 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type CameraView = "front" | "back" | "left" | "right";

interface ConfigState {
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
}

export default function Viewer() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || "0");
  const { data: project, isLoading } = useProject(projectId);
  const updateProject = useUpdateProject();
  const { toast } = useToast();

  // Local State
  const [videoUrls, setVideoUrls] = useState<Record<CameraView, string | undefined>>({
    front: undefined, back: undefined, left: undefined, right: undefined
  });
  const [config, setConfig] = useState<Record<CameraView, ConfigState> | null>(null);
  const [syncOffsets, setSyncOffsets] = useState<Record<CameraView, number>>({
    front: 0, back: 0, left: 0, right: 0
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedView, setSelectedView] = useState<CameraView | null>(null);

  // Initialize config when project loads
  useEffect(() => {
    if (project && !config) {
      setConfig(project.layoutConfig as unknown as Record<CameraView, ConfigState>);
      if ((project.layoutConfig as any).syncOffsets) {
        setSyncOffsets((project.layoutConfig as any).syncOffsets);
      }
    }
  }, [project]);

  // Handle Playback Loop
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
             setIsPlaying(false);
             return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const handleFileChange = (view: CameraView, file: File) => {
    const url = URL.createObjectURL(file);
    setVideoUrls(prev => ({ ...prev, [view]: url }));
    toast({
      title: `${view.toUpperCase()} Signal Acquired`,
      description: "Video stream integrated successfully.",
      className: "bg-background border-primary text-primary font-mono",
    });
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      await updateProject.mutateAsync({
        id: projectId,
        layoutConfig: { ...config, syncOffsets } as any,
      });
      toast({
        title: "Configuration Saved",
        description: "Layout parameters updated in database.",
        className: "bg-background border-primary text-primary font-mono",
      });
    } catch {
      toast({
        title: "Save Failed",
        variant: "destructive",
      });
    }
  };

  // 3D Scene Config Helper
  const updateConfig = (view: CameraView, key: keyof ConfigState, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      [view]: { ...config[view], [key]: value }
    });
  };

  // Helper to handle rotation updates since they are arrays
  const updateRotation = (view: CameraView, axis: 0 | 1 | 2, value: number) => {
    if (!config) return;
    const newRot = [...config[view].rotation] as [number, number, number];
    newRot[axis] = value * (Math.PI / 180); // Convert deg to rad for UI convenience
    updateConfig(view, "rotation", newRot);
  };
  
  const updatePosition = (view: CameraView, axis: 0 | 1 | 2, value: number) => {
    if (!config) return;
    const newPos = [...config[view].position] as [number, number, number];
    newPos[axis] = value;
    updateConfig(view, "position", newPos);
  };

  if (isLoading || !config) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
         <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
         <p className="text-primary font-mono animate-pulse">LOADING ENVIRONMENT...</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-black text-foreground overflow-hidden flex flex-col">
      {/* Top Bar */}
      <header className="h-14 border-b border-white/10 bg-card/80 backdrop-blur-md flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <Link href="/">
            <CyberButton variant="ghost" className="px-3">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </CyberButton>
          </Link>
          <div className="h-6 w-px bg-white/10" />
          <h1 className="font-display font-bold text-lg text-primary tracking-widest uppercase">
            {project?.name} <span className="text-muted-foreground mx-2">//</span> WORKSPACE
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <CyberButton variant="primary" onClick={handleSave} isLoading={updateProject.isPending}>
            <Save className="w-4 h-4 mr-2" /> Save Config
          </CyberButton>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Controls */}
        <aside className="w-80 bg-card/90 border-r border-white/10 flex flex-col z-10 overflow-y-auto">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4 flex items-center">
              <Monitor className="w-4 h-4 mr-2" /> Video Feeds
            </h2>
            
            <div className="space-y-4">
              {(["front", "back", "left", "right"] as CameraView[]).map((view) => (
                <div 
                  key={view} 
                  className={cn(
                    "p-3 rounded border transition-all cursor-pointer",
                    selectedView === view 
                      ? "bg-primary/10 border-primary shadow-[0_0_10px_rgba(0,255,255,0.1)]" 
                      : "bg-background/50 border-white/10 hover:border-white/30"
                  )}
                  onClick={() => setSelectedView(view)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-display font-bold uppercase text-sm">{view} CAM</span>
                    <div className={cn("w-2 h-2 rounded-full", videoUrls[view] ? "bg-green-500 shadow-[0_0_5px_lime]" : "bg-red-500")} />
                  </div>
                  
                  {!videoUrls[view] ? (
                    <label className="flex items-center justify-center w-full h-8 border border-dashed border-white/20 rounded cursor-pointer hover:bg-white/5 transition-colors">
                       <span className="text-xs font-mono text-muted-foreground flex items-center">
                         <Upload className="w-3 h-3 mr-2" /> Load File
                       </span>
                       <input 
                         type="file" 
                         accept="video/*" 
                         className="hidden" 
                         onChange={(e) => e.target.files?.[0] && handleFileChange(view, e.target.files[0])}
                       />
                    </label>
                  ) : (
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-mono text-green-400">SIGNAL ACTIVE</span>
                       <button 
                         className="text-[10px] text-muted-foreground hover:text-white underline"
                         onClick={(e) => { e.stopPropagation(); setVideoUrls(prev => ({...prev, [view]: undefined})) }}
                       >
                         EJECT
                       </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedView && (
            <div className="p-4 space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
               <div className="flex items-center justify-between">
                 <h2 className="text-xs font-mono text-primary uppercase tracking-widest flex items-center">
                   <Settings2 className="w-4 h-4 mr-2" /> {selectedView} Calibration
                 </h2>
                 <button onClick={() => setSelectedView(null)} className="text-muted-foreground hover:text-white">
                   <RotateCcw className="w-3 h-3" />
                 </button>
               </div>

               {/* Transform Controls */}
               <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-mono text-muted-foreground uppercase">Scale</label>
                   <Slider 
                      value={[config[selectedView].scale]} 
                      min={0.1} max={3} step={0.1}
                      onValueChange={([v]) => updateConfig(selectedView, 'scale', v)}
                      className="py-2"
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-mono text-muted-foreground uppercase">Position X/Y/Z</label>
                   <div className="grid grid-cols-3 gap-2">
                     {[0, 1, 2].map((axis) => (
                       <CyberInput 
                         key={axis}
                         type="number" 
                         step="0.1"
                         className="px-1 py-1 text-xs text-center"
                         value={config[selectedView].position[axis]}
                         onChange={(e) => updatePosition(selectedView, axis as 0|1|2, parseFloat(e.target.value))}
                       />
                     ))}
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-mono text-muted-foreground uppercase">Rotation X/Y/Z (Deg)</label>
                   <div className="grid grid-cols-3 gap-2">
                     {[0, 1, 2].map((axis) => (
                       <CyberInput 
                         key={axis}
                         type="number" 
                         step="15"
                         className="px-1 py-1 text-xs text-center"
                         value={Math.round(config[selectedView].rotation[axis] * (180/Math.PI))}
                         onChange={(e) => updateRotation(selectedView, axis as 0|1|2, parseFloat(e.target.value))}
                       />
                     ))}
                   </div>
                 </div>

                 <div className="space-y-2 pt-4 border-t border-white/10">
                   <label className="text-[10px] font-mono text-secondary uppercase">Time Offset (Sec)</label>
                   <div className="flex gap-2 items-center">
                     <Slider 
                        value={[syncOffsets[selectedView]]} 
                        min={-10} max={10} step={0.1}
                        onValueChange={([v]) => setSyncOffsets(prev => ({...prev, [selectedView]: v}))}
                        className="flex-1"
                     />
                     <span className="font-mono text-xs w-12 text-right">{syncOffsets[selectedView].toFixed(1)}s</span>
                   </div>
                 </div>
               </div>
            </div>
          )}
        </aside>

        {/* 3D Canvas */}
        <div className="flex-1 relative bg-gradient-to-b from-slate-950 to-black">
          <Canvas camera={{ position: [0, 10, 10], fov: 60 }}>
             <color attach="background" args={['#050505']} />
             <fog attach="fog" args={['#050505', 5, 30]} />
             
             <OrbitControls makeDefault maxPolarAngle={Math.PI / 1.5} />
             <ambientLight intensity={0.5} />
             
             <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
             <Grid infiniteGrid fadeDistance={25} sectionColor="#00ffff" cellColor="#00ffff" sectionThickness={1} cellThickness={0.5} sectionSize={5} cellSize={1} />

             {/* Video Planes */}
             {(["front", "back", "left", "right"] as CameraView[]).map((view) => (
                <VideoPlane
                  key={view}
                  label={view.toUpperCase()}
                  url={videoUrls[view]}
                  position={config[view].position}
                  rotation={config[view].rotation}
                  scale={config[view].scale}
                  playing={isPlaying}
                  currentTime={currentTime}
                  offset={syncOffsets[view]}
                  selected={selectedView === view}
                  onClick={() => setSelectedView(view)}
                  onDurationLoad={(d) => {
                    if (d > duration) setDuration(d);
                  }}
                />
             ))}

             {/* Center marker (The Car) */}
             <mesh position={[0, 0, 0]}>
               <boxGeometry args={[1, 0.5, 2]} />
               <meshBasicMaterial color="gray" wireframe />
             </mesh>
          </Canvas>

          {/* Canvas Overlay UI - View Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
             <div className="bg-black/50 backdrop-blur text-xs font-mono p-2 rounded border border-white/10 text-muted-foreground">
                <p>LMB: ROTATE</p>
                <p>RMB: PAN</p>
                <p>SCROLL: ZOOM</p>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Timeline Bar */}
      <footer className="h-24 bg-card border-t border-white/10 p-4 flex flex-col justify-center gap-2 z-20">
        <div className="flex items-center gap-4">
          <CyberButton 
            className="w-12 h-12 p-0 rounded-full" 
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current" />}
          </CyberButton>
          
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono text-primary">
              <span>{currentTime.toFixed(1)}s</span>
              <span>{duration.toFixed(1)}s</span>
            </div>
            <Slider 
              value={[currentTime]} 
              min={0} 
              max={duration || 100} 
              step={0.1}
              onValueChange={([v]) => {
                setIsPlaying(false);
                setCurrentTime(v);
              }}
              className="py-2 cursor-pointer"
            />
          </div>

          <div className="flex gap-2">
            <CyberButton variant="ghost" className="px-2" onClick={() => setCurrentTime(Math.max(0, currentTime - 5))}>
              <SkipBack className="w-4 h-4" />
            </CyberButton>
            <CyberButton variant="ghost" className="px-2" onClick={() => setCurrentTime(Math.min(duration, currentTime + 5))}>
              <SkipForward className="w-4 h-4" />
            </CyberButton>
          </div>
        </div>
      </footer>
    </div>
  );
}
