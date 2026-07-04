const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { maskIdCard } = require('../utils/helpers');

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { phone, email, password, name, role } = req.body;

    if (!password || !name || !role) {
      return res.status(400).json({ message: '请填写必填字段' });
    }

    if (!['tenant', 'landlord'].includes(role)) {
      return res.status(400).json({ message: '角色无效' });
    }

    if (!phone && !email) {
      return res.status(400).json({ message: '手机号和邮箱至少填一个' });
    }

    // Check duplicate account
    let existingUser = null;
    if (phone) {
      existingUser = await User.findOne({ phone });
    }
    if (!existingUser && email) {
      existingUser = await User.findOne({ email });
    }
    if (existingUser) {
      return res.status(400).json({ message: '该账号已被注册' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      phone: phone || undefined,
      email: email || undefined,
      passwordHash,
      name,
      role,
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        gender: user.gender,
        birthday: user.birthday,
        idCard: maskIdCard(user.idCard),
        address: user.address,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { phone, email, password, role } = req.body;

    if (!password || !role) {
      return res.status(400).json({ message: '请填写必填字段' });
    }

    // Find user by phone or email
    let user = null;
    if (phone) {
      user = await User.findOne({ phone });
    }
    if (!user && email) {
      user = await User.findOne({ email });
    }
    if (!user) {
      return res.status(401).json({ message: '账号或密码错误' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: '账号或密码错误' });
    }

    // Check status
    if (user.status === 'disabled') {
      return res.status(403).json({ message: '账号已被禁用' });
    }

    // Check role
    if (user.role !== role) {
      return res.status(401).json({ message: '角色选择错误' });
    }

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        gender: user.gender,
        birthday: user.birthday,
        idCard: maskIdCard(user.idCard),
        address: user.address,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const user = req.user;
  res.json({
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      gender: user.gender,
      birthday: user.birthday,
      idCard: maskIdCard(user.idCard),
      address: user.address,
      bio: user.bio,
      createdAt: user.createdAt,
    },
  });
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { name, phone, email, avatar, gender, birthday, idCard, address, bio } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (email) updates.email = email;
    if (avatar !== undefined) updates.avatar = avatar;
    if (gender !== undefined) updates.gender = gender;
    if (birthday) updates.birthday = birthday;
    if (idCard !== undefined) updates.idCard = idCard;
    if (address !== undefined) updates.address = address;
    if (bio !== undefined) updates.bio = bio;

    if (phone) {
      const existingUser = await User.findOne({ phone, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ message: '该手机号已被其他账号使用' });
      }
    }

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ message: '该邮箱已被其他账号使用' });
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });

    res.json({
      message: '更新成功',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        gender: user.gender,
        birthday: user.birthday,
        idCard: maskIdCard(user.idCard),
        address: user.address,
        bio: user.bio,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: '请填写原密码和新密码' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: '新密码长度至少6位' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: '原密码错误' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user._id, { passwordHash });

    res.json({ message: '密码修改成功' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;