const authService = require('../services/authService');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = authService.getMe(req.user);
    res.json(user);
  } catch (error) {
    next(error);
  }
};
