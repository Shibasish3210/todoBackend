import { AccessModel } from "../models/accessModel.js";


const rateLimit = async (req, res, next)=>{
    const userId = req.session.user.id;
    const queryObj = {userId: userId};
    
    try {
            //check if user has already made prev request
            const isPresent = await AccessModel.findOne(queryObj);
            console.log('x', isPresent);
            //if user has not made previous request make entry in access db
            if(!isPresent){
                console.log('xyz')
                const userObj = new AccessModel({
                    userId: userId,
                    lastReq: Date.now()
                })
                const userDb = await userObj.save();
                next();
                return;
            }
            //if user made previous request check difference between them 
            const timeDiff = (+Date.now() - +isPresent.lastReq) / 1000;
            console.log(1, timeDiff, Date.now(), isPresent.lastReq);

            //else if difference is lesser than limit reject request
            if(timeDiff < 5){
                return res.send({
                    status: 403,
                    message: 'Too many requests, \n Please try after some time'
                })
            }
            
            //if difference is greater than limit update time
            await AccessModel.findOneAndUpdate(queryObj, {lastReq: Date.now()});
            next();
        } catch (error) {
            console.log(error);
            return res.send({
                status: '500',
                message: 'database error',
                error: error
            })
        }
}


export default rateLimit;