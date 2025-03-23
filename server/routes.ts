import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFileSchema, insertUserSchema } from "@shared/schema";
import * as Agent from '@dfinity/agent';
import * as Principal from '@dfinity/principal';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

interface WhoAmIResponse {
  principal: string;
}

async function mockWhoami(identity: any): Promise<WhoAmIResponse> {
  if (!identity || identity === 'anonymous') {
    return {
      principal: '2vxsx-fae'
    };
  }
  
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  const segments = [
    Array(5).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join(''),
    Array(5).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join(''),
    Array(5).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join(''),
    Array(5).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join(''),
    Array(3).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('')
  ];
  
  return {
    principal: segments.join('-')
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/whoami", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      let identity = 'anonymous';
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        identity = authHeader.substring(7);
      }
      
      const response = await mockWhoami(identity);
      
      setTimeout(() => {
        res.json(response);
      }, 500);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ 
        id: user.id, 
        username: user.username 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const newUser = await storage.createUser(validatedData);
      res.status(201).json({ 
        id: newUser.id, 
        username: newUser.username 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/files", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const files = await storage.getFilesByUser(userId);
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/files/:id", async (req: Request, res: Response) => {
    try {
      const fileId = parseInt(req.params.id);
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }
      
      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.json(file);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/files", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFileSchema.parse(req.body);
      const newFile = await storage.createFile(validatedData);
      res.status(201).json(newFile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/files/:id", async (req: Request, res: Response) => {
    try {
      const fileId = parseInt(req.params.id);
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }
      
      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      const updatedFile = await storage.updateFile(fileId, req.body);
      res.json(updatedFile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/files/:id", async (req: Request, res: Response) => {
    try {
      const fileId = parseInt(req.params.id);
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }
      
      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      await storage.deleteFile(fileId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/recent-files", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const recentFiles = await storage.getRecentFilesByUser(userId);
      res.json(recentFiles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/recent-files", async (req: Request, res: Response) => {
    try {
      const { fileId, userId } = req.body;
      
      if (!fileId || !userId) {
        return res.status(400).json({ message: "File ID and User ID are required" });
      }
      
      const recentFile = await storage.addRecentFile({
        fileId,
        userId,
        openedAt: new Date().toISOString()
      });
      
      res.status(201).json(recentFile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/blockchain/block/:blockNumber", async (req: Request, res: Response) => {
    try {
      const blockNumber = req.params.blockNumber;
      const apiUrl = `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${blockNumber}&boolean=true`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/chat/blockchain", async (req: Request, res: Response) => {
    try {
      const { command } = req.body;
      
      if (!command) {
        return res.status(400).json({ message: "Command is required" });
      }
      
      let blockNumber = "latest";
      
      const blockRegex = /block\s*([\+\-])\s*(\d+)/i;
      const match = command.match(blockRegex);
      
      if (match) {
        const [_, operation, numberStr] = match;
        const number = parseInt(numberStr);
        
        if (operation === "+") {
          try {
            const apiKey = process.env.ETHERSCAN_API_KEY;
            const latestResponse = await fetch(`https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${apiKey}`);
            const responseText = await latestResponse.text();
            
            const latestData = JSON.parse(responseText);
            
            if (latestData && latestData.result) {
              const latestBlockHex = latestData.result;
              const latestBlockNumber = parseInt(latestBlockHex, 16);
              blockNumber = "0x" + (latestBlockNumber + number).toString(16);
            }
          } catch (e) {
            console.error("Failed to fetch latest block number:", e);
          }
        } else if (operation === "-") {
          try {
            const apiKey = process.env.ETHERSCAN_API_KEY;
            const latestResponse = await fetch(`https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${apiKey}`);
            const responseText = await latestResponse.text();
            
            const latestData = JSON.parse(responseText);
            
            if (latestData && latestData.result) {
              const latestBlockHex = latestData.result;
              const latestBlockNumber = parseInt(latestBlockHex, 16);
              blockNumber = "0x" + (latestBlockNumber - number).toString(16);
            }
          } catch (e) {
            console.error("Failed to fetch latest block number:", e);
          }
        }
      }
      
      const apiKey = process.env.ETHERSCAN_API_KEY;
      const apiUrl = `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${blockNumber}&boolean=true&apikey=${apiKey}`;
      console.log(`Fetching block data from: ${apiUrl}`);
      const response = await fetch(apiUrl);
      const responseText = await response.text();
      
      let blockInfo = null;
      try {
        const data = JSON.parse(responseText);
        blockInfo = data.result || null;
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
      }
      
      const formattedResponse = {
        command,
        blockNumber: blockNumber === "latest" ? "最新ブロック" : blockNumber,
        blockInfo,
        timestamp: new Date().toISOString()
      };
      
      res.json(formattedResponse);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/chat/blockchain", async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.ETHERSCAN_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "ETHERSCAN_API_KEY is not defined" });
      }

      const apiUrl = `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${apiKey}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/chat/price", async (req: Request, res: Response) => {
    try {
      let currency = req.query.currency as string;

      if (!currency) {
        return res.status(400).json({ message: "Currency is required" });
      }

      if (currency.toUpperCase() === "ICP") {
        currency = "internet-computer";
      }

      const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${currency.toLowerCase()}&vs_currencies=jpy`;
      console.log(`API URL: ${apiUrl}`);
      const apiKey = process.env.COINGECKO_API_KEY;
      const headers = apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {};

      console.log(`Fetching price data from: ${apiUrl}`);
      const response = await fetch(apiUrl, { headers });
      const data = await response.json();

      if (!data || !data[currency.toLowerCase()] || !data[currency.toLowerCase()].jpy) {
        return res.status(404).json({ message: `Price data for ${currency} not found` });
      }

      const formattedResponse = {
        currency: currency.toUpperCase(),
        price: data[currency.toLowerCase()].jpy,
        timestamp: new Date().toISOString(),
      };

      res.json(formattedResponse);
    } catch (error: any) {
      console.error("Error fetching price data:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
