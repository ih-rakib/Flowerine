(() => {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const money = value => "৳" + Number(value || 0).toLocaleString("en-BD",{maximumFractionDigits:2,minimumFractionDigits:0});
  const catalogue = {
    blush:{name:"Blush Hour Bouquet",price:3200,image:"images/flower1.png",description:"Soft pinks, effortless romance. A graceful bouquet made for thoughtful gestures and sweet surprises.",meaning:"Blush tones feel gentle, affectionate and full of warmth.",occasions:"Anniversaries, birthdays, date nights, or a just-because surprise."},
    cherry:{name:"Cherry Blossom Daydream",price:2800,image:"images/flower2.png",description:"Light, airy and full of charm. A delicate arrangement for a little brightness in an ordinary day.",meaning:"A fresh, hopeful feeling with a soft and playful look.",occasions:"Thank-you gifts, new beginnings, birthdays, and everyday smiles."},
    garden:{name:"The Garden Party",price:3600,image:"images/flower3.png",description:"A garden-inspired mix with natural colour and an easy, abundant feel.",meaning:"Cheerful, natural and wonderfully generous.",occasions:"Housewarmings, celebrations, hosting gifts, and birthdays."},
    peony:{name:"Peony Promise",price:4200,image:"images/pngwing1.png",description:"A romantic statement bouquet with a lush, graceful silhouette.",meaning:"A thoughtful way to express affection and appreciation.",occasions:"Anniversaries, engagements, and heartfelt celebrations."},
    rosy:{name:"Rosy Ever After",price:3800,image:"images/pngwing2.png",description:"A romantic rose-led bouquet with a timeless, gift-ready feel.",meaning:"Classic romance, tenderness and appreciation.",occasions:"Anniversaries, birthdays, romantic surprises, and special dates."},
    spring:{name:"A Spring Whisper",price:2500,image:"images/pngwing3.png",description:"A light, cheerful arrangement inspired by the fresh colours of spring.",meaning:"Optimism, new beginnings and small joys.",occasions:"Congratulations, get-well wishes, and everyday gifting."},
    signature:{name:"The Signature Stem",price:3000,image:"images/pngwing4.png",description:"A refined, understated floral arrangement for someone who appreciates simple beauty.",meaning:"Quiet elegance and considered gestures.",occasions:"Thank-you gifts, thoughtful visits, and understated celebrations."},
    celebrate:{name:"Little Celebration",price:4500,image:"images/pngwing8.png",description:"A joyful, eye-catching bouquet made to bring a celebratory moment to life.",meaning:"Happiness, abundance and big-hearted congratulations.",occasions:"Birthdays, graduations, promotions, and milestones."},
    sunrise:{name:"Golden Sunrise Roses",price:3400,image:"images/pngwing5.png",description:"Warm golden hues and rose-inspired charm for a bright, uplifting gift.",meaning:"Warmth, encouragement and a bright new start.",occasions:"Congratulations, birthdays, and cheering someone on."},
    lavender:{name:"Lavender Haze",price:3300,image:"images/pngwing6.png",description:"A dreamy arrangement with soft lavender tones and a calm, graceful mood.",meaning:"Calm, admiration and a little everyday magic.",occasions:"Birthdays, thank-you gifts, and thoughtful surprises."},
    ivory:{name:"Ivory Elegance",price:3900,image:"images/pngwing7.png",description:"A graceful, neutral-toned bouquet with a timeless, elegant look.",meaning:"Sincerity, grace and understated care.",occasions:"Weddings, formal celebrations, sympathy, and meaningful milestones."},
    ruby:{name:"Ruby Red Romance",price:4100,image:"images/pngwing2.png",description:"A rich red bouquet for messages that deserve to be felt as well as heard.",meaning:"Passion, devotion and heartfelt affection.",occasions:"Anniversaries, romantic occasions, and special surprises."},
    pastel:{name:"Pastel Petal Cloud",price:3100,image:"images/flower2.png",description:"A soft pastel mix with a delicate finish and a light, dreamy palette.",meaning:"Gentleness, kindness and a fresh, peaceful mood.",occasions:"Baby celebrations, birthdays, thank-you gifts, and new beginnings."},
    tropical:{name:"Tropical Celebration",price:3700,image:"images/pngwing8.png",description:"Bright, joyful colours for big news, happy gatherings and birthdays.",meaning:"Energy, joy and a lively celebration.",occasions:"Birthdays, congratulations, parties, and festive moments."},
    white:{name:"White Lily Serenity",price:3500,image:"images/pngwing4.png",description:"A calm, elegant arrangement in soft whites for a thoughtful, graceful gesture.",meaning:"Peace, sincerity and quiet remembrance.",occasions:"Sympathy, formal gifting, thank-you gestures, and calm celebrations."},
    sunset:{name:"Sunset Garden Mix",price:3600,image:"images/flower3.png",description:"Warm peach and coral tones with garden charm, inspired by the last light of day.",meaning:"Comfort, warmth and cheerful appreciation.",occasions:"Birthdays, housewarmings, thank-you gifts, and celebrations."}
  };
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const config = window.FLOWERINE_SUPABASE || {};
  const client = window.supabase?.createClient && config.url && config.anonKey && !config.url.includes("YOUR_PROJECT_REF") && !config.anonKey.includes("YOUR_SUPABASE") ? window.supabase.createClient(config.url,config.anonKey) : null;
  const safe = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  let current = null;
  function render(product) {
    current = product;
    document.title = product.name + " | Flowerine";
    $("#breadcrumbName").textContent = product.name;
    $("#detailName").textContent = product.name;
    $("#detailPrice").textContent = money(product.price);
    $("#detailImage").src = product.image;
    $("#detailImage").alt = product.name;
    $("#detailDescription").textContent = product.description || "A thoughtful floral arrangement for the moments that matter.";
    $("#detailMeaning").textContent = product.meaning || "A thoughtful way to show someone you care.";
    $("#detailOccasions").textContent = product.occasions || "Birthdays, celebrations, thank-you gifts, or just because.";
    $("#detailKicker").textContent = (product.category || "A LITTLE SOMETHING LOVELY").toString().replace(/[-_]/g," ").toUpperCase();
    $("#detailAdd").disabled = false;
    const number = String(window.FLOWERINE_WHATSAPP_NUMBER || "8801568041680").replace(/\D/g,"");
    const message = "Hello Flowerine, I'd like to ask about " + product.name + " (" + money(product.price) + ").";
    $("#detailWhatsApp").href = "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
  }
  function showError(message) {
    $("#detailName").textContent = "We couldn't find that flower";
    $("#detailDescription").textContent = message || "This product may no longer be available.";
    $("#detailPrice").textContent = "";
    $("#detailAdd").disabled = true;
    $("#detailFeedback").textContent = "Please return to the shop to explore the available flowers.";
  }
  async function load() {
    if (!id) { showError("Choose a flower from the shop to see its details."); return; }
    if (catalogue[id]) render({...catalogue[id],id,category:"Made with feeling"});
    if (client) {
      const {data,error} = await client.from("products").select("id,name,description,price,image_url,categories,stock").eq("id",id).eq("active",true).maybeSingle();
      if (data) {
        render({id:data.id,name:data.name,description:data.description || "",price:Number(data.price),image:data.image_url || "images/flower3.png",category:(data.categories || []).join(" · "),stock:data.stock});
        return;
      }
      if (!catalogue[id]) showError(error ? "The live catalogue could not be reached. Please try again or browse the shop." : "This flower is not currently available.");
    } else if (!catalogue[id]) {
      showError("This flower isn't in the demo catalogue. Please browse the shop for available flowers.");
    }
  }
  $("#detailAdd").addEventListener("click", () => {
    if (!current) return;
    let saved = [];
    try { const parsed = JSON.parse(localStorage.getItem("flowerine-cart") || "[]"); if (Array.isArray(parsed)) saved = parsed; } catch (_) {}
    const cart = new Map(saved.filter(entry => Array.isArray(entry) && entry.length === 2 && Number.isInteger(entry[1]) && entry[1] > 0 && entry[1] <= 99));
    const qty = cart.get(current.id) || 0;
    if (qty >= 99) { $("#detailFeedback").textContent = "You've reached the maximum quantity for this item."; return; }
    cart.set(current.id,qty+1);
    try { localStorage.setItem("flowerine-cart",JSON.stringify([...cart.entries()])); } catch (_) {}
    $("#detailFeedback").textContent = current.name + " added to your bag. Open the shop to review your bag and continue checkout.";
    $("#detailAdd").innerHTML = "Added to bag <span>✓</span>";
    setTimeout(() => { if ($("#detailAdd")) $("#detailAdd").innerHTML = 'Add to bag <span>＋</span>'; }, 1800);
  });
  $("#productYear").textContent = new Date().getFullYear();
  load();
})();