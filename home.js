import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Telegram Bot Configuration
const telegramBotToken = '7468315370:AAG9OZQ19umJx5rtrcaGGyzM95Bu9VXhNio';

// Elements
const modal = document.getElementById('addProductModal');
const addProductForm = document.getElementById('addProductForm');
const addNewItemButton = document.getElementById('addNewItem');
const logoutButton = document.getElementById('logoutButton');
const notificationModal = document.getElementById('notificationModal');
const saveNotificationSettingsButton = document.getElementById('saveNotificationSettings');
const productTableBody = document.querySelector('#productTable tbody');
const userTelegramTableBody = document.querySelector('#userTable tbody');

// Event Listeners
addNewItemButton.addEventListener('click', openAddProductModal);
document.getElementById('notificationSettings').addEventListener('click', openNotificationModal);
document.querySelectorAll('.close-btn').forEach(btn => btn.addEventListener('click', closeModals));
logoutButton.addEventListener('click', handleLogout);
saveNotificationSettingsButton.addEventListener('click', saveNotificationSettings);

// Modal functions
function openAddProductModal() {
    setModalTitle('Add New Product');
    addProductForm.onsubmit = addOrUpdateProduct;
    resetForm();
    showModal(modal);
}

function openNotificationModal() {
    showModal(notificationModal);
}

function closeModals() {
    hideModal(modal);
    hideModal(notificationModal);
}

function showModal(modal) {
    modal.style.display = 'block';
}

function hideModal(modal) {
    modal.style.display = 'none';
}

function setModalTitle(title) {
    document.getElementById('modalTitle').textContent = title;
}

// Reset Form
function resetForm() {
    const fields = ['productName', 'productPrice', 'productCategory', 'productBarcode', 'itemValue'];
    fields.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
}

// Get Product Form Data
function getProductFormData() {
    const productNameInput = document.getElementById('productName');
    const productPriceInput = document.getElementById('productPrice');
    const productCategoryInput = document.getElementById('productCategory');
    const productBarcodeInput = document.getElementById('productBarcode');
    const itemValueInput = document.getElementById('itemValue');

    // Check if elements are found before accessing their values
    const name = productNameInput ? productNameInput.value : '';
    const price = productPriceInput ? productPriceInput.value : '';
    const category = productCategoryInput ? productCategoryInput.value : '';
    const barcode = productBarcodeInput ? productBarcodeInput.value.trim() : ''; // Single barcode
    const itemValue = itemValueInput ? itemValueInput.value : '';

    return {
        name: name,
        price: price,
        category: category,
        barcode: barcode,
        itemValue: itemValue
    };
}

// Check if Barcode Already Exists
async function barcodeExists(barcode) {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    if (snapshot.exists()) {
        const products = snapshot.val();
        return Object.values(products).some(product => product.barcode === barcode);
    }
    return false;
}

// Add New Product or Update Existing Product
async function addOrUpdateProduct(e) {
    e.preventDefault();
    const newProduct = getProductFormData();

    // Validate that the barcode is unique
    if (await barcodeExists(newProduct.barcode)) {
        alert('This barcode is already assigned to another product.');
        return;
    }

    try {
        const productRef = ref(database, `products/${newProduct.name}`);
        const snapshot = await get(productRef);

        if (snapshot.exists()) {
            // Product exists, update the item value
            const existingProduct = snapshot.val();
            existingProduct.itemValue = (parseInt(existingProduct.itemValue) || 0) + parseInt(newProduct.itemValue || 0);
            await update(productRef, existingProduct);
            alert('Product updated successfully!');
        } else {
            // Product does not exist, create a new one
            await set(productRef, newProduct);
            alert('Product added successfully!');
        }
        closeModals();
    } catch (error) {
        console.error('Error adding or updating product:', error);
        alert('Failed to add or update product.');
    }
}

// Handle Barcode Update from ESP32
async function handleBarcodeUpdate(barcode) {
    try {
        const productsRef = ref(database, 'products');
        const snapshot = await get(productsRef);
        
        if (snapshot.exists()) {
            const products = snapshot.val();
            const productKey = Object.keys(products).find(key => products[key].barcode === barcode);
            
            if (productKey) {
                // Product exists, update the item value
                const productRef = ref(database, `products/${productKey}`);
                const existingProduct = products[productKey];
                existingProduct.itemValue = (parseInt(existingProduct.itemValue) || 0) + 1; // Increment by 1
                await update(productRef, existingProduct);
            } else {
                console.log('Product with this barcode does not exist.');
            }
        } else {
            console.log('No products found.');
        }
    } catch (error) {
        console.error('Error updating product from barcode:', error);
    }
}

// Handle Edit Product
function handleEditProduct(productName, product) {
    setModalTitle('Edit Product');
    fillProductForm(product);
    addProductForm.onsubmit = (e) => updateProduct(e, productName);
    showModal(modal);
}

