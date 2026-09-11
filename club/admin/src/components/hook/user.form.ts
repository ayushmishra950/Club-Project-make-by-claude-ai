export const validateRegisterStep = (formData: any, step: number) => {

  let newErrors: any = {};

  // STEP 1
  if (step === 1) {

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.fatherName.trim()) {
      newErrors.fatherName = "Father name is required";
    }

    if (!formData.motherName.trim()) {
      newErrors.motherName = "Mother name is required";
    }

    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    }

    if (!formData.gender) {
      newErrors.gender = "Please select gender";
    }

  }

  // STEP 2
  if (step === 2) {

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }
    else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
    }
    else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }


    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile number is required";
    }
    else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Mobile number must be 10 digits";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
  }

  // STEP 3
  if (step === 3) {

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }


    if (!formData.maritalStatus.trim()) {
      newErrors.maritalStatus = "Please select marital status";
    }

    if (!formData.occupation.trim()) {
      newErrors.occupation = "Occupation is required";
    }

  }

  return newErrors;

};



export const validateLoginStep = (formData: any) => {
  let newErrors: any = {};

  if (!formData?.email?.trim()) {
    newErrors.email = "Email is required."
  }
  else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

  if (!formData?.password?.trim()) {
    newErrors.password = "Password is required."
  }

  return newErrors;
}