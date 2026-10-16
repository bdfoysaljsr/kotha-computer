(() => {
  "use strict";
  // Update this number if the shop WhatsApp number changes. Format: country code + number, no plus sign.
  const WHATSAPP_NUMBER = "8801978551099";
  const form = document.getElementById("orderForm");
  const errorBox = document.getElementById("formError");
  const menuToggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");
  // In-memory only: discourages repeated identical submissions while this page remains open.
  // It does not persist customer data or work as server-side fraud detection.
  let lastFingerprint = "";
  let lastSubmissionAt = 0;

  document.getElementById("year").textContent = new Date().getFullYear();

  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));

  document.querySelectorAll(".choose-service").forEach(button => {
    button.addEventListener("click", () => {
      document.getElementById("orderType").value = button.dataset.service;
      document.getElementById("itemName").value = button.dataset.service;
      document.getElementById("order").scrollIntoView({behavior:"smooth"});
      document.getElementById("itemName").focus({preventScroll:true});
    });
  });
  document.querySelectorAll(".choose-product").forEach(button => {
    button.addEventListener("click", () => {
      document.getElementById("orderType").value = "পণ্য";
      document.getElementById("itemName").value = button.dataset.product;
      document.getElementById("order").scrollIntoView({behavior:"smooth"});
      document.getElementById("itemName").focus({preventScroll:true});
    });
  });

  function normalizeBanglaDigits(value) {
    const bn = "০১২৩৪৫৬৭৮৯";
    return value.replace(/[০-৯]/g, digit => String(bn.indexOf(digit)));
  }
  function clean(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }
  function showError(message) {
    errorBox.textContent = message;
    errorBox.scrollIntoView({behavior:"smooth", block:"center"});
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    errorBox.textContent = "";

    const data = new FormData(form);
    // Basic honeypot. This can discourage simple bots, not sophisticated attacks.
    if (clean(data.get("website")) !== "") {
      showError("ফর্মটি যাচাই করা যায়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।");
      return;
    }

    const customerName = clean(data.get("customerName"));
    const phoneRaw = normalizeBanglaDigits(clean(data.get("phone")));
    const phone = phoneRaw.replace(/[\s\-()]/g, "");
    const address = clean(data.get("address"));
    const orderType = clean(data.get("orderType"));
    const item = clean(data.get("item"));
    const quantity = clean(data.get("quantity"));
    const payment = clean(data.get("payment"));
    const details = clean(data.get("details"));

    if (!customerName || !phone || !address || !orderType || !item) {
      showError("অনুগ্রহ করে (*) চিহ্নিত সব ঘর পূরণ করুন।");
      return;
    }
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(phone)) {
      showError("সঠিক বাংলাদেশের মোবাইল নম্বর লিখুন, যেমন 01XXXXXXXXX।");
      return;
    }
    if (!data.get("consent")) {
      showError("WhatsApp-এ অর্ডারের তথ্য পাঠানোর সম্মতি দিন।");
      return;
    }

    // Lightweight duplicate friction, held only in page memory (not persistent).
    const fingerprint = [phone, orderType, item.toLowerCase(), address.toLowerCase()].join("|");
    const now = Date.now();
    if (fingerprint === lastFingerprint && now - lastSubmissionAt < 120000) {
      showError("এই একই অর্ডারটি অল্প সময় আগে প্রস্তুত করা হয়েছে। ভুল করে হলে তথ্য ঠিক করে আবার চেষ্টা করুন; একই অর্ডার পুনরায় পাঠানোর আগে WhatsApp চ্যাট দেখুন।");
      return;
    }
    lastFingerprint = fingerprint;
    lastSubmissionAt = now;

    // Do not store form data in a database, localStorage, cookies, or analytics.
    // The browser opens WhatsApp with a prefilled message. The customer must press Send.
    const orderCode = "KC-" + new Date().toISOString().slice(0,10).replaceAll("-","") + "-" +
      Math.random().toString(36).slice(2,7).toUpperCase();
    const message = [
      "🛒 *Kotha Computer — নতুন অর্ডারের অনুরোধ*",
      "অর্ডার রেফারেন্স: " + orderCode,
      "",
      "*কাস্টমারের তথ্য*",
      "নাম: " + customerName,
      "মোবাইল: " + phone,
      "ঠিকানা: " + address,
      "",
      "*অর্ডারের তথ্য*",
      "ধরন: " + orderType,
      "পণ্য/সেবা: " + item,
      "পরিমাণ/কপি: " + (quantity || "উল্লেখ করা হয়নি"),
      "পেমেন্ট: " + payment,
      "বিশেষ নির্দেশনা: " + (details || "নেই"),
      "",
      "মিডিয়া ফাইল থাকলে কাস্টমার WhatsApp চ্যাটে আলাদাভাবে সংযুক্ত করবেন।",
      "দয়া করে অর্ডার, মূল্য ও ডেলিভারি নিশ্চিত করুন।"
    ].join("\n");

    const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      // Fallback when the browser blocks a new tab.
      window.location.href = url;
    }
    showError("WhatsApp খুললে মেসেজটি দেখে Send চাপুন। Send না করা পর্যন্ত অর্ডার আমাদের কাছে পৌঁছাবে না।");
  });
})();