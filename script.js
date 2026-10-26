(() => {
  "use strict";
  const products = {
    blush:{name:"Blush Hour Bouquet",price:32,image:"images/flower1.png"},
    cherry:{name:"Cherry Blossom Daydream",price:28,image:"images/flower2.png"},
    garden:{name:"The Garden Party",price:36,image:"images/flower3.png"},
    peony:{name:"Peony Promise",price:42,image:"images/pngwing1.png"},
    rosy:{name:"Rosy Ever After",price:38,image:"images/pngwing2.png"},
    spring:{name:"A Spring Whisper",price:25,image:"images/pngwing3.png"},
    signature:{name:"The Signature Stem",price:30,image:"images/pngwing4.png"},
    celebrate:{name:"Little Celebration",price:45,image:"images/pngwing8.png"}
  };
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const cart = new Map();
  let customSequence = 0;
  const supabaseConfig = window.FLOWERINE_SUPABASE || {};
  const supabaseClient = window.supabase?.createClient && supabaseConfig.url && supabaseConfig.anonKey &&
    !supabaseConfig.url.includes("YOUR_PROJECT_REF") && !supabaseConfig.anonKey.includes("YOUR_SUPABASE")
    ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey) : null;
  // Preserve saved cart entries until the configured live catalogue has loaded.
  const pendingSavedCart = [];
  try {
    const savedCart = JSON.parse(localStorage.getItem("flowerine-cart") || "[]");
    if (Array.isArray(savedCart)) {
      savedCart.forEach(entry => {
        if (!Array.isArray(entry) || entry.length !== 2) return;
        const [id, qty] = entry;
        if (!Number.isInteger(qty) || qty < 1 || qty > 99) return;
        if (supabaseClient) pendingSavedCart.push([id, qty]);
        else if (products[id]) cart.set(id, qty);
      });
    }
  } catch (_) { /* Storage may be unavailable; the in-memory bag still works. */ }
  function persistCart() {
    try { localStorage.setItem("flowerine-cart", JSON.stringify([...cart.entries()])); }
    catch (_) { /* Shopping still works for the current page if storage is blocked. */ }
  }
  const grid = $("#productGrid");
  const drawer = $("#cartDrawer");
  const backdrop = $("#drawerBackdrop");
  const toast = $("#toast");
  let toastTimer;
  let activeFilter = "all";
  function showToast(message){
    toast.textContent = message; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }
  function applyFilters(){
    const query = ($("#productSearch")?.value || "").trim().toLowerCase();
    let visible = 0;
    $$(".product-card", grid).forEach(card => {
      const matchesCategory = activeFilter === "all" || card.dataset.category.split(" ").includes(activeFilter);
      const matchesSearch = !query || (card.dataset.name + " " + card.textContent).toLowerCase().includes(query);
      card.hidden = !(matchesCategory && matchesSearch);
      if (!card.hidden) visible++;
    });
    $("#resultCount").textContent = visible + (visible === 1 ? " lovely find" : " lovely finds");
    $("#emptyState").hidden = visible !== 0;
  }
  $$(".filter-chip").forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    $$(".filter-chip").forEach(chip => chip.classList.toggle("active", chip === button));
    applyFilters();
  }));
  $("#searchToggle").addEventListener("click", () => {
    const bar = $("#searchBar"); bar.hidden = !bar.hidden;
    if (!bar.hidden) $("#productSearch").focus();
  });
  $("#productSearch").addEventListener("input", applyFilters);
  $("#clearSearch").addEventListener("click", () => { $("#productSearch").value = ""; applyFilters(); $("#productSearch").focus(); });
  $("#menuToggle").addEventListener("click", () => {
    const open = $("#mainNav").classList.toggle("open");
    $("#menuToggle").setAttribute("aria-expanded", String(open));
    $("#menuToggle").setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    $("#menuToggle").textContent = open ? "×" : "☰";
  });
  $$("#mainNav a").forEach(link => link.addEventListener("click", () => {
    $("#mainNav").classList.remove("open"); $("#menuToggle").setAttribute("aria-expanded","false"); $("#menuToggle").textContent = "☰";
  }));
  function bindProductActions() {
  $(".quick-add", grid).forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.add;
    const currentQty = cart.get(id) || 0;
    if (currentQty >= 99) { showToast("Maximum quantity for one item is 99."); return; }
    cart.set(id, currentQty + 1);
    renderCart(); showToast(products[id].name + " added to your bag");
  }));
  $(".wishlist", grid).forEach(button => button.addEventListener("click", () => {
    const saved = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(saved)); button.textContent = saved ? "♥" : "♡";
    showToast(saved ? "Saved to your favourites" : "Removed from your favourites");
  }));
  }
  bindProductActions();
  function renderCart(){
    persistCart();
    const count = [...cart.values()].reduce((sum,n) => sum+n,0);
    $("#cartCount").textContent = count; $("#drawerCount").textContent = "(" + count + ")";
    const items = $("#cartItems");
    if (!count) { items.innerHTML = '<p class="cart-empty">Your bag is waiting for something lovely. ♡</p>'; }
    else {
      items.innerHTML = [...cart.entries()].map(([id,qty]) => {
        const p = products[id];
        return '<article class="cart-item"><img src="' + p.image + '" alt=""><div><h3>' + p.name + '</h3><p class="item-price">$' + p.price.toFixed(2) + '</p><div class="quantity-controls"><button type="button" data-qty="-1" data-id="' + id + '" aria-label="Decrease quantity">−</button><span>' + qty + '</span><button type="button" data-qty="1" data-id="' + id + '" aria-label="Increase quantity">+</button></div></div><button class="remove-item" type="button" data-remove="' + id + '" aria-label="Remove ' + p.name + '">×</button></article>';
      }).join("");
    }
    const subtotal = [...cart.entries()].reduce((sum,[id,qty]) => sum + products[id].price*qty,0);
    $("#cartSubtotal").textContent = "$" + subtotal.toFixed(2);
  }
  $("#cartItems").addEventListener("click", event => {
    const qtyButton = event.target.closest("[data-qty]");
    const removeButton = event.target.closest("[data-remove]");
    if (qtyButton) {
      const id = qtyButton.dataset.id, next = (cart.get(id)||0) + Number(qtyButton.dataset.qty);
      if (next <= 0) cart.delete(id); else if (next <= 99) cart.set(id,next);
      renderCart();
    } else if (removeButton) { cart.delete(removeButton.dataset.remove); renderCart(); }
  });
  function openCart(){
    drawer.hidden = false; backdrop.hidden = false; document.body.classList.add("drawer-open");
    $("#cartClose").focus();
  }
  function closeCart(){
    drawer.hidden = true; backdrop.hidden = true; document.body.classList.remove("drawer-open");
    $("#cartToggle").focus();
  }
  $("#cartToggle").addEventListener("click", openCart);
  $("#cartClose").addEventListener("click", closeCart);
  $("#continueShopping").addEventListener("click", closeCart);
  backdrop.addEventListener("click", closeCart);
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !drawer.hidden) closeCart(); });
  const formSubmitEndpoint = "https://formsubmit.co/ajax/hasanrakib3590@gmail.com";
  const builderSize = $("#builderSize");
  const builderWrap = $("#builderWrap");
  function updateBuilderPrice() {
    const size = Number(builderSize.selectedOptions[0].dataset.price || 0);
    const wrap = Number(builderWrap.selectedOptions[0].dataset.price || 0);
    $("#builderPrice").textContent = "$" + (size + wrap).toFixed(2);
  }
  builderSize.addEventListener("change", updateBuilderPrice);
  builderWrap.addEventListener("change", updateBuilderPrice);
  $("#bouquetBuilder").addEventListener("submit", event => {
    event.preventDefault();
    const size = builderSize.value, wrapping = builderWrap.value;
    const details = {style:$("#builderStyle").value,size,wrapping,colour:$("#builderColour").value,cardMessage:$("#builderMessage").value.trim()};
    const price = Number(builderSize.selectedOptions[0].dataset.price) + Number(builderWrap.selectedOptions[0].dataset.price);
    const id = "custom-" + (++customSequence);
    products[id] = {name:"Custom Bouquet — " + details.style,price,image:"images/flower3.png",details};
    cart.set(id,1); renderCart();
    $("#builderFeedback").textContent = "Your custom bouquet has been added to your bag.";
    showToast("Custom bouquet added to your bag");
  });
  updateBuilderPrice();
  const deliveryDateInput = $("#deliveryDate");
  const today = new Date();
  deliveryDateInput.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0,10);
  $("#whatsappOrderButton").addEventListener("click", () => {
    if (!cart.size) { $("#orderMessage").textContent = "Your bag is empty."; return; }
    const form = $("#orderForm");
    if (!form.reportValidity()) return;
    const number = String(window.FLOWERINE_WHATSAPP_NUMBER || "").replace(/\D/g,"");
    if (!/^\d{8,15}$/.test(number)) {
      $("#orderMessage").textContent = "WhatsApp is not configured yet. The shop owner must add the business number in supabase-config.js.";
      return;
    }
    const lines = [...cart.entries()].map(([id,qty]) => {
      const p = products[id];
      return qty + " × " + p.name + " — $" + (p.price * qty).toFixed(2) + (p.details ? " (" + Object.values(p.details).filter(Boolean).join(", ") + ")" : "");
    });
    const msg = ["Hello Flowerine, I'd like to request this order:",...lines,"Estimated subtotal: " + $("#cartSubtotal").textContent,
      "Name: " + $("#orderName").value,"Email: " + $("#orderEmail").value,"Phone: " + $("#orderPhone").value,
      "Delivery address: " + $("#orderAddress").value,"Delivery date: " + deliveryDateInput.value,"Occasion: " + $("#orderOccasion").value,
      "Notes: " + ($("#orderNotes").value || "None"),"Please confirm availability, delivery charges and payment details."].join("\n");
    window.open("https://wa.me/" + number + "?text=" + encodeURIComponent(msg), "_blank", "noopener,noreferrer");
  });
  async function loadSupabaseProducts() {
    if (!supabaseClient) return;
    const {data,error} = await supabaseClient.from("products").select("id,name,description,price,image_url,categories,stock").eq("active",true).order("name");
    if (error) { console.error("Flowerine catalogue could not be loaded:",error.message); grid.innerHTML = ""; $("#emptyState").textContent = "Our flower catalogue is temporarily unavailable. Please try again soon."; cart.clear(); applyFilters(); renderCart(); return; }
    if (!data?.length) { grid.innerHTML = ""; $("#emptyState").textContent = "Our flower catalogue is being prepared. Please check back soon."; cart.clear(); applyFilters(); renderCart(); return; }
    data.forEach(p => { products[p.id] = {name:p.name,price:Number(p.price),image:p.image_url || "images/flower3.png",description:p.description || "",stock:p.stock}; });
    const liveProductIds = new Set(data.map(p => p.id));
    pendingSavedCart.forEach(([id,qty]) => { if (liveProductIds.has(id)) cart.set(id, Math.min(99, qty)); });
    const esc = value => String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    grid.innerHTML = data.map(p => '<article class="product-card" data-id="' + esc(p.id) + '" data-category="' + esc((p.categories || []).join(" ")) + '" data-name="' + esc(p.name) + '" data-price="' + Number(p.price) + '"><div class="product-image"><button class="wishlist" aria-label="Save ' + esc(p.name) + '" aria-pressed="false">♡</button><img src="' + esc(p.image_url || "images/flower3.png") + '" alt="' + esc(p.name) + '" loading="lazy"><button class="quick-add" data-add="' + esc(p.id) + '">Add to bag <span>＋</span></button></div><div class="product-info"><div><h3>' + esc(p.name) + '</h3><p>' + esc(p.description || "") + '</p></div><strong>$' + Number(p.price).toFixed(2) + '</strong></div></article>').join("");
    bindProductActions();
    applyFilters();
    renderCart();
  }
  loadSupabaseProducts();
  const checkoutModal = $("#checkoutModal");
  function openCheckout() {
    if (!cart.size) { showToast("Your bag is empty. Add a bouquet you love first."); return; }
    $("#orderSummaryText").textContent = [...cart.entries()].map(([id,qty]) => qty + " × " + products[id].name).join("; ");
    $("#orderSummaryTotal").textContent = $("#cartSubtotal").textContent;
    $("#orderMessage").textContent = "";
    $("#submitOrderButton").disabled = false;
    $("#submitOrderButton").innerHTML = 'Send order request <span>↗</span>';
    checkoutModal.hidden = false;
    document.body.classList.add("drawer-open");
    $("#orderName").focus();
  }
  function closeCheckout() {
    checkoutModal.hidden = true;
    document.body.classList.remove("drawer-open");
    $("#checkoutButton").focus();
  }
  $("#checkoutButton").addEventListener("click", openCheckout);
  $("#checkoutClose").addEventListener("click", closeCheckout);
  checkoutModal.addEventListener("click", event => { if (event.target === checkoutModal) closeCheckout(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !checkoutModal.hidden) closeCheckout(); });

  async function sendToInbox(payload, subject) {
    payload._subject = subject;
    payload._template = "table";
    payload._captcha = "true";
    const response = await fetch(formSubmitEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok || !(data.success === true || data.success === "true")) {
      throw new Error(data.message || "The email service did not accept the submission.");
    }
    return data;
  }

  $("#orderForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!cart.size) { $("#orderMessage").textContent = "Your bag is empty. Add a product and try again."; return; }
    const form = event.currentTarget;
    const button = $("#submitOrderButton");
    const message = $("#orderMessage");
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.order_items = [...cart.entries()].map(([id,qty]) => {
      const p = products[id];
      return qty + " × " + p.name + " — $" + (p.price * qty).toFixed(2) + (p.details ? " | " + JSON.stringify(p.details) : "");
    }).join("\n");
    payload.estimated_subtotal = $("#cartSubtotal").textContent;
    payload.order_status = "Order request only — not yet confirmed or paid";
    payload.delivery_date = $("#deliveryDate").value;
    payload.occasion = $("#orderOccasion").value;
    payload._replyto = payload.email;
    button.disabled = true;
    button.textContent = "Sending request…";
    message.textContent = "Submitting your order request…";
    try {
      if (supabaseClient) {
        const orderBody = {
          customer_name: payload.customer_name, email: payload.email, phone: payload.phone,
          delivery_address: payload.delivery_address, delivery_date: payload.delivery_date,
          occasion: payload.occasion, notes: payload.notes || "",
          items: [...cart.entries()].map(([id, quantity]) => ({
            id, quantity, details: products[id].details || null
          }))
        };
        const {data,error} = await supabaseClient.functions.invoke("create-order", {body: orderBody});
        if (error || !data?.order?.id) throw new Error(data?.error || error?.message || "Order service did not accept the request.");
        message.textContent = "Your order request was saved. Reference: " + data.order.id + ". The shop will contact you to confirm details.";
      } else {
        await sendToInbox(payload, "Flowerine — new order request");
        message.textContent = "Your request was emailed. The shop will contact you to confirm details.";
      }
      showToast("Order request sent successfully");
      cart.clear();
      renderCart();
      form.reset();
      button.textContent = "Request sent ✓";
    } catch (error) {
      message.textContent = "Couldn't send the request. Please try again. " + error.message;
      button.disabled = false;
      button.innerHTML = 'Send order request <span>↗</span>';
    }
  });

  $("#newsletterForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = $("#newsletterEmail").value.trim();
    const message = $("#newsletterMessage");
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    message.textContent = "Submitting your subscription…";
    try {
      await sendToInbox({ email, source: "Flowerine newsletter signup", _replyto: email }, "Flowerine — newsletter subscription");
      message.textContent = "Thank you! Your subscription request has been sent.";
      form.reset();
      showToast("Newsletter request sent");
    } catch (error) {
      message.textContent = "Couldn't submit your email. Please try again. " + error.message;
    } finally {
      button.disabled = false;
    }
  });
  $("#year").textContent = new Date().getFullYear();
  renderCart();
})()