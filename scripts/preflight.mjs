import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = path => readFileSync(resolve(root, path), "utf8");
const failures = [];
const check = (condition, message) => {
  if (condition) console.log("PASS", message);
  else { console.error("FAIL", message); failures.push(message); }
};

for (const path of [
  "index.html", "style.css", "script.js", "admin.html", "admin.css", "admin.js",
  "supabase-config.js", "SUPABASE_SETUP.md",
  "supabase/migrations/202610260001_flowerine_store.sql",
  "supabase/migrations/202610260002_atomic_order_inventory.sql",
  "supabase/functions/create-order/index.ts"
]) check(existsSync(resolve(root, path)), "required file exists: " + path);

const html = read("index.html");
const ids = ["productGrid","bouquetBuilder","deliveryDate","orderOccasion","whatsappOrderButton","orderForm","checkoutModal","newsletterForm"];
for (const id of ids) check(html.includes('id="' + id + '"'), "storefront contains #" + id);

for (const path of ["script.js","admin.js"]) {
  const code = read(path);
  check(!code.includes("SUPABASE_SERVICE_ROLE_KEY") && !code.includes("service_role"), path + " contains no service-role credential reference");
}
const config = read("supabase-config.js");
check(config.includes("YOUR_PROJECT_REF") || config.includes("YOUR_SUPABASE_ANON_KEY") || config.includes("YOUR_SUPABASE_PUBLISHABLE_KEY"),
  "browser config uses explicit placeholders until owner configures Supabase");

const schema = read("supabase/migrations/202610260001_flowerine_store.sql");
const inventory = read("supabase/migrations/202610260002_atomic_order_inventory.sql");
check(schema.includes("enable row level security") && schema.includes("Admins manage products"), "database schema enables RLS and admin-only product writes");
check(inventory.includes("for update") && inventory.includes("stock = stock - qty"), "order migration locks and decrements product inventory");
check(inventory.includes("revoke all on function") && inventory.includes("to service_role"), "order RPC is restricted to service_role");
const edge = read("supabase/functions/create-order/index.ts");
check(edge.includes('rpc("create_flowerine_order"') && edge.includes("SUPABASE_SERVICE_ROLE_KEY"), "Edge Function calls the server-side order RPC using an environment secret");
const setup = read("SUPABASE_SETUP.md");
check(setup.includes("rate limiting") && setup.includes("never put a") , "setup guide documents production security limitations");

if (failures.length) {
  console.error("\nPreflight failed with " + failures.length + " issue(s).");
  process.exitCode = 1;
} else {
  console.log("\nPreflight passed. This checks repository structure only; it does not test a live Supabase project.");
}
