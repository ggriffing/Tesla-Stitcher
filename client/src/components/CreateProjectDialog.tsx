import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { CyberButton } from "./CyberButton";
import { CyberInput } from "./CyberInput";
import { useCreateProject } from "@/hooks/use-projects";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_CONFIG = {
  front: { scale: 1, position: [0, 0, -5] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
  back: { scale: 1, position: [0, 0, 5] as [number, number, number], rotation: [0, 3.14, 0] as [number, number, number] },
  left: { scale: 1, position: [-5, 0, 0] as [number, number, number], rotation: [0, 1.57, 0] as [number, number, number] },
  right: { scale: 1, position: [5, 0, 0] as [number, number, number], rotation: [0, -1.57, 0] as [number, number, number] },
  syncOffsets: { front: 0, back: 0, left: 0, right: 0 },
};

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createProject = useCreateProject();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createProject.mutateAsync({
        name,
        description,
        layoutConfig: DEFAULT_CONFIG,
      });
      setOpen(false);
      setName("");
      setDescription("");
      toast({
        title: "Project Initialized",
        description: "New visualization environment ready.",
        className: "bg-background border-primary text-primary font-mono",
      });
    } catch (error) {
      toast({
        title: "Initialization Failed",
        description: "Could not create project.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <CyberButton>Initialize New Project</CyberButton>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-white/10 bg-background p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <Dialog.Title className="text-xl font-display font-bold uppercase tracking-widest text-primary text-glow">
              New Project Manifest
            </Dialog.Title>
            <Dialog.Description className="text-muted-foreground font-mono text-xs">
              Configure parameters for new dashcam visualization instance.
            </Dialog.Description>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <CyberInput
              label="Project Designation"
              placeholder="e.g. HIGHWAY_INCIDENT_001"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-primary uppercase tracking-widest ml-1">
                Description (Optional)
              </label>
              <textarea
                className="w-full bg-background/50 border border-white/10 px-4 py-3 text-foreground font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-200 min-h-[100px]"
                placeholder="Additional context data..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Dialog.Close asChild>
                <CyberButton type="button" variant="ghost">Abort</CyberButton>
              </Dialog.Close>
              <CyberButton type="submit" isLoading={createProject.isPending}>
                Initialize
              </CyberButton>
            </div>
          </form>

          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4 text-primary" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
