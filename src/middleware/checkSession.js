const sessionCheck = (req, res, next) => {
    const userId = req.session.userId;
    console.log("Session user id:",userId)

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "User is not authenticated!"
        })
    }

    next();
}

module.exports = {
    sessionCheck
}