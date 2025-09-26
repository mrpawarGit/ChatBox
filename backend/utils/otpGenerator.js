const otpGenerator = () => {
  return Math.floor(100000 + Math.random() * 90000).toString();
};

module.exports = otpGenerator;