// Fill Product Form
function fillProductForm(product) {
    const productNameInput = document.getElementById('productName');
    const productPriceInput = document.getElementById('productPrice');
    const productCategoryInput = document.getElementById('productCategory');
    const productBarcodeInput = document.getElementById('productBarcode');
    const itemValueInput = document.getElementById('itemValue');

    // Check if elements are found before setting their values
    if (productNameInput) productNameInput.value = product.name || '';
    if (productPriceInput) productPriceInput.value = product.price || '';
    if (productCategoryInput) productCategoryInput.value = product.category || '';
    if (productBarcodeInput) productBarcodeInput.value = product.barcode || ''; // Single barcode
    if (itemValueInput) itemValueInput.value = product.itemValue || '';
}

// Update Product
async function updateProduct(e, productName) {
    e.preventDefault();
    const updatedProduct = getProductFormData();
    try {
        await update(ref(database, `products/${productName}`), updatedProduct);
        alert('Product updated successfully!');
        closeModals();
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Failed to update product.');
    }
}

// Handle Delete Product
async function handleDeleteProduct(productName) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await remove(ref(database, `products/${productName}`));
            alert('Product deleted successfully!');
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product.');
        }
    }
}

// Create Product Row
function createProductRow(product, productName) {
    const barcode = product.barcode || ''; // Single barcode
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${product.name}</td>
        <td>RM ${parseFloat(product.price).toFixed(2)}</td>
        <td>${product.category}</td>
        <td>${barcode}</td> <!-- Display single barcode -->
        <td>${product.itemValue}</td>
        <td><button class="edit-btn" data-name="${productName}">Edit</button></td>
        <td><button class="delete-btn" data-name="${productName}">Delete</button></td>
    `;
    row.querySelector('.edit-btn').addEventListener('click', () => handleEditProduct(productName, product));
    row.querySelector('.delete-btn').addEventListener('click', () => handleDeleteProduct(productName));
    return row;
}

// Load Products and Send Notifications if Necessary
onValue(ref(database, 'products'), (snapshot) => {
    productTableBody.innerHTML = '';
    snapshot.forEach((childSnapshot) => {
        const product = childSnapshot.val();
        const productName = childSnapshot.key;
        const row = createProductRow(product, productName);
        productTableBody.appendChild(row);

        if (product.itemValue <= 3) {
            sendTelegramNotification(`Product ${product.name} (Barcode: ${product.barcode}) is low in stock. Current value: ${product.itemValue}`);
        }
    });
});

// Load User Telegrams and Display in the Table
onValue(ref(database, 'userTelegrams'), (snapshot) => {
    userTelegramTableBody.innerHTML = '';
    snapshot.forEach((childSnapshot) => {
        const userName = childSnapshot.key;
        const user = childSnapshot.val();
        const row = createUserRow(userName, user);
        userTelegramTableBody.appendChild(row);
    });
});

// Create User Row
function createUserRow(userName, user) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${userName}</td>
        <td>${user.id}</td>
        <td><button class="edit-user-btn" data-name="${userName}">Edit</button></td>
        <td><button class="delete-user-btn" data-name="${userName}">Delete</button></td>
    `;
    row.querySelector('.edit-user-btn').addEventListener('click', () => handleEditUser(userName, user));
    row.querySelector('.delete-user-btn').addEventListener('click', () => handleDeleteUser(userName));
    return row;
}

// Handle Edit User
function handleEditUser(userName, user) {
    document.getElementById('notificationName').value = userName;
    document.getElementById('chatId').value = user.id;

    saveNotificationSettingsButton.onclick = async (e) => {
        e.preventDefault();
        try {
            await update(ref(database, `userTelegrams/${userName}`), {
                id: document.getElementById('chatId').value
            });
            alert('User updated successfully!');
            closeModals();
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user.');
        }
    };

    showModal(notificationModal);
}

// Handle Delete User
async function handleDeleteUser(userName) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            await remove(ref(database, `userTelegrams/${userName}`));
            alert('User deleted successfully!');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user.');
        }
    }
}

// Handle Logout
async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = 'index.html'; // Redirect to login page after logout
    } catch (error) {
        console.error('Logout failed:', error);
        alert('Failed to log out.');
    }
}

// Save Notification Settings
async function saveNotificationSettings(e) {
    e.preventDefault();
    const userName = document.getElementById('notificationName').value;
    const chatId = document.getElementById('chatId').value;
    try {
        await set(ref(database, `userTelegrams/${userName}`), {
            id: chatId
        });
        alert('Notification settings saved!');
        closeModals();
    } catch (error) {
        console.error('Error saving notification settings:', error);
        alert('Failed to save notification settings.');
    }
}

// Send Telegram Notification
async function sendTelegramNotification(message) {
    try {
        const userSnap = await get(ref(database, 'userTelegrams'));
        if (userSnap.exists()) {
            const users = userSnap.val();
            const notifications = Object.values(users).map(user => {
                return fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: user.id, text: message })
                });
            });
            await Promise.all(notifications);
            alert('Notification sent!');
        } else {
            alert('No users found for notification.');
        }
    } catch (error) {
        console.error('Error sending Telegram notification:', error);
        alert('Failed to send notification.');
    }
}
