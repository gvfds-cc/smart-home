function maskIdCard(idCard) {
  if (!idCard || idCard.length < 7) {
    return '';
  }
  return `${idCard.slice(0, 3)}********${idCard.slice(-4)}`;
}

module.exports = { maskIdCard };