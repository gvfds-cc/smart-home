const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const House = require('../models/House');
const Appointment = require('../models/Appointment');
const OperationLog = require('../models/OperationLog');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/reviews/house/:houseId - Get visible reviews for a house
router.get('/house/:houseId', async (req, res, next) => {
  try {
    const houseId = new mongoose.Types.ObjectId(req.params.houseId);

    const reviews = await Review.find({ houseId, visible: true })
      .populate('tenantId', 'name')
      .sort({ createdAt: -1 });

    const result = await Review.aggregate([
      { $match: { houseId, visible: true } },
      { $group: { _id: null, averageScore: { $avg: '$score' }, count: { $sum: 1 } } },
    ]);

    const averageScore = result.length > 0 ? Math.round(result[0].averageScore * 10) / 10 : 0;

    res.json({ reviews, averageScore, total: reviews.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews - Create review (tenant, only for confirmed appointments)
router.post('/', authenticate, authorize('tenant'), async (req, res, next) => {
  try {
    const { houseId, score, content } = req.body;

    if (!houseId || !score) {
      return res.status(400).json({ message: '请填写必填字段' });
    }

    if (score < 1 || score > 5) {
      return res.status(400).json({ message: '评分范围为1-5' });
    }

    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: '房源不存在' });
    }

    // 检查是否有已确认的预约
    const confirmedAppointment = await Appointment.findOne({
      tenantId: req.user._id,
      houseId,
      status: 'confirmed',
    });
    if (!confirmedAppointment) {
      return res.status(403).json({ message: '只有预约成功后才能评价该房源' });
    }

    const existing = await Review.findOne({ tenantId: req.user._id, houseId });
    if (existing) {
      return res.status(400).json({ message: '您已经评价过此房源' });
    }

    const review = new Review({
      tenantId: req.user._id,
      houseId,
      landlordId: house.landlordId,
      score,
      content: content || '',
    });

    await review.save();
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

// GET /api/reviews/available-houses - Houses the tenant can review (has confirmed appointment)
router.get('/available-houses', authenticate, authorize('tenant'), async (req, res, next) => {
  try {
    // 找到租客所有已确认的预约
    const appointments = await Appointment.find({
      tenantId: req.user._id,
      status: 'confirmed',
    }).populate('houseId', 'title address area');

    // 找到已经评价过的房源
    const reviewed = await Review.find({ tenantId: req.user._id }).select('houseId');
    const reviewedIds = new Set(reviewed.map(r => r.houseId.toString()));

    // 过滤掉已评价的房源
    const available = [];
    const seenIds = new Set();
    for (const apt of appointments) {
      const houseId = apt.houseId?._id?.toString() || apt.houseId?.toString();
      if (houseId && !reviewedIds.has(houseId) && !seenIds.has(houseId)) {
        seenIds.add(houseId);
        available.push({
          _id: apt.houseId._id || apt.houseId,
          title: apt.houseId.title || '',
          address: apt.houseId.address || '',
          area: apt.houseId.area || '',
        });
      }
    }

    res.json(available);
  } catch (err) {
    next(err);
  }
});

// GET /api/reviews/my - Get my reviews (tenant)
router.get('/my', authenticate, authorize('tenant'), async (req, res, next) => {
  try {
    const reviews = await Review.find({ tenantId: req.user._id })
      .populate('houseId', 'title address')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

// PUT /api/reviews/:id/hide - Toggle review visibility (admin)
router.put('/:id/hide', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: '评价不存在' });
    }

    review.visible = !review.visible;
    await review.save();

    await OperationLog.create({
      operatorId: req.user._id,
      action: 'toggle_review_visibility',
      targetType: 'Review',
      targetId: review._id,
      detail: `${review.visible ? '显示' : '隐藏'}评价，房源ID：${review.houseId}`,
    });

    res.json(review);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
