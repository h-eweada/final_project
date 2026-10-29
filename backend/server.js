const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/user.js');
const Cart = require('./models/cart.js');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// الاتصال بقاعدة البيانات المحلية
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/my_website_db';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ تم الاتصال بقاعدة البيانات MongoDB بنجاح'))
  .catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

// 1. مسار تسجيل حساب جديد (Sign in / Register)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // التحقق من وجود المستخدم
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    // إنشاء المستخدم
    const newUser = await User.create({ name, email, password });

    // إنشاء سلة تسوق فارغة مرتبطة بـ ID المستخدم
    await Cart.create({ userId: newUser._id, items: [] });

    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في الخادم', error: error.message });
  }
});

// 2. مسار تسجيل الدخول (Login)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    // إنشاء التوكن JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key', {
      expiresIn: '7d'
    });

    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في الخادم', error: error.message });
  }
});

// 3. مسار جلب السلة (Get Cart)
app.get('/api/cart/:userId', async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
      cart = await Cart.create({ userId: req.params.userId, items: [] });
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء جلب السلة', error: error.message });
  }
});

// 4. مسار تحديث/حفظ عناصر السلة (Update Cart)
app.post('/api/cart/update', async (req, res) => {
  try {
    const { userId, items } = req.body;
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء تحديث السلة', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`));