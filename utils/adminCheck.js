exports.adminCheck = (req, res, next) => {
  // Check if adminCheck should be skipped for this route
  if (req.adminCheckSkipped) {
    return next();
  }

  // Check if user is authenticated
  if (req.isAuthenticated()) {
    // Check if user is an admin
    if (req.user.isAdmin) {
      // User is an admin, allow them to proceed
      return next();
    } else {
      // User is not an admin, create an error and pass it to the error handler
      const error = new Error(
        'Access denied. You do not have permission to view this page.',
      );
      error.status = 403;
      return next(error);
    }
  } else {
    // User is not authenticated, redirect to login page
    res.redirect('/auth/sign-in');
  }
};

exports.adminCheckSkipped = (req, res, next) => {
  req.adminCheckSkipped = true;
  next();
};
