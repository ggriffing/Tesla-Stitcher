import { useProjects, useDeleteProject } from "@/hooks/use-projects";
import { Link } from "wouter";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { CyberCard } from "@/components/CyberCard";
import { CyberButton } from "@/components/CyberButton";
import { Trash2, MonitorPlay, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to purge this project data? This action is irreversible.")) {
      try {
        await deleteProject.mutateAsync(id);
        toast({
          title: "Project Purged",
          description: "Data successfully removed from system.",
          className: "bg-background border-primary text-primary font-mono",
        });
      } catch {
        toast({
          title: "Purge Failed",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid-pattern relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="container mx-auto px-4 py-12 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-white/10 pb-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary text-glow mb-2">
              TESLA SENTRY
            </h1>
            <p className="text-muted-foreground font-mono tracking-widest uppercase text-sm">
              360° Threat Analysis & Visualization System
            </p>
          </div>
          <CreateProjectDialog />
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-card/30 rounded-lg border border-white/5" />
            ))}
          </div>
        ) : projects?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-xl bg-card/20 backdrop-blur-sm">
            <Activity className="w-16 h-16 text-muted-foreground/30 mb-6" />
            <h2 className="text-2xl font-display font-bold text-muted-foreground mb-2">System Idle</h2>
            <p className="text-muted-foreground/60 font-mono mb-8">No active visualization projects found.</p>
            <CreateProjectDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects?.map((project) => (
              <Link key={project.id} href={`/viewer/${project.id}`} className="group block h-full">
                 {/* Need a div here because Link returns an anchor tag */}
                 <div className="h-full">
                    <CyberCard className="h-full flex flex-col hover:-translate-y-1 transition-transform duration-300 group-hover:shadow-[0_0_30px_rgba(0,255,255,0.15)] cursor-pointer">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-display font-bold text-primary group-hover:text-glow transition-all">
                            {project.name}
                          </h3>
                          <span className="text-xs font-mono text-muted-foreground uppercase">
                            ID: {project.id.toString().padStart(4, '0')}
                          </span>
                        </div>
                        <div className="p-2 bg-primary/10 rounded-full">
                          <MonitorPlay className="w-5 h-5 text-primary" />
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-8 flex-grow font-mono line-clamp-3">
                        {project.description || "No description provided."}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                        <span className="text-xs font-mono text-muted-foreground/60">
                          {project.createdAt ? formatDistanceToNow(new Date(project.createdAt), { addSuffix: true }) : 'Unknown'}
                        </span>
                        
                        <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
                          {/* e.preventDefault needed to stop Link navigation when clicking delete */}
                          <CyberButton 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(project.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </CyberButton>
                        </div>
                      </div>
                    </CyberCard>
                 </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
