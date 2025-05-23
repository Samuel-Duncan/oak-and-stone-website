const authCheck = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.session.redirectTo = req.originalUrl;
    res.redirect('/auth/sign-in');
  }
};

module.exports = authCheck;
