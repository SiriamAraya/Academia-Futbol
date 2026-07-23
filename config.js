const firebaseConfig = {
  apiKey: "AIzaSyDZ1n6iqHni-Vkry2J-kNbXDTCgvuYhy1o",
  authDomain: "futbol-2484a.firebaseapp.com",
  projectId: "futbol-2484a",
  storageBucket: "futbol-2484a.firebasestorage.app",
  messagingSenderId: "1051600126516",
  appId: "1:1051600126516:web:17b656083e8f9f56110061",
  measurementId: "G-1DTYNGPZX3"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

window.db = firebase.database();
db.ref("jugadores").on("value", snap => {
    console.log("DATA FIREBASE:", snap.val());
});