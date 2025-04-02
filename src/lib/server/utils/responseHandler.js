exports.success = (res, message, data = null, status = 200 ) => {
    return res.status(status).json({ status:true, message, data })
}

exports.error = (res, message, status = 500) => {
    return res.status(status).json({status:false, message})
}
exports.notFound = (res, message, status = 404) => {
    return res.status(status).json({status:'false', message})
}