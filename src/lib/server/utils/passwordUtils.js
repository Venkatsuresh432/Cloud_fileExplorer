const bcrypt = require('bcryptjs')

const hashedPassword = async (password) => {
    const salt = bcrypt.genSaltSync(10)
    return await bcrypt.hash(password, salt)   
}

const hashedPassKey = async (privateKey) => {
    const salt = bcrypt.genSaltSync(10)
    return await bcrypt.hash(privateKey, salt)
}

module.exports = { hashedPassword, hashedPassKey };