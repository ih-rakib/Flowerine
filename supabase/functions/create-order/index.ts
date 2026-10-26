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
    let total = 0;
    const safeItems = [];
    for (const item of body.items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return response({ error: "Invalid quantity" }, 400);
      if (String(item.id).startsWith("custom-")) {
        const d = item.details || {};
        const sizes: Record<string, number> = { Small: 18, Medium: 30, Large: 48 };
        const wraps: Record<string, number> = { "Classic kraft": 0, "Blush premium": 4, "Luxe fabric": 8 };
        if (!(d.size in sizes) || !(d.wrapping in wraps)) return response({ error: "Invalid custom bouquet choices" }, 400);
        const unit = sizes[d.size] + wraps[d.wrapping];
        total += unit * quantity;
        safeItems.push({ name: "Custom Bouquet", quantity, unit_price: unit, details: {
          style: String(d.style || "").slice(0,80), size: d.size, wrapping: d.wrapping,
          colour: String(d.colour || "").slice(0,80), cardMessage: String(d.cardMessage || "").slice(0,240)
        }});
      } else {
        const { data: product, error } = await admin.from("products").select("id,name,price,active,stock").eq("id", String(item.id)).maybeSingle();
        if (error || !product || !product.active) return response({ error: "A selected product is unavailable" }, 409);
        if (product.stock < quantity) return response({ error: "Insufficient stock for " + product.name }, 409);
        const unit = Number(product.price);
        total += unit * quantity;
        safeItems.push({ id: product.id, name: product.name, quantity, unit_price: unit });
      }
    }
    if (!Number.isFinite(total) || total > 1000000) return response({ error: "Order total is invalid" }, 400);
    const { data, error } = await admin.from("orders").insert({
      customer_name: body.customer_name.trim(), email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(), delivery_address: body.delivery_address.trim(),
      delivery_date: body.delivery_date, occasion: body.occasion.trim().slice(0,80),
      notes: String(body.notes || "").trim(), items: safeItems, estimated_subtotal: total, status: "pending"
    }).select("id,status,estimated_subtotal").single();
    if (error) return response({ error: "Could not save order" }, 500);
    return response({ order: data }, 201);
  } catch {
    return response({ error: "Invalid request body" }, 400);
  }
});
