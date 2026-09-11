

export const validateGroupForm = (formData) => {
    let errors : any = {};

    if(!formData?.title){
        errors.title = "Title is required."
    }

    if(!formData?.description){
        errors.description = "Description is required."
    }
    if(formData?.files?.length === 0){
        errors.images = "At least one image is required."
    }
    else if(formData?.files?.length>3){
        errors.images = "You can upload a maximum of 3 images."
    }

    return errors;
}