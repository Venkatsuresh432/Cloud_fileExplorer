const { body, validationResult } = require('express-validator')

exports.validateServer = [
    body('serverName')
    .trim()
    .isLength({min:3}).withMessage("server name must be atleast 3 charecter")
    .notEmpty().withMessage("server name is required"),

    body('hostToConnect')
    .trim()
    .isURL().withMessage("invalid url")
    .notEmpty().withMessage("Host to connect is required"),


    body('password')
    .trim()
    .isLength({min:8, max:32}).withMessage("password must be between 8-32 charecters")
    .matches(/[a-z]/).withMessage("Must contain 1 lowercase")
    .matches(/[A-Z]/).withMessage("Must Contain 1 uppercase")
    .matches(/\d/).withMessage("must contain 1 digits")
    .matches(/[@!$%*?&]/).withMessage("must contain 1 special charecter"),

    body('port')
    .trim()
    .isInt({min:1, max:65535})
    .notEmpty().withMessage("port number is required"),

    (req, res, next) => {
        const errors = validationResult(req)
        if(!errors.isEmpty){
            return res.status(400).send({error: errors.array()})
        }
        next();
    }
]