import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

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
      // If project not found (storage throws or returns null/undefined depending on impl, 
      // but here updateProject throws if we don't catch it, or just returns. 
      // Safe to assume 404 if not successful in many ORMs, but here let's stick to simple success)
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete(api.projects.delete.path, async (req, res) => {
    await storage.deleteProject(Number(req.params.id));
    res.status(204).send();
  });

  return httpServer;
}

// Seed function to create an example project configuration
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

// Execute seed
seedDatabase().catch(console.error);
