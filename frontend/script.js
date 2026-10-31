// Sample product data
const products = [
    {
        id: 1,
        name: "Minnie Pyjama For Girls",
        price: 420.00,
        image: "https://i0.wp.com/katjie.com/wp-content/uploads/2025/04/IMG_0473-scaled.jpg?resize=600%2C900&ssl=1",
        category: "summer"
    },
    {
        id: 2,
        name: "Carrots Bodysuit For Boys",
        price: 375.00,
        image: "https://i0.wp.com/katjie.com/wp-content/uploads/2025/03/IMG_0326-scaled.jpg?resize=1320%2C1980&ssl=1",
        category: "basics"
    },
    // Add more products as needed
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
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    
    if (isLoggedIn) {
        cartCount.textContent = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    } else {
        cartCount.textContent = '0';
    }
}

function handleCartClick(e) {
    // Always prevent default navigation
    e.preventDefault();
    
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    if (!isLoggedIn) {
        // Save cart page as redirect destination
        localStorage.setItem('redirectAfterLogin', 'cart.html');
        
        // Check if user has an account
        const hasAccount = localStorage.getItem('user');
        if (!hasAccount) {
            // If no account exists, redirect to signup
            window.location.href = 'signup.html';
        } else {
            // If account exists but not logged in, redirect to login
            window.location.href = 'login.html';
        }
    } else {
        // Only navigate to cart if logged in
        window.location.href = 'cart.html';
    }
}

function addToCart(productId) {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    if (!isLoggedIn) {
        // Save current page as redirect destination
        localStorage.setItem('redirectAfterLogin', window.location.href);
        
        // Check if user has an account
        const hasAccount = localStorage.getItem('user');
        if (!hasAccount) {
            // If no account exists, redirect to signup
            window.location.href = 'signup.html';
        } else {
            // If account exists but not logged in, redirect to login
            window.location.href = 'login.html';
        }
        return;
    }

    const product = products.find(p => p.id === productId);
    if (product) {
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        saveCartToServer();
        updateCartCount();
        alert('Product added to cart!');
    }
}

// Load products
function loadProducts(category = 'all') {
    const productsGrid = document.querySelector('.products-grid');
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartCount();
    
    // Add click handler to cart icon
    const cartLink = document.querySelector('.cart-icon a');
    if (cartLink) {
        cartLink.addEventListener('click', handleCartClick);
    }
});

// Handle navigation
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const category = e.target.getAttribute('href').replace('#', '');
        loadProducts(category);
    });
}); 
// كود كود صفحة التسجيل (signup.html)
const signupForm = document.getElementById('signupForm'); // تأكدي إن id الفيلد صح في signup.html
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
const loginForm = document.getElementById('loginForm'); // تأكدي إن id الفيلد صح في login.html
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
        // حفظ الـ Token وبيانات المستخدم في الـ LocalStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        alert('تم تسجيل الدخول بنجاح!');
        window.location.href = 'index.html'; // التحويل للرئيسية
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('تعذر الاتصال بالسيرفر');
    }
  });
}
