const validateRegister = (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  next();
};

const validateProjectCreate = (req, res, next) => {
  const { title } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ message: 'Project title is required' });
  }

  next();
};

const validateTaskCreate = (req, res, next) => {
  const { title, projectId } = req.body;

  if (!title || !projectId) {
    return res.status(400).json({ message: 'Title and project ID are required' });
  }

  next();
};

module.exports = {
  validateRegister,
  validateProjectCreate,
  validateTaskCreate
};
