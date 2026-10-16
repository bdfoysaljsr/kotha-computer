/* =========================================================
   Kotha Computer — Firebase Configuration
   এই ফাইলটি public — এখানে কোনো secret নেই।
   আসল সুরক্ষা আসে: Firestore Rules + Firebase Auth + Server validation
   ========================================================= */
(() => {
  "use strict";

  // Firebase web config (এটা Google বলেই public-safe)
  window.KC_FIREBASE_CONFIG = {
    apiKey: "AIzaSyAIS7KOLzY_K2MjN4AynYNGAE6Em4Ndxy0",
    authDomain: "kotha-computer.firebaseapp.com",
    projectId: "kotha-computer",
    storageBucket: "kotha-computer.firebasestorage.app",
    messagingSenderId: "983118904815",
    appId: "1:983118904815:web:f8875a7c22393f016a0a1a"
    // measurementId বাদ দিয়েছি — Analytics ব্যবহার করব না (প্রাইভেসি)
  };

  // Admin UID — শুধু এই UID থেকে admin panel-এ ঢোকা যাবে
  // (বাস্তব সুরক্ষা server-side rules-এ, এটা শুধু UI convenience)
  window.KC_ADMIN_UID = "FBwpbI7cJ0gjqmj5N85NEVdUsy63";

  // ব্যবসার তথ্য
  window.KC_BUSINESS = {
    name: "Kotha Computer",
    whatsapp: "8801978551099",
    phone: "01978551099",
    email: "kothatechjsr@gmail.com",
    address: "ভরতপুর নতুন বাজার, খানপুর, মনিরামপুর, যশোর, বাংলাদেশ",
    hours: {
      morning: "সকাল ৯টা – দুপুর ২টা",
      evening: "বিকাল ৫টা – রাত ২টা"
    }
  };

  // Firestore-এ collection নাম
  window.KC_COLLECTIONS = {
    orders: "orders",
    services: "services",
    settings: "settings"
  };
})();