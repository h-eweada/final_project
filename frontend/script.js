// Sample product data
const products = [
    { id: 1, name: "Velvet Bodysuit ", price: 435.00, image: "https://katjie.com/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-27-at-4.08.23-PM-1.jpeg.webp", category: "summer" },
    { id: 2, name: "Carrots Bodysuit ", price: 375.00, image: "https://i0.wp.com/katjie.com/wp-content/uploads/2025/03/IMG_0326-scaled.jpg?resize=1320%2C1980&ssl=1", category: "basics" },
    { id: 3, name: "Blue Ice Bodysuit", price: 480.00, image: "https://katjie.com/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-21-at-4.21.00-PM.jpeg.webp", category: "basics" },
    { id: 4, name: "stitch Bodysuit", price: 450.00, image: "https://katjie.com/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-21-at-4.21.22-PM.jpeg.webp", category: "basics" },
    { id: 5, name: "Disney Christmas Pyjama 3 pieces", price: 375.00, image: "https://katjie.com/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-21-at-4.21.11-PM-1.jpeg.webp", category: "basics" },
    { id: 6, name: "Pooh Bear Pyjama", price: 480.00, image: "https://katjie.com/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-21-at-4.21.10-PM.jpeg.webp", category: "basics" },
    { id: 7, name: "Girafe Melton bodysuit", price: 460.00, image: "https://katjie.com/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-21-at-4.21.19-PM-1.jpeg.webp", category: "basics" },
    { id: 8, name: "Girafe Melton bodysuit", price: 85.00, image: "https://katjie.com/wp-content/uploads/2024/06/201-1-scaled-1.jpg.webp", category: "basics" }
];

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

async function saveCartToServer() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user?.id || localStorage.getItem('loggedIn') !== 'true') return;
    try {
        const response = await fetch('http://localhost:5000/api/cart/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({ userId: user.id, items: cart })
        });
        if (!response.ok) console.error('Could not save cart to server');
    } catch (error) {
        console.error('Could not connect to save cart', error);
    }
}

function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (!cartCount) return;

    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    if (isLoggedIn) {
        cartCount.textContent = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    } else {
        cartCount.textContent = '0';
    }
}

function handleCartClick(e) {
    e.preventDefault();
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    if (!isLoggedIn) {
        localStorage.setItem('redirectAfterLogin', 'cart.html');
        const hasAccount = localStorage.getItem('user');
        window.location.href = hasAccount ? 'login.html' : 'signup.html';
    } else {
        window.location.href = 'cart.html';
    }
}

async function addToCart(productId) {
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    if (!isLoggedIn) {
        localStorage.setItem('redirectAfterLogin', window.location.href);
        const hasAccount = localStorage.getItem('user');
        window.location.href = hasAccount ? 'login.html' : 'signup.html'; // تصحيح الرابط
        return;
    }

    const product = products.find(p => p.id === productId);
    if (product) {
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        await saveCartToServer(); // تم إضافة استدعاء لحفظ السلة بالسيرفر
        alert('Product added to cart!');
    }
}

function loadProducts(category = 'all') {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    const filteredProducts = category === 'all' 
        ? products 
        : products.filter(p => p.category === category);

    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">${product.price.toFixed(2)} EGP</p>
                <button class="select-options" onclick="addToCart(${product.id})">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartCount();
    
    const cartLink = document.querySelector('.cart-icon a');
    if (cartLink) {
        cartLink.addEventListener('click', handleCartClick);
    }
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const category = e.target.getAttribute('href').replace('#', '');
        loadProducts(category);
    });
}); 

// كود صفحة التسجيل (signup.html)
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();
      if (res.ok) {
        alert('تم إنشاء الحساب بنجاح! سيتم تحويلك لصفحة الدخول');
        window.location.href = 'login.html';
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('تعذر الاتصال بالسيرفر');
    }
  });
}

// كود صفحة تسجيل الدخول (login.html)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('loggedIn', 'true'); // إضافة تعيين حالة الدخول

        alert('تم تسجيل الدخول بنجاح!');
        
        const redirectUrl = localStorage.getItem('redirectAfterLogin') || 'index.html';
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('تعذر الاتصال بالسيرفر');
    }
  });
}