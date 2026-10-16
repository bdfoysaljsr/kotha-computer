/* =========================================================
   Kotha Computer — Main application
   - Loads services from Firestore (falls back to built-in list)
   - Search + category tabs
   - Order form: server validation → Firestore save → WhatsApp
   ========================================================= */
(() => {
  "use strict";

  const WA_NUMBER = "8801978551099";
  const COLLECTIONS = window.KC_COLLECTIONS || { orders: "orders", services: "services" };

  // Built-in fallback services (used when Firestore has none yet)
  const FALLBACK_SERVICES = [
    { id: "printing",    name_bn: "প্রিন্টিং ও স্ক্যান",       name_en: "Printing & Scanning",       category: "print",    icon: "🖨", desc_bn: "সাদা-কালো ও কালার প্রিন্ট, ফটোকপি, স্ক্যান, লেমিনেশন।",     desc_en: "B&W and color print, photocopy, scan, lamination." },
    { id: "typing",      name_bn: "বাংলা ও ইংরেজি টাইপিং",    name_en: "Bangla & English Typing",   category: "typing",   icon: "⌨", desc_bn: "হাতে লেখা বা ডকুমেন্ট থেকে বাংলা/ইংরেজি টাইপিং।",           desc_en: "Handwritten or document typing in Bangla/English." },
    { id: "pdf",         name_bn: "PDF Merge / Split / Compress", name_en: "PDF Merge / Split / Compress", category: "pdf", icon: "📄", desc_bn: "একাধিক PDF এক করা, ভাগ করা, সাইজ কমানো ও কনভার্ট।",         desc_en: "Merge, split, compress, and convert PDFs." },
    { id: "photo",       name_bn: "ছবি এডিট ও পাসপোর্ট ছবি",   name_en: "Photo Editing & Passport",  category: "design",   icon: "🖼", desc_bn: "পাসপোর্ট/স্ট্যাম্প সাইজ ছবি, রিটাচ, ব্যাকগ্রাউন্ড পরিবর্তন।", desc_en: "Passport size photo, retouch, background change." },
    { id: "cv",          name_bn: "CV / জীবনবৃত্তান্ত",        name_en: "CV / Resume",               category: "typing",   icon: "📋", desc_bn: "প্রফেশনাল CV, বায়োডাটা, কভার লেটার তৈরি।",                 desc_en: "Professional CV, biodata, cover letter." },
    { id: "form",        name_bn: "অনলাইন ফর্ম পূরণ",         name_en: "Online Form Fill-up",        category: "online",   icon: "🌐", desc_bn: "চাকরি, ভর্তি, পরীক্ষার ফর্ম পূরণে সহায়তা।",                desc_en: "Help filling job, admission, exam forms." },
    { id: "design",      name_bn: "গ্রাফিক ডিজাইন",            name_en: "Graphic Design",             category: "design",   icon: "🎨", desc_bn: "ব্যানার, পোস্টার, ভিজিটিং কার্ড, লোগো ডিজাইন।",             desc_en: "Banner, poster, visiting card, logo design." },
    { id: "docs",        name_bn: "ডকুমেন্ট ফরম্যাটিং",       name_en: "Document Formatting",        category: "typing",   icon: "📐", desc_bn: "ডকুমেন্ট ফরম্যাট, মার্জিন, পৃষ্ঠা সেটিং।",                  desc_en: "Format documents, margins, page setup." },
    { id: "software",    name_bn: "সফটওয়্যার ও ট্রাবলশুটিং",   name_en: "Software & Troubleshooting", category: "tech",     icon: "⚙", desc_bn: "Windows/অ্যাপ ইনস্টল, প্রিন্টার, Wi-Fi সাপোর্ট।",           desc_en: "Windows/app install, printer, Wi-Fi support." }
  ];

  const CATEGORY_LABELS = {
    all:    { bn: "সব সেবা",  en: "All Services" },
    print:  { bn: "প্রিন্ট",   en: "Print" },
    typing: { bn: "টাইপিং",   en: "Typing" },
    pdf:    { bn: "PDF",      en: "PDF" },
    design: { bn: "ডিজাইন",   en: "Design" },
    online: { bn: "অনলাইন",   en: "Online" },
    tech:   { bn: "টেকনিক্যাল", en: "Technical" }
  };

  // ---------- DOM ----------
  const form = document.getElementById("orderForm");
  const errorBox = document.getElementById("formError");
  const successBox = document.getElementById("formSuccess");
  const submitBtn = document.getElementById("submitBtn");
  const menuToggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");
  const serviceGrid = document.getElementById("serviceGrid");
  const serviceTabs = document.getElementById("serviceTabs");
  const serviceSearch = document.getElementById("serviceSearch");
  const servicesEmpty = document.getElementById("servicesEmpty");
  const orderTypeSelect = document.getElementById("orderType");

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- State ----------
  let allServices = [];
  let activeCategory = "all";
  let searchTerm = "";
  let lastFingerprint = "";
  let lastSubmissionAt = 0;

  // ---------- Mobile menu ----------
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      nav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }));
  }

  // ---------- i18n helper ----------
  function lang() { return window.KC_i18n ? window.KC_i18n.getLang() : "bn"; }
  function t(key) { return window.KC_i18n ? window.KC_i18n.t(key) : key; }

  // ---------- Service rendering ----------
  function renderTabs() {
    if (!serviceTabs) return;
    const cats = ["all", ...new Set(allServices.map(s => s.category).filter(Boolean))];
    serviceTabs.innerHTML = "";
    cats.forEach(cat => {
      const label = CATEGORY_LABELS[cat] || { bn: cat, en: cat };
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "service-tab" + (cat === activeCategory ? " active" : "");
      btn.textContent = label[lang()] || label.bn;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", String(cat === activeCategory));
      btn.addEventListener("click", () => {
        activeCategory = cat;
        renderTabs();
        renderServices();
      });
      serviceTabs.appendChild(btn);
    });
  }

  function renderServices() {
    if (!serviceGrid) return;
    const L = lang();
    const filtered = allServices.filter(s => {
      const matchCat = activeCategory === "all" || s.category === activeCategory;
      const name = (L === "en" ? s.name_en : s.name_bn) || s.name_bn || "";
      const desc = (L === "en" ? s.desc_en : s.desc_bn) || s.desc_bn || "";
      const hay = (name + " " + desc).toLowerCase();
      const matchSearch = !searchTerm || hay.includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });

    serviceGrid.innerHTML = "";
    servicesEmpty.hidden = filtered.length > 0;

    filtered.forEach(s => {
      const card = document.createElement("article");
      card.className = "service-card";

      const icon = document.createElement("span");
      icon.className = "service-icon";
      icon.textContent = s.icon || "✦";

      const title = document.createElement("h3");
      title.textContent = (L === "en" ? s.name_en : s.name_bn) || s.name_bn || s.id;

      const desc = document.createElement("p");
      desc.textContent = (L === "en" ? s.desc_en : s.desc_bn) || s.desc_bn || "";

      card.appendChild(icon);
      card.appendChild(title);
      card.appendChild(desc);

      if (s.price && Number(s.price) > 0) {
        const price = document.createElement("div");
        price.className = "service-price";
        price.textContent = "৳ " + s.price + (s.priceUnit ? " / " + s.priceUnit : "");
        card.appendChild(price);
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "text-link";
      btn.textContent = t("services.order") + " ↗";
      btn.addEventListener("click", () => {
        if (orderTypeSelect) {
          // Ensure option exists
          let opt = Array.from(orderTypeSelect.options).find(o => o.value === s.id);
          if (!opt) {
            opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = title.textContent;
            orderTypeSelect.appendChild(opt);
          }
          orderTypeSelect.value = s.id;
        }
        const itemName = document.getElementById("itemName");
        if (itemName) itemName.value = title.textContent;
        document.getElementById("order").scrollIntoView({ behavior: "smooth" });
        setTimeout(() => itemName && itemName.focus({ preventScroll: true }), 400);
      });
      card.appendChild(btn);

      serviceGrid.appendChild(card);
    });
  }

  function populateOrderTypeSelect() {
    if (!orderTypeSelect) return;
    const L = lang();
    // preserve "select one" option
    const first = orderTypeSelect.querySelector('option[value=""]');
    orderTypeSelect.innerHTML = "";
    if (first) orderTypeSelect.appendChild(first);
    else {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = t("form.servicePlaceholder");
      orderTypeSelect.appendChild(o);
    }
    allServices.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = (L === "en" ? s.name_en : s.name_bn) || s.name_bn || s.id;
      orderTypeSelect.appendChild(opt);
    });
  }

  // ---------- Load services (Firestore → fallback) ----------
  async function loadServices() {
    allServices = FALLBACK_SERVICES.slice();
    try {
      // Firestore থেকে লোড করার চেষ্টা — শুধু visible:true সেবা
      if (window.KC_firestoreGetServices) {
        const remote = await window.KC_firestoreGetServices();
        if (Array.isArray(remote) && remote.length > 0) {
          // Only include visible ones
          const visible = remote.filter(s => s.visible !== false);
          if (visible.length > 0) {
            allServices = visible.map((s, i) => ({
              id: s.id || ("svc_" + i),
              name_bn: s.name_bn || s.name || "",
              name_en: s.name_en || s.name || "",
              category: s.category || "other",
              icon: s.icon || "✦",
              desc_bn: s.desc_bn || s.description || "",
              desc_en: s.desc_en || s.description || "",
              price: s.price || null,
              priceUnit: s.priceUnit || ""
            }));
          }
        }
      }
    } catch (e) {
      console.warn("[KC] Service load failed, using fallback", e);
    }
    renderTabs();
    renderServices();
    populateOrderTypeSelect();
  }

  // ---------- Search ----------
  if (serviceSearch) {
    serviceSearch.addEventListener("input", (e) => {
      searchTerm = e.target.value.trim();
      renderServices();
    });
  }

  // ---------- Form helpers ----------
  function normalizeBanglaDigits(value) {
    const bn = "০১২৩৪৫৬৭৮৯";
    return String(value).replace(/[০-৯]/g, d => String(bn.indexOf(d)));
  }
  function clean(v) {
    return String(v || "").trim().replace(/\s+/g, " ");
  }
  function showError(msg) {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  function showSuccess(msg) {
    if (successBox) successBox.textContent = msg;
  }

  // ---------- Submit ----------
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (errorBox) errorBox.textContent = "";
      if (successBox) successBox.textContent = "";

      const data = new FormData(form);

      // honeypot
      if (clean(data.get("website")) !== "") {
        showError(t("err.bot"));
        return;
      }

      const customerName = clean(data.get("customerName"));
      const phoneRaw = normalizeBanglaDigits(clean(data.get("phone")));
      const phone = phoneRaw.replace(/[\s\-()]/g, "").replace(/^\+?88/, "");
      const address = clean(data.get("address"));
      const orderType = clean(data.get("orderType"));
      const item = clean(data.get("item"));
      const quantity = clean(data.get("quantity"));
      const payment = clean(data.get("payment"));
      const details = clean(data.get("details"));

      if (!customerName || !phone || !address || !orderType || !item) {
        showError(t("err.required"));
        return;
      }
      if (!/^01[3-9]\d{8}$/.test(phone)) {
        showError(t("err.phone"));
        return;
      }
      if (!data.get("consent")) {
        showError(t("err.consent"));
        return;
      }

      // Simple client-side duplicate friction (in-memory only)
      const fingerprint = [phone, orderType, item.toLowerCase()].join("|");
      const now = Date.now();
      if (fingerprint === lastFingerprint && now - lastSubmissionAt < 120000) {
        showError(t("err.duplicate"));
        return;
      }
      lastFingerprint = fingerprint;
      lastSubmissionAt = now;

      // Disable submit
      if (submitBtn) { submitBtn.disabled = true; }

      // ----- Server save (Cloudflare Functions → Firestore) -----
      let serverRef = null;
      try {
        const res = await fetch("/api/submit-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName, phone, address, orderType, item, quantity,
            payment, details
          })
        });

        if (res.status === 429) {
          showError(t("err.rateLimit"));
          if (submitBtn) submitBtn.disabled = false;
          return;
        }

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          console.error("[KC] submit-order failed", res.status, errBody);
          showError(t("err.server"));
          if (submitBtn) submitBtn.disabled = false;
          return;
        }

        const json = await res.json();
        serverRef = json.orderRef || null;
      } catch (err) {
        console.error("[KC] submit-order network error", err);
        showError(t("err.server"));
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      // ----- WhatsApp handoff -----
      const refForMsg = serverRef || ("KC-" + Date.now().toString(36).toUpperCase());
      const message = [
        "🛒 *Kotha Computer — নতুন অর্ডার*",
        "রেফারেন্স: " + refForMsg,
        "",
        "*কাস্টমারের তথ্য*",
        "নাম: " + customerName,
        "মোবাইল: " + phone,
        "ঠিকানা: " + address,
        "",
        "*অর্ডারের তথ্য*",
        "সেবা: " + item,
        "পরিমাণ: " + (quantity || "উল্লেখ করা হয়নি"),
        "পেমেন্ট: " + payment,
        "নির্দেশনা: " + (details || "নেই"),
        "",
        "📎 ফাইল থাকলে এই চ্যাটে পাঠাবেন।",
        "অর্ডার ও মূল্য নিশ্চিত করুন।"
      ].join("\n");

      const url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message);
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) window.location.href = url;

      if (serverRef) {
        showSuccess(t("success.saved").replace("{ref}", serverRef));
      } else {
        showSuccess(t("success.onlyWa"));
      }

      setTimeout(() => { if (submitBtn) submitBtn.disabled = false; }, 2000);
    });
  }

  // ---------- Language change re-render ----------
  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "langToggle") {
      // i18n.js handles toggling; we re-render dynamic content
      setTimeout(() => {
        renderTabs();
        renderServices();
        populateOrderTypeSelect();
      }, 30);
    }
  });

  // ---------- Init ----------
  loadServices();
})();