import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPR1nzKDCmn6RWyWi5W6wLEZzGhfwdnVM",
  authDomain: "jadecapitalproyect.firebaseapp.com",
  projectId: "jadecapitalproyect",
  storageBucket: "jadecapitalproyect.firebasestorage.app",
  messagingSenderId: "602323355721",
  appId: "1:602323355721:web:94e36cb0e47c36568ed798",
  measurementId: "G-HF3560N9ZX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase initialized successfully!");

export { db, collection, addDoc, query, orderBy, limit, getDocs, doc, getDoc, updateDoc, deleteDoc };