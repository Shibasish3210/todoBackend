//all imports
import express from 'express';
import session from 'express-session';
import ConnectMongoDBSession from 'connect-mongodb-session';
import cors from 'cors'
import validator from 'validator';
import { hash, compare } from 'bcrypt';
import { validateLogIn, validateSignUp, validateTodo } from './utils/validateInfo.js';
import { isAuth } from './middleware/isAuth.js';
import connectToDB from './db.js';
import userModel from './models/userModel.js';
import todoModel from './models/todoModel.js';
import sessionModel from './models/sessionModel.js';
import rateLimit from './middleware/rateLimit.js';



//all global constants
const app = express();
const PORT = parseInt(process.env.PORT);
const MongoDBStore = ConnectMongoDBSession(session);
const store = new MongoDBStore({
    uri: process.env.Mongo_URL,
    collection: 'sessions',
},(err) =>{
    if (err){
        console.log(err);
        return;
    }
})
connectToDB();


//using global middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["POST", "PUT", "GET", "DELETE"],
    credentials: true,
}));
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        maxAge: 1000 * 24 * 60 * 60 * 2
    }
}));

app.listen(PORT, ()=>{
    console.log(PORT)
    console.log(`Server running on PORT http://localhost:${PORT}`);
});

//test route
app.get('/', (req, res)=>{
    res.send('server up and running');
})


//registration route
app.post('/register', async (req, res)=>{
    const { name, username, email, password } = req.body;
    const SALT = parseInt(process.env.SALT);

    //data validation
    try {
        await validateSignUp({name, username, email, password});
    } catch (error) {
        console.log(error);
        return res.send({
            status: 400,
            message: error,
        });
    }

    //hashing password(encrypting);
    let hashedPassword;
    try {
        hashedPassword = await hash(password, SALT);
    } catch (error) {
        res.send({
            status: 424,
            message: 'Unable to encrypt password',
            error: error
        });
        return;
    }

    //check if userName already exits
    let user = await userModel.findOne({userName: username});
    if(user){
        res.send({
            status: 400,
            message: 'Username Already Exists',
        });
        return;
    }


    //check if userEmail already exits
    user = await userModel.findOne({email: email});
    if(user){
        res.send({
            status: 400,
            message: 'Email Already Exists',
        });
        return;
    }

    //creating new User object
    user = new userModel({
        name: name,
        userName: username,
        email: email,
        password: hashedPassword,
    });


    //saving new User in database
    try {

        const userDb = await user.save();
        res.send({
            status:201,
            message: 'User Added Successfully',
        });
    } catch (error) {
        console.log('y');
        console.log(error);
        res.send({
            status:500,
            message: `Failed saving data in DB.Please try again.`
        })
    }
});


//login route
app.post('/login', async (req, res) => {
    const { loginId, password } = req.body;

    try {
        await validateLogIn({loginId, password});
    } catch (error) {
        console.log(error);
        res.send({
            status: 400,
            message: error,
        });
        return;
    }

    let isPresent;
    //login Id is email address
    if(validator.isEmail(loginId)){
        isPresent = await userModel.findOne({ email: loginId});

        if(!isPresent){
            res.send({
                status: 400,
                message: 'This email id is not registered'
            });
            return;
        }
    }else{
        isPresent = await userModel.findOne({ userName: loginId});

        if(!isPresent){
            res.send({
                status: 400,
                message: 'This username is not registered'
            });
            return;
        }
    }

    try {
        const compPassword = await compare(password, isPresent.password);
        if(!compPassword){
            res.send({
                status: 400,
                message: 'Wrong Password'
            });
            return;
        }
    } catch (error) {
        res.send({
            status: 500,
            message: `Password couldn't be matched due to internal error`
        });
        return;
    }

    req.session.isAuth = true;
    req.session.user = {
        name: isPresent.name,
        userName: isPresent.userName,
        email: isPresent.email,
        id: isPresent._id
    }  
    console.log(req.session);
    res.send({ status:200, message: 'LogIn API hit' });
});


//check if the user is authenticated
app.get('/is_authenticated',isAuth, (req, res) => {
    console.log(req.session.id)
    res.send({
        status:200,
        message: 'Welcome to Todo App',
    })
})

//logout route
app.get('/logout',isAuth, (req, res) => {
    req.session.destroy();
    return res.send({
        status:200,
        message: 'Logout successfull'
    });
})

//logout from all devices route
app.get('/logout_from_all_devices', isAuth, async (req, res) => {
    const userName = req.session.user.userName;

    try {
        const response = await sessionModel.deleteMany({
            'session.user.userName' : userName
        })
        
        console.log(response);
        res.send({
            status:200,
            message: 'Logout from all devices successfull'
        })
    } catch (error) {
        console.log(error);
        res.send({
            staus: 500,
            message: 'Database error',
            error: error
        })
    }
})




//todo-routes
app.get('/todos', isAuth,  async (req, res) => {
    const queryObj = {
        userName : req.session.user.userName
    };

    try {
        const todoData = await todoModel.find( queryObj );
        // console.log(todoData);

        if( todoData.length > 0 ) {
            return res.send({
                status: 200,
                message:'Fetched todos successfully',
                data: todoData
            });
        }else{
            return res.send({
                status: 200,
                message:'No Todos Found',
            });
        }
    } catch (error) {
        res.send({
            status: '500',
            message:'Database Error'
        })
    }
})

