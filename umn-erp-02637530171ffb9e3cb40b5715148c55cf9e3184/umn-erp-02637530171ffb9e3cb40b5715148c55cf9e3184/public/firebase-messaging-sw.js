importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// നിങ്ങളുടെ യഥാർത്ഥ ഫയർബേസ് കോൺഫിഗ് 
const firebaseConfig = {
  apiKey: "AIzaSyCSnYfmU7dCnVJE1BShGEpkQQzQ1bGuBp0",
  authDomain: "umn-erp.firebaseapp.com",
  projectId: "umn-erp",
  storageBucket: "umn-erp.firebasestorage.app",
  messagingSenderId: "483936934389",
  appId: "1:483936934389:web:1fa1aec041b8bbbd9f68bc",
  measurementId: "G-48B872HZ6F"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// ബാക്ക്ഗ്രൗണ്ടിൽ നോട്ടിഫിക്കേഷൻ വരുമ്പോൾ കാണിക്കാൻ
messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/favicon.ico', 
    badge: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
