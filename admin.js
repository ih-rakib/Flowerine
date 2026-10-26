(() => {
"use strict";
const $ = s => document.querySelector(s);
const formatMoney = value => "৳" + Math.round(Number(value) || 0).toLocaleString("en-BD");
const formatMoney = value => "৳" + Math.round(Number(value) || 0).toLocaleString("en-BD");
const config = window.FLOWERINE_SUPABASE || {};
const client = window.supabase?.createClient && config.url && config.anonKey && !config.url.includes("YOUR_PROJECT_REF") && !config.anonKey.includes("YOUR_SUPABASE") ? window.supabase.createClient(config.url,config.anonKey) : null;
const status = (id,msg) => { $(id).textContent = msg; };
function escapeHtml(v){return String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function configReady(){if(!client){status("#loginMessage","Configure the Supabase project URL and publishable/anon key in supabase-config.js first.");$("#adminLogin").querySelector("button").disabled=true;return false;}return true;}
async function isAdmin(userId){const {data,error}=await client.from("admin_users").select("user_id").eq("user_id",userId).maybeSingle();return !error && !!data;}
async function showSession(session){
 if(!session){$("#loginPanel").hidden=false;$("#dashboard").hidden=true;return;}
 const allowed=await isAdmin(session.user.id);
 if(!allowed){await client.auth.signOut();$("#loginPanel").hidden=false;$("#dashboard").hidden=true;status("#loginMessage","This account is not on the Flowerine admin allow-list.");return;}
 $("#loginPanel").hidden=true;$("#dashboard").hidden=false;await loadProducts();
}
$("#adminLogin").addEventListener("submit",async e=>{e.preventDefault();if(!configReady())return;const btn=e.currentTarget.querySelector("button");btn.disabled=true;status("#loginMessage","Signing in…");const {data,error}=await client.auth.signInWithPassword({email:$("#adminEmail").value.trim(),password:$("#adminPassword").value});btn.disabled=false;if(error){status("#loginMessage","Sign-in failed. Check your credentials and Supabase Auth settings.");return;}await showSession(data.session);});
$("#adminLogout").addEventListener("click",async()=>{await client.auth.signOut();await showSession(null);});
$$adminTabs();
function $$adminTabs(){$$(".admin-tabs button").forEach(btn=>btn.addEventListener("click",()=>{ $$(".admin-tabs button").forEach(b=>b.classList.toggle("active",b===btn));$("#productsTab").hidden=btn.dataset.adminTab!=="products";$("#ordersTab").hidden=btn.dataset.adminTab!=="orders";if(btn.dataset.adminTab==="orders")loadOrders();}));}
async function loadProducts(){
 const box=$("#productTable");box.innerHTML="<p>Loading inventory…</p>";
 const {data,error}=await client.from("products").select("id,name,description,image_url,price,stock,active,categories").order("name");
 if(error){box.innerHTML='<p class="admin-error">Could not load products. Confirm the SQL migration and admin permissions.</p>';return;}
 if(!data.length){box.innerHTML="<p>No database products yet. Add your first product using the form above.</p>";return;}
 box.innerHTML='<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Visibility</th><th>Action</th></tr></thead><tbody>'+data.map(p=>'<tr><td>'+escapeHtml(p.name)+'<small>'+escapeHtml((p.categories||[]).join(", "))+'</small></td><td>'+formatMoney(p.price)+'</td><td>'+p.stock+'</td><td>'+(p.active?"Visible":"Hidden")+'</td><td><button class="admin-small" data-edit-product="'+p.id+'">Edit</button></td></tr>').join("")+'</tbody></table></div>';
 box.querySelectorAll("[data-edit-product]").forEach(b=>b.addEventListener("click",()=>fillProduct(data.find(p=>p.id===b.dataset.editProduct))));
}
function fillProduct(p){$("#productId").value=p.id;$("#productName").value=p.name;$("#productDescription").value=p.description||"";$("#productPrice").value=p.price;$("#productStock").value=p.stock;$("#productImage").value=p.image_url||"";$("#productCategories").value=(p.categories||[]).join(", ");$("#productActive").checked=p.active;$("#productName").focus();}
$("#productForm").addEventListener("submit",async e=>{e.preventDefault();if(!client)return;const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;status("#productMessage","Saving product…");const id=$("#productId").value;const payload={name:$("#productName").value.trim(),description:$("#productDescription").value.trim(),price:Number($("#productPrice").value),stock:Number($("#productStock").value),image_url:$("#productImage").value.trim(),categories:$("#productCategories").value.split(",").map(x=>x.trim().toLowerCase()).filter(Boolean),active:$("#productActive").checked,updated_at:new Date().toISOString()};const result=id?await client.from("products").update(payload).eq("id",id):await client.from("products").insert(payload);btn.disabled=false;if(result.error){status("#productMessage","Save failed. Check required fields and admin database permissions.");return;}status("#productMessage","Product saved.");e.currentTarget.reset();$("#productId").value="";$("#productActive").checked=true;await loadProducts();});
$("#resetProduct").addEventListener("click",()=>{$("#productForm").reset();$("#productId").value="";$("#productActive").checked=true;status("#productMessage","");});
$("#refreshProducts").addEventListener("click",loadProducts);
async function loadOrders(){const box=$("#orderTable");box.innerHTML="<p>Loading orders…</p>";const {data,error}=await client.from("orders").select("*").order("created_at",{ascending:false}).limit(100);if(error){box.innerHTML='<p class="admin-error">Could not load orders. Confirm the migration and admin permissions.</p>';return;}if(!data.length){box.innerHTML="<p>No orders have been submitted to the Supabase order table yet.</p>";return;}box.innerHTML='<div class="admin-order-list">'+data.map(o=>'<article class="admin-order"><div class="admin-order-top"><div><strong>Order '+escapeHtml(o.id.slice(0,8))+'</strong><small>'+escapeHtml(new Date(o.created_at).toLocaleString())+'</small></div><strong>'+formatMoney(o.estimated_subtotal)+'</strong></div><p><b>'+escapeHtml(o.customer_name)+'</b> · '+escapeHtml(o.email)+' · '+escapeHtml(o.phone)+'</p><p>'+escapeHtml(o.delivery_date)+' · '+escapeHtml(o.occasion)+' · '+escapeHtml(o.delivery_address)+'</p><pre>'+escapeHtml(JSON.stringify(o.items,null,2))+'</pre><label>Status <select data-order-status="'+o.id+'">'+["pending","confirmed","preparing","out_for_delivery","completed","cancelled"].map(s=>'<option'+(s===o.status?' selected':'')+'>'+s+'</option>').join("")+'</select></label></article>').join("")+'</div>';
 box.querySelectorAll("[data-order-status]").forEach(sel=>sel.addEventListener("change",async()=>{const {error}=await client.from("orders").update({status:sel.value}).eq("id",sel.dataset.orderStatus);if(error){alert("Status update failed. Check admin permissions.");await loadOrders();}}));
}
$("#refreshOrders").addEventListener("click",loadOrders);
if(configReady()){client.auth.getSession().then(({data})=>showSession(data.session));client.auth.onAuthStateChange((_event,session)=>{if(session)showSession(session);});}
})();