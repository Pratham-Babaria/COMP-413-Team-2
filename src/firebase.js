import firebase from 'firebase/app';
import 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCvPPESoCZoC67lZUHb7yoagGU9U3mBOLo",
  authDomain: "dermiq-6f4e7.firebaseapp.com",
  projectId: "dermiq-6f4e7",
  storageBucket: "dermiq-6f4e7.firebasestorage.app",
  messagingSenderId: "380448975072",
  appId: "1:380448975072:web:873ac4b9b589a06c014885",
  measurementId: "G-L0NY297F55"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const auth = firebaseApp.auth();

export { auth };