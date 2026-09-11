

export const validateForm = (formData) => {
    let errors : any = {};

    if(!formData?.name){
        errors.name = "name is required."
    }

    return errors;
}