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
  $$(".quick-add").forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.add;
    cart.set(id, (cart.get(id) || 0) + 1);
    renderCart(); showToast(products[id].name + " added to your bag");
  }));
  $$(".wishlist").forEach(button => button.addEventListener("click", () => {
    const saved = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(saved)); button.textContent = saved ? "♥" : "♡";
    showToast(saved ? "Saved to your favourites" : "Removed from your favourites");
  }));
  function renderCart(){
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
      if (next <= 0) cart.delete(id); else cart.set(id,next);
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
      return qty + " × " + p.name + " — $" + (p.price * qty).toFixed(2);
    }).join("\n");
    payload.estimated_subtotal = $("#cartSubtotal").textContent;
    payload.order_status = "Order request only — not yet confirmed or paid";
    payload._replyto = payload.email;
    button.disabled = true;
    button.textContent = "Sending request…";
    message.textContent = "Submitting your order request…";
    try {
      await sendToInbox(payload, "Flowerine — new order request");
      message.textContent = "Your request was sent. The shop will contact you to confirm details.";
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
})();