
const { body, validationResult } =require('express-validator')

exports.validateUser = [
    body('userName')
    .trim()
    .notEmpty().withMessage("name is required")
    .isLength( { min:3 } ).withMessage("Name must Be atleast 3 charecter"),
    
    
    body('email')
    .trim()
    .notEmpty().withMessage("Email id required")
    .isEmail().withMessage("Invalid Email format"),


    body('password')
    .notEmpty().withMessage("Password is required")
    .isLength( { min:6 } ).withMessage("password must atleast 6 charecters"),
    
    
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(400).send(errors.array())
        }
        next();
    }
]

