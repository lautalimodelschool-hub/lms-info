import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing in server environment. Notifications will fail.");
}

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", supabase: !!supabase });
  });

  // Notifications via Supabase
  app.get("/api/notifications", async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ error: "Supabase not configured" });
    }
    const userId = req.query.userId;
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (userId) {
        // Use parameterized or safe filtering for personal notifications
        query = query.or(`user_id.is.null,user_id.eq."${userId}"`);
      } else {
        query = query.is('user_id', null);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      console.error("Fetch Notifications Error:", error.message || error);
      res.status(500).json({ error: "Failed to fetch notifications", details: error.message });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ error: "Supabase not configured" });
    }
    const { title, message, type, user_id } = req.body;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{ title, message, type, read: false, user_id: user_id || null }])
        .select()
        .single();
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error("Create Notification Error:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  app.post("/api/notifications/push", async (req, res) => {
    const { title, body } = req.body;
    
    // In a real production app, you would use the Firebase Admin SDK here:
    // admin.messaging().sendToDevice(tokens, { notification: { title, body } })
    
    // For now, we'll log it and return success since we don't have the FCM Server Key
    console.log(`[FCM Push Triggered] Title: ${title}, Body: ${body}`);
    
    res.json({ success: true, message: "Push notification triggered (mocked in server without FCM key)" });
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ error: "Supabase not configured" });
    }
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', req.params.id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error("Delete Notification Error:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ error: "Supabase not configured" });
    }
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', req.params.id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error("Update Notification Error:", error.message || error);
      res.status(500).json({ error: "Failed to update notification" });
    }
  });

  // Proxy for Eduflex API (to avoid CORS)
  app.get("/api/school/students", async (req, res) => {
    const { page, limit, class: className, shift, medium, academicYear } = req.query;
    const url = new URL("https://lmsc.server.eduflexbd.com/api/allstudents");
    if (page) url.searchParams.append("page", page as string);
    if (limit) url.searchParams.append("limit", limit as string);
    if (className) url.searchParams.append("class", className as string);
    if (shift) url.searchParams.append("shift", shift as string);
    if (medium) url.searchParams.append("medium", medium as string);
    if (academicYear) url.searchParams.append("academicYear", academicYear as string);

    try {
      console.log(`Proxying request to Eduflex Students: ${url.toString()}`);
      const response = await axios.get(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        validateStatus: () => true // Don't throw on error status
      });
      
      if (response.status !== 200) {
        console.error(`Eduflex Students API returned ${response.status}: ${JSON.stringify(response.data)}`);
        return res.status(response.status).json({ error: "Eduflex API error", details: response.data });
      }

      res.json(response.data);
    } catch (error: any) {
      console.error("Eduflex Students Proxy Error:", error.message || error);
      res.status(500).json({ error: "Failed to fetch students from Eduflex", details: error.message });
    }
  });

  app.get("/api/school/employees", async (req, res) => {
    const { page, limit } = req.query;
    const url = new URL("https://lmsc.server.eduflexbd.com/api/teacher-employees");
    if (page) url.searchParams.append("page", page as string);
    if (limit) url.searchParams.append("limit", limit as string);

    try {
      console.log(`Proxying request to Eduflex Employees: ${url.toString()}`);
      const response = await axios.get(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        validateStatus: () => true
      });

      if (response.status !== 200) {
        console.error(`Eduflex Employees API returned ${response.status}: ${JSON.stringify(response.data)}`);
        return res.status(response.status).json({ error: "Eduflex API error", details: response.data });
      }

      res.json(response.data);
    } catch (error: any) {
      console.error("Eduflex Employees Proxy Error:", error.message || error);
      res.status(500).json({ error: "Failed to fetch employees from Eduflex", details: error.message });
    }
  });

  // Proxy for BulkSMS API
  app.get("/api/sms/send", async (req, res) => {
    const { api_key, type, number, senderid, message } = req.query;
    const url = `https://bulksmsbd.net/api/smsapi?api_key=${api_key}&type=${type}&number=${number}&senderid=${senderid}&message=${encodeURIComponent(message as string)}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("SMS Proxy Error:", error);
      res.status(500).json({ error: "Failed to send SMS via proxy" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