app.get('/todos/paginated', isAuth, async (req, res) => {
    const SKIP = +req.query.skip || 0;
    const LIMIT = +process.env.Limit;
    console.log(SKIP, typeof SKIP, LIMIT);

    const queryObj = {
        userName : req.session.user.userName
    };

    try {
        const todoData = await todoModel.aggregate([
            {
                $match: queryObj
            },
            {
                $facet:{
                    data: [{ $skip: SKIP }, { $limit: LIMIT }]
                }
            }
        ])

        if( todoData.length > 0 ) {
            return res.send({
                status: 200,
                message:'Fetched todos successfully',
                data: todoData[0].data
            });
        }else{
            return res.send({
                status: 200,
                message:'No Todos Found',
            });
        }
    } catch (error) {
        console.log(error)
        res.send({
            status: '500',
            message:'Database Error'
        })
    }
})

app.post('/todos/create',isAuth, rateLimit, async (req, res)=>{
    // console.log(1 , req.session.id);
    const { task_name } = req.body;
    try {
        await validateTodo({ task_name });
    } catch (error) {
        console.log(error, 1);
        return res.send({
            status: 400,
            message: error
        })
    }
    const todoObj = new todoModel({
        task_name: task_name,
        isCompleted: false,
        userName: req.session.user.userName
    })

    try {
        const todoDb = await todoObj.save();
        res.send({
            status: 200,
            message: 'Created Todo Successfully',
            data: todoDb
        })
    } catch (error) {
        return res.send({
            status: 500,
            message: 'Database error',
            error: error
        })
    }
});

app.post('/todos/updateState', isAuth, async (req, res) => {
    //destructuring the request body
    const { id } = req.body;
    
    // if no id return 
    if( !id ){
        return res.send({
            status: 400,
            message: 'Sorry, Please Refresh & Try Again'
        })
    }

    try {
        const queryObj = {
            _id: id
        };
        //ownership check and checking if the todo exists 
        const isPresent = await todoModel.findOne( queryObj );

        if( !isPresent ){
            return res.send({
                status: 400,
                message: 'Sorry, Please Refresh & Try Again'
            })
        }else if( isPresent.userName !== req.session.user.userName ){
            return res.send({
                status: 400,
                message: `The user trying to modify the record isn't the owner`
            })
        }


        //updating the todo
        const todoDb = await todoModel.findOneAndUpdate( queryObj, { isCompleted: !isPresent.isCompleted } );
        res.send({
            status: 200,
            message: 'Updated Todo Successfully',
            data: todoDb
        });
    } catch (error) {
        return res.send({
            status: 500,
            message: 'Database error',
            error: error
        });
    }
})

app.post('/todos/update', isAuth, async (req, res) => {
    //destructuring the request body
    const { id, task_name } = req.body;
    
    // if no id return 
    if( !id ){
        return res.send({
            status: 400,
            message: 'Sorry, Please Refresh & Try Again'
        })
    }

    // task_name validation
    try {
        await validateTodo({ task_name });
    } catch (error) {
        return res.send({
            status: 400,
            message: error
        })
    }

    try {
        const queryObj = {
            _id: id
        };
        //ownership check and checking if the todo exists 
        const isPresent = await todoModel.findOne( queryObj );

        if( !isPresent ){
            return res.send({
                status: 400,
                message: 'Sorry, Please Refresh & Try Again'
            })
        }else if( isPresent.userName !== req.session.user.userName ){
            return res.send({
                status: 400,
                message: `The user trying to modify the record isn't the owner`
            })
        }


        //updating the todo
        const todoDb = await todoModel.findOneAndUpdate( queryObj, { task_name: task_name } );
        res.send({
            status: 200,
            message: 'Updated Todo Successfully',
            data: todoDb
        });
    } catch (error) {
        return res.send({
            status: 500,
            message: 'Database error',
            error: error
        });
    }
})

app.post('/todos/delete', isAuth, async (req, res) => {
    //destructuring the request body
    const { id } = req.body;
    
    // if no id return 
    if( !id ){
        return res.send({
            status: 400,
            message: 'Sorry, Please Refresh & Try Again'
        })
    }

    try {
        const queryObj = {
            _id: id
        };
        //ownership check and checking if the todo exists 
        const isPresent = await todoModel.findOne( queryObj );

        if( !isPresent ){
            return res.send({
                status: 400,
                message: 'Sorry, Please Refresh & Try Again'
            })
        }else if( isPresent.userName !== req.session.user.userName ){
            return res.send({
                status: 400,
                message: `The user trying to modify the record isn't the owner`
            })
        }


        //deleting the todo
        const todoDb = await todoModel.findOneAndDelete( queryObj );
        res.send({
            status: 200,
            message: 'Deleted Todo Successfully',
        });
    } catch (error) {
        return res.send({
            status: 500,
            message: 'Database error',
            error: error
        });
    }
})



