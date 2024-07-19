const authCheck = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/auth/sign-in');
  }
};

module.exports = authCheck;
