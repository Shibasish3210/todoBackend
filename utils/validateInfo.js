import validator from "validator";


export const validateSignUp = ({name, email, username, password})=>{
    return new Promise((resolve, reject) =>{
        if(!email || !username || !password || !name) reject('Missing credentials');

        if(email && !validator.isEmail(email)) reject('Invalid email address');

        if( typeof username !== 'string' ) reject('Invalid datatype for username');
        if( typeof password !== 'string' ) reject('Invalid datatype for password');
        if( typeof name !== 'string') reject('Invalid datatype for name');
        if( typeof email !== 'string') reject('Invalid datatype for email');

        if(username.length <= 3 || username.length >= 100) reject('Username must be between 4 and 100 characters');
        if(password.length <= 5 || password.length >= 100) reject('Password must be between 6 and 100 characters');
        resolve();
    });
}

export const validateLogIn = ({loginId, password})=>{
    return new Promise((resolve, reject) =>{
        if( !password || !loginId) reject('Missing credentials');

        if( typeof loginId !== 'string' ) reject('Invalid datatype for loginId');
        if( typeof password !== 'string' ) reject('Invalid datatype for password');
        if(loginId.length <= 3 || loginId.length >= 100) reject('Username must be between 4 and 100 characters');
        if(password.length <= 5 || password.length >= 100) reject('Password must be between 6 and 100 characters');
        resolve();
    });
}
export const validateTodo = ({ task_name })=>{
    return new Promise((resolve, reject) =>{
        if( !task_name ) reject(`Task name can't be empty`);

        if( typeof task_name !== 'string' ) reject('Invalid datatype for task name');
    
        if(task_name.length <= 3 || task_name.length >= 100) reject('Task name must be between 4 and 100 characters');
        
        resolve();
    });
}