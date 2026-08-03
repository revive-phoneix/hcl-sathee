importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBfSNQB1sM7zSWxRutm2f_ij7lpqscbvdU",
  authDomain: "sathee-502704.firebaseapp.com",
  projectId: "sathee-502704",
  storageBucket: "sathee-502704.firebasestorage.app",
  messagingSenderId: "890036918497",
  appId: "1:890036918497:web:f9c9d3b42c17b0a4413fa0",
});

const messaging = firebase.messaging();

// Handles notifications that arrive while the tab/browser is closed or backgrounded
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "Sathee", {
    body: body || "",
    icon: "/favicon.svg",
  });
});