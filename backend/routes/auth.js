const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.js');

// 1. مسار إنشاء حساب جديد (Signup)
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // التأكد من عدم وجود المستخدم سابقاً
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'هذا البريد الإلكتروني مسجل بالفعل' });
    }

    // تشفير كلمة المرور قبل الحفظ
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // إنشاء وحفظ الحساب الجديد
    user = new User({
      username,
      email,
      password: hashedPassword
    });
    await user.save();

    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ في السيرفر', error: err.message });
  }
});

// 2. مسار تسجيل الدخول (Login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // البحث عن المستخدم بالإيميل
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'البيانات المدخلة غير صحيحة' });
    }

    // مطابقة كلمة السر المدخلة مع التشفير
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'البيانات المدخلة غير صحيحة' });
    }

    // إنشاء رمز الأمان (JWT Token)
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' } // صلاحيته يوم واحد
    );

    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: 'حدث خطأ في السيرفر', error: err.message });
  }
});

module.exports = router;