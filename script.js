// Import the necessary Firebase SDK functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBG7NKXDCcVM0vP68onItVmOwk6nfQxNxE",
    authDomain: "vsim-67c34.firebaseapp.com",
    databaseURL: "https://vsim-67c34-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "vsim-67c34",
    storageBucket: "vsim-67c34.appspot.com",
    messagingSenderId: "972301337918",
    appId: "1:972301337918:web:6119454ebf84617b16586f",
    measurementId: "G-DWVHKKE016"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Create a Google Auth Provider
const provider = new GoogleAuthProvider();

// Function to handle Google sign-in
function handleGoogleSignIn() {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            console.log('Google sign-in successful:', user);
            window.location.href = 'home.html';  // Redirect to home page after successful login
        })
        .catch((error) => {
            console.error('Error during Google sign-in:', error.message);
            alert('Error: ' + error.message);
        });
}

// Add event listeners to Google sign-in buttons
document.querySelectorAll('.bxl-google').forEach(button => {
    button.addEventListener('click', handleGoogleSignIn);
});

// Sign Up function
const signUpForm = document.querySelector('.sign-up form');
signUpForm.addEventListener('submit', function (event) {
    event.preventDefault();
    
    const email = document.getElementById('sign-up-email').value;
    const password = document.getElementById('sign-up-password').value;
    const name = document.getElementById('sign-up-name').value;
    
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Save user details to Firebase Database
            set(ref(database, 'users/' + user.uid), {
                username: name,
                email: email
            });
            
            alert('Sign-up successful');
            window.location.href = 'home.html';  // Redirect to home page after successful sign-up
        })
        .catch((error) => {
            console.error('Error signing up:', error.message);
            alert('Error: ' + error.message);
        });
});

// Sign In function
const signInForm = document.querySelector('.sign-in form');
signInForm.addEventListener('submit', function (event) {
    event.preventDefault();
    
    const email = document.getElementById('sign-in-email').value;
    const password = document.getElementById('sign-in-password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert('Login successful');
            window.location.href = 'home.html';  // Redirect to home page after successful login
        })
        .catch((error) => {
            console.error('Error signing in:', error.message);
            alert('Error: ' + error.message);
        });
});

// Redirect users if they are already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = 'home.html';  // Redirect to home page if user is logged in
    }
});

// Toggle functionality for sign-in and sign-up
const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});
