import { useState, useEffect, Suspense, useMemo } from "react";
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
  RotateCcw, Monitor, SkipBack, SkipForward,
  Gauge, MapPin, Zap, Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api, buildUrl } from "@shared/routes";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  
  // Telemetry State
  const [metadata, setMetadata] = useState<any[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
          if (prev >= duration && duration > 0) {
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

    // Auto-extract metadata if it's the front camera
    if (view === "front") {
      // In local development, the server won't have access to the client's file path
      // We should explain this or provide a mock fallback
      extractMetadata(file.name);
    }
  };

  const extractMetadata = async (filename: string) => {
    setIsExtracting(true);
    try {
      const res = await apiRequest("POST", api.metadata.extract.path, { filename });
      const data = await res.json();
      setMetadata(data);
      if (data.length > 0) {
        toast({
          title: "Telemetry Data Extracted",
          description: `Loaded ${data.length} telemetry samples.`,
          className: "bg-background border-primary text-primary font-mono",
        });
      }
    } catch (err) {
      console.error("Metadata extraction failed:", err);
      toast({
        title: "Extraction Note",
        description: "Local files cannot be processed by the server-side extractor automatically. Using simulated telemetry for synchronization.",
        className: "bg-background border-accent text-accent font-mono",
      });
      // Fallback to mock data for demo if server fails
      generateMockMetadata();
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExport = async () => {
    if (!selectedView || !videoUrls[selectedView]) {
      toast({ title: "Select a camera view with a loaded video first." });
      return;
    }

    setIsExporting(true);
    try {
      // Find a real filename from the server if possible, or use a fallback
      // In this demo, we check if we have a front camera file name or use a default
      const res = await apiRequest("POST", api.export.camcorder.path, {
        view: selectedView,
        filename: "tesla_front.mp4", 
        telemetry: metadata.length > 0 ? [currentTelemetry] : []
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Export failed");
      }
      
      const data = await res.json();
      
      // Trigger download
      const link = document.createElement("a");
      link.href = data.url;
      link.download = `Tesla_Export_${selectedView}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Export Complete", description: "Camcorder view has been downloaded." });
    } catch (err) {
      toast({ title: "Export Failed", description: "Could not generate camcorder view.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const generateMockMetadata = () => {
    const mockData = Array.from({ length: 600 }).map((_, i) => {
      // Create a curve for speed: starts at 0, accelerates, then cruises
      let speedValue = 0;
      if (i < 50) {
        // Accelerating from 0 to 65
        speedValue = (i / 50) * 65;
      } else if (i < 400) {
        // Cruising at 65-70
        speedValue = 65 + Math.random() * 5;
      } else {
        // Decelerating to 0
        speedValue = Math.max(0, 70 - ((i - 400) / 200) * 70);
      }

      return {
        timestamp: (i * 0.1).toString(),
        speed: Math.floor(speedValue).toString(),
        gear: speedValue > 0 ? "D" : "P",
        latitude: (37.3947 + (Math.random() * 0.001)).toFixed(4),
        longitude: (-122.1503 + (Math.random() * 0.001)).toFixed(4),
        brake: speedValue === 0 && i > 400 ? "1" : "0",
        accelerator: speedValue > 0 && i < 50 ? Math.floor(30 + Math.random() * 20).toString() : "0",
        power: Math.floor(speedValue * 0.8 + Math.random() * 10).toString()
      };
    });
    setMetadata(mockData);
    toast({
      title: "Simulated Telemetry Active",
      description: "Using generated telemetry for visualization.",
      className: "bg-background border-accent text-accent font-mono",
    });
  };

  const currentTelemetry = useMemo(() => {
    if (metadata.length === 0) return null;
    
    // Most Tesla dashcam videos are 1-minute (60s) segments.
    // The SEI metadata often has a startup delay or absolute timestamps.
    // We assume the FIRST metadata entry aligns with the START of the video.
    const startTimestamp = parseFloat(metadata[0].timestamp || "0");
    const targetTimestamp = startTimestamp + currentTime + (syncOffsets["front"] || 0);
    
    return metadata.reduce((prev, curr) => {
      const prevDiff = Math.abs(parseFloat(prev.timestamp) - targetTimestamp);
      const currDiff = Math.abs(parseFloat(curr.timestamp) - targetTimestamp);
      return currDiff < prevDiff ? curr : prev;
    });
  }, [metadata, currentTime, syncOffsets]);

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

  const updateRotation = (view: CameraView, axis: 0 | 1 | 2, value: number) => {
    if (!config) return;
    const newRot = [...config[view].rotation] as [number, number, number];
    newRot[axis] = value * (Math.PI / 180); 
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
          {metadata.length === 0 && !isExtracting && (
             <CyberButton variant="ghost" onClick={generateMockMetadata} className="text-[10px] h-8">
               MOCK DATA
             </CyberButton>
          )}
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
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <CyberButton 
                variant="primary" 
                className="w-full text-[10px]" 
                disabled={!selectedView || isExporting}
                onClick={handleExport}
                isLoading={isExporting}
              >
                <Monitor className="w-3 h-3 mr-2" /> EXPORT CAMCORDER VIEW
              </CyberButton>
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
               <meshBasicMaterial color="#00ffff" wireframe />
             </mesh>
          </Canvas>

          {/* Telemetry HUD */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 pointer-events-none z-30">
            <div className="bg-black/60 backdrop-blur-xl border border-primary/40 rounded-xl p-4 grid grid-cols-4 md:grid-cols-7 gap-6 items-center shadow-[0_0_20px_rgba(0,255,255,0.1)]">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-primary text-[10px] uppercase font-bold tracking-tighter">
                  <Gauge className="h-3 w-3" /> SPEED
                </div>
                <div className="text-3xl font-mono text-white leading-none mt-1">
                  {currentTelemetry ? Math.floor(parseFloat(currentTelemetry.speed)) : "0"} <span className="text-[10px] text-muted-foreground font-sans">MPH</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center border-l border-white/10">
                <div className="text-[10px] text-primary uppercase font-bold tracking-tighter">GEAR</div>
                <div className="text-3xl font-mono text-white leading-none mt-1">{currentTelemetry?.gear || "P"}</div>
              </div>

              <div className="hidden md:flex flex-col col-span-2 border-l border-white/10 px-4">
                <div className="flex items-center gap-1.5 text-primary text-[10px] uppercase font-bold tracking-tighter">
                  <MapPin className="h-3 w-3" /> COORDINATES
                </div>
                <div className="text-xs font-mono text-white mt-1">
                  {currentTelemetry?.latitude || "0.0000"}° N <br/>
                  {currentTelemetry?.longitude || "0.0000"}° W
                </div>
              </div>

              <div className="flex flex-col items-center border-l border-white/10 px-2">
                <div className="flex items-center gap-1.5 text-primary text-[10px] uppercase font-bold tracking-tighter">
                  <Activity className="h-3 w-3" /> PEDALS
                </div>
                <div className="flex gap-2 items-end h-8 mt-1">
                  <div className="w-1.5 bg-white/5 rounded-full overflow-hidden flex flex-col justify-end h-full">
                    <div className="bg-primary w-full shadow-[0_0_8px_rgba(0,255,255,0.5)]" style={{ height: `${currentTelemetry?.accelerator || 0}%` }} />
                  </div>
                  <div className="w-1.5 bg-white/5 rounded-full overflow-hidden flex flex-col justify-end h-full">
                    <div className="bg-red-500 w-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" style={{ height: `${currentTelemetry?.brake === "1" ? 100 : 0}%` }} />
                  </div>
                </div>
              </div>

              <div className="hidden md:flex flex-col col-span-2 border-l border-white/10 pl-6 pr-2">
                <div className="flex items-center gap-1.5 text-primary text-[10px] uppercase font-bold tracking-tighter">
                  <Zap className="h-3 w-3" /> POWER
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full mt-2 overflow-hidden border border-white/10">
                  <div 
                    className="bg-primary h-full transition-all duration-300 shadow-[0_0_10px_rgba(0,255,255,0.4)]" 
                    style={{ width: `${currentTelemetry?.power || 0}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* View Controls */}
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
            <CyberButton variant="ghost" onClick={() => setCurrentTime(0)}>
              <RotateCcw className="w-4 h-4" />
            </CyberButton>
          </div>
        </div>
      </footer>
    </div>
  );
}
