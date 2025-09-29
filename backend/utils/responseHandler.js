const response = (res,stateCode,message,data=null)=>{
    if (!res) {
        console.error("Response object is null");
        return; // Handle null response object
    }
    const responseObject = {
        status:stateCode < 400 ? 'success' : 'error',
        message,
        data
    }
    return res.status(stateCode).json(responseObject)
}

module.exports= response;