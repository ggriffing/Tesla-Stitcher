import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Projects API
  app.get(api.projects.list.path, async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get(api.projects.get.path, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  });

  app.post(api.projects.create.path, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const project = await storage.createProject(input);
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.projects.update.path, async (req, res) => {
    try {
      const input = api.projects.update.input.parse(req.body);
      const project = await storage.updateProject(Number(req.params.id), input);
      res.json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete(api.projects.delete.path, async (req, res) => {
    await storage.deleteProject(Number(req.params.id));
    res.status(204).send();
  });

  // Export Camcorder View API
  app.post(api.export.camcorder.path, async (req, res) => {
    try {
      const { view, filename, telemetry } = api.export.camcorder.input.parse(req.body);
      
      // Look for the file in attached_assets. If not found, try to find ANY mp4 for demo purposes.
      let videoPath = path.resolve("attached_assets", filename);
      
      if (!fs.existsSync(videoPath)) {
        // Demo fallback: use the first .mp4 file found in attached_assets if the requested one doesn't exist
        const files = fs.readdirSync(path.resolve("attached_assets"));
        const mp4File = files.find(f => f.endsWith(".mp4"));
        if (mp4File) {
          videoPath = path.resolve("attached_assets", mp4File);
        } else {
          return res.status(400).json({ message: `No video files (.mp4) found in attached_assets. Please ensure a video is available for export.` });
        }
      }

      // Create a temporary directory for export if it doesn't exist
      const exportDir = path.resolve("client/public/exports");
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const outputFilename = `camcorder_${view}_${Date.now()}.mp4`;
      const outputPath = path.join(exportDir, outputFilename);

      // Create telemetry overlay filter
      // We take the telemetry data and create a drawtext filter for FFmpeg
      // For simplicity in this demo, we'll overlay just the speed and gear at the bottom
      // In a real app, you'd generate a more complex filter or even a temporary subtitle file
      const speed = telemetry[0]?.speed || "0";
      const gear = telemetry[0]?.gear || "P";
      const overlayText = `SPEED: ${speed} MPH | GEAR: ${gear}`;

      const ffmpeg = spawn("ffmpeg", [
        "-i", videoPath,
        "-vf", `drawtext=text='${overlayText}':x=(w-text_w)/2:y=h-th-20:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=5,format=yuv420p`,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-c:a", "copy",
        "-t", "5",
        "-y",
        outputPath
      ]);

      ffmpeg.stderr.on("data", (data) => {
        console.error(`FFmpeg stderr: ${data}`);
      });

      ffmpeg.on("close", (code) => {
        if (code !== 0) {
          console.error(`FFmpeg process exited with code ${code}`);
          return res.status(500).json({ message: "Export failed" });
        }
        res.json({ url: `/exports/${outputFilename}` });
      });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Metadata Extraction API
  app.post(api.metadata.extract.path, async (req, res) => {
    try {
      const { filename } = api.metadata.extract.input.parse(req.body);
      // In a real app, filename would be a path to an uploaded file.
      // For this demo, we assume the file exists in a known location or we mock the response.
      // Note: SEI extraction requires the actual .mp4 file on the server.
      
      const scriptPath = path.resolve("server/scripts/sei_extractor.py");
      const videoPath = path.resolve("attached_assets", filename);

      if (!fs.existsSync(videoPath)) {
        return res.status(400).json({ message: `Video file ${filename} not found on server.` });
      }

      const pythonProcess = spawn("python3", [scriptPath, videoPath]);
      let data = "";
      let error = "";

      pythonProcess.stdout.on("data", (chunk) => {
        data += chunk.toString();
      });

      pythonProcess.stderr.on("data", (chunk) => {
        error += chunk.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          return res.status(500).json({ message: "Extraction failed", error });
        }
        
        // Parse CSV output
        const lines = data.trim().split("\n");
        if (lines.length < 2) {
          return res.json([]);
        }

        const headers = lines[0].split(",");
        const results = lines.slice(1).map(line => {
          const values = line.split(",");
          const obj: any = {};
          headers.forEach((h, i) => obj[h] = values[i]);
          return obj;
        });

        res.json(results);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getProjects();
  if (existing.length === 0) {
    await storage.createProject({
      name: "Default Configuration",
      description: "Standard Tesla Model 3/Y camera layout",
      layoutConfig: {
        front: { scale: 1, position: [0, 0, -5], rotation: [0, 0, 0] },
        back: { scale: 1, position: [0, 0, 5], rotation: [0, Math.PI, 0] },
        left: { scale: 1, position: [-5, 0, 0], rotation: [0, Math.PI / 2, 0] },
        right: { scale: 1, position: [5, 0, 0], rotation: [0, -Math.PI / 2, 0] },
        syncOffsets: { front: 0, back: 0, left: 0, right: 0 }
      }
    });
  }
}

seedDatabase().catch(console.error);
