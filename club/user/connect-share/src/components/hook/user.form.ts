
export const validateRegisterStep = (formData: any, step: number) => {
    let newErrors: any = {};

    // ==================== STEP 1 ====================
    if (step === 1) {
        if (!formData.fullName?.trim()) {
            newErrors.fullName = "Full name is required";
        }

        if (!formData.dob) {
            newErrors.dob = "Date of birth is required";
        }

        if (!formData.gender) {
            newErrors.gender = "Please select gender";
        }

          if (!formData.mobile?.trim()) {
            newErrors.mobile = "Mobile number is required";
        } else if (!/^[0-9]{10}$/.test(formData.mobile)) {
            newErrors.mobile = "Mobile number must be 10 digits";
        }

          if (!formData.email?.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }
    }

    // ==================== STEP 2 ====================
    if (step === 2) {
        // Password
        if (!formData.password?.trim()) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        // Confirm Password
        if (!formData.confirmPassword?.trim()) {
            newErrors.confirmPassword = "Confirm password is required";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        // Address
        if (!formData.address?.trim()) {
            newErrors.address = "Address is required";
        }

         if (!formData.city?.trim()) {
            newErrors.city = "City is required";
        }

        if (!formData.state?.trim()) {
            newErrors.state = "State is required";
        }
    }

    // ==================== STEP 3 ====================
    if (step === 3) {

        if (!formData.maritalStatus?.trim()) {
            newErrors.maritalStatus = "Please select marital status";
        }

        if (!formData.occupation?.trim()) {
            newErrors.occupation = "Occupation is required";
        }
    }

    return newErrors;
};


export const validateLoginStep = (formData: any) => {
  
  let newErrors: any = {};
    
  const identifier = formData?.identifier?.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const phoneRegex = /^\d{10}$/;

  if (!identifier) { newErrors.identifier = "Email or Phone is required.";} 
  else {
    const isEmail = emailRegex.test(identifier);
    const isPhone = phoneRegex.test(identifier);

    if (!isEmail && !isPhone) { newErrors.identifier = "Enter a valid email or phone number."; }
  }

  // Password Validation
  if (!formData?.password?.trim()) {
    newErrors.password = "Password is required.";
  }

  return newErrors;
};