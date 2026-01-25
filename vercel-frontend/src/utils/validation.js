export const validatePhone = (phone) => {
  // Validates 10-digit Indian phone numbers starting with 6-9
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const getValidationErrors = (formData) => {
  const errors = {};

  if (formData.email && !validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (formData.phone && !validatePhone(formData.phone)) {
    errors.phone = 'Please enter a valid 10-digit phone number (e.g., 9876543210)';
  }

  return errors;
};