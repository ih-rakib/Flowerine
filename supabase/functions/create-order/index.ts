import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" }
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json();
    const required = ["customer_name","email","phone","delivery_address","delivery_date","occasion"];
    for (const field of required) if (typeof body[field] !== "string" || !body[field].trim()) return response({ error: "Missing required field: " + field }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 160) return response({ error: "Invalid email" }, 400);
    if (body.customer_name.length > 100 || body.phone.length > 40 || body.delivery_address.length > 600 || String(body.notes || "").length > 600) return response({ error: "A field is too long" }, 400);
    const date = new Date(body.delivery_date + "T00:00:00Z");
    if (Number.isNaN(date.getTime()) || body.delivery_date < new Date().toISOString().slice(0,10)) return response({ error: "Delivery date must be today or later" }, 400);
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) return response({ error: "Invalid order items" }, 400);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return response({ error: "Order service is not configured" }, 500);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data, error } = await admin.rpc("create_flowerine_order", {
      p_customer_name: body.customer_name.trim(),
      p_email: body.email.trim().toLowerCase(),
      p_phone: body.phone.trim(),
      p_delivery_address: body.delivery_address.trim(),
      p_delivery_date: body.delivery_date,
      p_occasion: body.occasion.trim().slice(0,80),
      p_notes: String(body.notes || "").trim(),
      p_items: body.items
    });
    if (error) {
      const status = error.code === "P0001" || error.code === "P0002" ? 409 : error.code === "22023" ? 400 : 500;
      return response({ error: status === 409 ? error.message : status === 400 ? "Invalid order details or items" : "Could not save order" }, status);
    }
    return response({ order: data }, 201);
  } catch {
    return response({ error: "Invalid request body" }, 400);
  }
});
