
export const ValidateEventStep = (formData:any) => {
 
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
     if(!formData?.coverImage || formData?.coverImage === null){
        newErrors.coverImage = "CoverImage is required.";
    }

    return newErrors;
}