const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const House = require('../models/House');
const Appointment = require('../models/Appointment');
const { authenticate, authorize } = require('../middleware/auth');

// Shared query logic
async function getContractsForUser(user, statusFilter) {
  let filter = {};
  if (user.role === 'tenant') {
    filter.tenantId = user._id;
  } else if (user.role === 'landlord') {
    filter.landlordId = user._id;
  }
  if (statusFilter) filter.status = statusFilter;
  return Contract.find(filter)
    .populate('tenantId', 'name phone')
    .populate('landlordId', 'name phone')
    .populate('houseId', 'title address area rent deposit images')
    .sort({ createdAt: -1 });
}

// ── Static GET routes (must be before /:id) ──

// GET /api/contracts - List contracts (role-based)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const contracts = await getContractsForUser(req.user, req.query.status);
    res.json(contracts);
  } catch (err) {
    next(err);
  }
});

// GET /api/contracts/my - Alias for tenant contracts
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const contracts = await getContractsForUser(req.user, req.query.status);
    res.json({ contracts });
  } catch (err) {
    next(err);
  }
});

// GET /api/contracts/manage - Alias for landlord contracts
router.get('/manage', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const contracts = await getContractsForUser(req.user, req.query.status);
    res.json({ contracts });
  } catch (err) {
    next(err);
  }
});

// GET /api/contracts/landlord/tenants - Tenants with confirmed appointments
router.get('/landlord/tenants', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const appointments = await Appointment.find({
      landlordId: req.user._id,
      status: 'confirmed',
    }).populate('tenantId', 'name phone').populate('houseId', 'title address');

    const tenantMap = new Map();
    for (const apt of appointments) {
      if (apt.tenantId && !tenantMap.has(apt.tenantId._id.toString())) {
        tenantMap.set(apt.tenantId._id.toString(), {
          _id: apt.tenantId._id,
          name: apt.tenantId.name,
          phone: apt.tenantId.phone,
          houseTitle: apt.houseId?.title || '',
          appointmentId: apt._id,
        });
      }
    }
    res.json(Array.from(tenantMap.values()));
  } catch (err) {
    next(err);
  }
});

// ── Static POST routes ──

// POST /api/contracts - Create contract (landlord)
router.post('/', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const { tenantId, houseId, startDate, endDate, rent, deposit } = req.body;

    if (!tenantId || !houseId || !startDate || !endDate || !rent || deposit === undefined) {
      return res.status(400).json({ message: '请填写必填字段' });
    }

    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: '房源不存在' });
    }
    if (house.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权为此房源创建合同' });
    }

    const contract = new Contract({
      tenantId,
      landlordId: req.user._id,
      houseId,
      startDate,
      endDate,
      rent,
      deposit,
      status: 'draft',
    });

    await contract.save();
    const populated = await Contract.findById(contract._id)
      .populate('tenantId', 'name phone')
      .populate('landlordId', 'name phone')
      .populate('houseId', 'title address');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// POST /api/contracts/from-appointment/:appointmentId - Create contract from confirmed appointment
router.post('/from-appointment/:appointmentId', authenticate, authorize('landlord'), async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('houseId', 'title address rent deposit landlordId');

    if (!appointment) {
      return res.status(404).json({ message: '预约不存在' });
    }
    if (appointment.landlordId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权为此预约创建合同' });
    }
    if (appointment.status !== 'confirmed') {
      return res.status(400).json({ message: '只能为已确认的预约创建合同' });
    }

    const { startDate, endDate, rent, deposit } = req.body;
    if (!startDate || !endDate || !rent || deposit === undefined) {
      return res.status(400).json({ message: '请填写必填字段' });
    }

    const house = appointment.houseId;
    const contract = new Contract({
      tenantId: appointment.tenantId,
      landlordId: req.user._id,
      houseId: house._id || house,
      appointmentId: appointment._id,
      startDate,
      endDate,
      rent: rent || house.rent,
      deposit: deposit || house.deposit,
      status: 'draft',
    });

    await contract.save();
    const populated = await Contract.findById(contract._id)
      .populate('tenantId', 'name phone')
      .populate('landlordId', 'name phone')
      .populate('houseId', 'title address');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// ── Parameterized routes (must be after all static routes) ──

// GET /api/contracts/:id - Get contract detail
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('tenantId', 'name phone email')
      .populate('landlordId', 'name phone email')
      .populate('houseId', 'title address area rent deposit images type floor facilities');

    if (!contract) {
      return res.status(404).json({ message: '合同不存在' });
    }

    const userId = req.user._id.toString();
    if (req.user.role !== 'admin' &&
        userId !== contract.tenantId._id.toString() &&
        userId !== contract.landlordId._id.toString()) {
      return res.status(403).json({ message: '无权查看此合同' });
    }

    res.json(contract);
  } catch (err) {
    next(err);
  }
});

// PUT /api/contracts/:id/sign - Sign contract
router.put('/:id/sign', authenticate, async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: '合同不存在' });
    }

    const userId = req.user._id.toString();

    if (userId === contract.tenantId.toString()) {
      if (contract.signedByTenant) {
        return res.status(400).json({ message: '您已签署此合同' });
      }
      contract.signedByTenant = true;
    } else if (userId === contract.landlordId.toString()) {
      if (contract.signedByLandlord) {
        return res.status(400).json({ message: '您已签署此合同' });
      }
      contract.signedByLandlord = true;
    } else {
      return res.status(403).json({ message: '无权签署此合同' });
    }

    if (contract.signedByTenant && contract.signedByLandlord) {
      contract.status = 'signed';
    } else {
      contract.status = 'pending_sign';
    }

    await contract.save();
    res.json(contract);
  } catch (err) {
    next(err);
  }
});

// PUT /api/contracts/:id/terminate - Terminate contract
router.put('/:id/terminate', authenticate, async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: '合同不存在' });
    }

    const userId = req.user._id.toString();
    if (userId !== contract.tenantId.toString() && userId !== contract.landlordId.toString()) {
      return res.status(403).json({ message: '无权终止此合同' });
    }

    contract.status = 'terminated';
    await contract.save();
    res.json(contract);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
