
export const ValidateEventStep = (formData:any) => {
    console.log(formData)
 
    let newErrors :any ={};
    if(!formData?.title?.trim()){
        newErrors.title = "Title is required.";
    };

     if(!formData?.description?.trim()){
        newErrors.description = "Description is required.";
    }

     if(!formData?.date?.trim()){
        newErrors.date = "Date is required.";
    }
    if(!formData?.category?.trim() || formData?.category === "all"){
        newErrors.category = "Category is required.";
    }

     if(!formData?.location?.trim()){
        newErrors.location = "Location is required.";
    }
     if(!formData?.coverImage || (Array.isArray(formData.coverImage) && formData.coverImage.length === 0)){
        newErrors.coverImage = "Cover Image is required.";
    }

    return newErrors;
}