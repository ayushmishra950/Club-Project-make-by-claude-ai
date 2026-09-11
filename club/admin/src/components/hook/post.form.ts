
export const ValidatePostStep = (formData:any) => {
 
    let newErrors :any ={};
    if(!formData?.title?.trim()){
        newErrors.title = "Title is required.";
    };

     if(!formData?.description?.trim()){
        newErrors.description = "Description is required.";
    }

   if (!formData?.images || formData.images.length === 0) {
    newErrors.images = "Image is required.";
}
  else if(formData?.images?.length > 3){
    newErrors.images = "Maximum 3 images allowed.";
  }

    return newErrors;
}