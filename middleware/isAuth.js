export const isAuth = (req, res, next) =>{
    if(req.session.isAuth){
        next();
    }else{
        return res.send({
            status: 403,
            message: 'Please Login To Access'
        })
    }
}