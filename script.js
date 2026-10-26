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
  $("#checkoutButton").addEventListener("click", () => showToast(cart.size ? "Demo only — connect checkout before accepting real orders." : "Your bag is empty. Add a bouquet you love first."));
  $("#newsletterForm").addEventListener("submit", event => {
    event.preventDefault();
    $("#newsletterMessage").textContent = "Thanks! This demo form isn't connected to an email service yet.";
    showToast("Thanks for your interest in Flowerine");
  });
  $("#year").textContent = new Date().getFullYear();
  renderCart();
})();