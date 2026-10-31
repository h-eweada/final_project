const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createAdminClient } = require('@supabase/server/core');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY || !process.env.JWT_SECRET) {
  console.error('❌ اضبط SUPABASE_URL وSUPABASE_SECRET_KEY وJWT_SECRET في backend/.env');
  process.exit(1);
}

const supabase = createAdminClient();

function requireUser(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) return res.status(401).json({ message: 'سجّل الدخول أولاً' });
  try {
    req.authUser = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'جلسة الدخول غير صالحة، سجّل الدخول مرة أخرى' });
  }
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || !email || password.length < 6) {
      return res.status(400).json({ message: 'أدخل الاسم والبريد وكلمة مرور لا تقل عن 6 أحرف' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email, password: passwordHash })
      .select('id, name, email')
      .single();
    if (error?.code === '23505') return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    if (error) throw error;

    const { error: cartError } = await supabase.from('carts').insert({ user_id: user.id, items: [] });
    if (cartError) throw cartError;
    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح', user: publicUser(user) });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password))) {
      return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
});

app.get('/api/cart/:userId', requireUser, async (req, res) => {
  try {
    if (String(req.authUser.id) !== req.params.userId) return res.status(403).json({ message: 'غير مصرح' });
    let { data, error } = await supabase
      .from('carts')
      .select('user_id, items, updated_at')
      .eq('user_id', req.authUser.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      ({ data, error } = await supabase
      .from('carts')
      .upsert({ user_id: req.authUser.id, items: [] }, { onConflict: 'user_id' })
      .select('user_id, items, updated_at')
      .single());
    }
    if (error) throw error;
    res.json({ userId: data.user_id, items: data.items, updatedAt: data.updated_at });
  } catch (error) {
    console.error('Get cart error:', error.message);
    res.status(500).json({ message: 'خطأ أثناء جلب السلة' });
  }
});

app.post('/api/cart/update', requireUser, async (req, res) => {
  try {
    const { userId, items } = req.body;
    if (!userId || String(req.authUser.id) !== String(userId)) return res.status(403).json({ message: 'غير مصرح' });
    if (!Array.isArray(items)) return res.status(400).json({ message: 'بيانات السلة غير صحيحة' });
    const { data, error } = await supabase
      .from('carts')
      .upsert({ user_id: req.authUser.id, items, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select('user_id, items, updated_at')
      .single();
    if (error) throw error;
    res.json({ userId: data.user_id, items: data.items, updatedAt: data.updated_at });
  } catch (error) {
    console.error('Update cart error:', error.message);
    res.status(500).json({ message: 'خطأ أثناء تحديث السلة' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 الخادم يعمل على المنفذ ${PORT} ومتصل بـ Supabase`));
