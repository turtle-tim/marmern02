/*
authentication only as users
1) DON'T LET PEN TESTERS KNOW IF A USERNAME/ EMAIL IS REGISTERED
2) add salt w/ hash
    login,
    refresh,
    logout,
    requestResetPassword,
    resetPassword
*/
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const jwtSign=jwt.sign
const jwtVer=jwt.verify
const transporter=require("nodemailer").createTransport
const Staff=require("../model/credential")

const login=async(req,res)=>{
    const{username,password}=req.body
    if(!username||!password)return res.status(400).json({message:"You need to fill up the form"})
    const foundUser=await User.findOne({username}).exec()
    if(!foundUser||!foundUser.active)return res.status(401).json({message:"Unauthorized"})
    if(!await bcrypt.compare(password,foundUser.password))return res.status(401).json({message:"Unauthorized"})

    const accessToken=jwtSign({"UserInfo":{"username":foundUser.username,"roles":foundUser.roles}},
    process.env.ACCESS_TOKEN_SECRET,{expiresIn:"1h"})
    const refreshToken=jwtSign({"username":foundUser.username},
        process.env.REFRESH_TOKEN_SECRET,{expiresIn:"1d"})
    res.cookie("jwt",refreshToken,{
        httpOnly:true,
        secure:true,
        sameSite:"None",//cross-site cookie
        maxAge:7*24*60*60*1000
    })
    res.json({accessToken})
}//login

const requestResetPassword=async(req,res)=>{
    const{email}=req.body
    const foundUser=await Staff.findOne({email:email}).exec()
    if(!foundUser)return res.status(404).json({
        message:"You will receive an email prompting your password reset if you have an active account"})//wink (1)
    //send email
    const tempAccessToken=jwtSign({_id:foundUser._id},process.env. RESET_TOKEN_SECRET,{expiresIn:"15m"})
    const transport=transporter({service:"manitobachiefs.com",auth:{user:process.env.NOREPLY_EMAIL,pass:process.env.NOREPLY_PW},})
    const mail={from:process.env.NOREPLY_EMAIL,to:email,subject:"Reset your password",
                html:`<h1>Reset Your Password</h1>
                <p>Click on the following link to reset your password:</p>
                <a href="http://localhost:5173/reset-password/${tempAccessToken}">http://localhost:5173/reset-password/${tempAccessToken}</a>
                <p>The link will expire in 10 minutes.</p>
                <p>If you didn't request a password reset, please ignore this email.</p>`}
    transport.sendEmail(mail,(err,_)=>{
        if(err)return res.status(500).json({message:err.message})
        res.status(200).json({
    message:"You will receive an email prompting your password reset if you have an active account"})// (1)
    })
}//requestResetPassword

const resetPassword=(req,res)=>{
    const params=req.params
    const{newPw}=req.body
    if(!params?.tempAccessToken)return res.status(401).json({message:"Unauthorized"})
    if(!newPw)return res.status(404).json({message:"No new password entered"})
    jwtVer(cookies.jwt,process.env.RESET_TOKEN_SECRET,
        async(err,decoded)=>{
            if(err)return res.status(403).json({message:"Forbidden"})
            const foundUser=await Staff.findOne({_id:decoded._id}).exec()
            if(!foundUser)return res.status(401).json({message:"Unauthorized"})
            foundUser.password=newPw
            res.status(200).json(`"${(await Staff.save()).username}" updated`)
        }
    )
}//resetPassword

const refresh=async(req,res)=>{
    const cookies=req.cookies
    if(!cookies?.jwt)return res.status(401).json({message:"Unauthorized"})
    jwtVer(cookies.jwt,process.env.REFRESH_TOKEN_SECRET,
        async(err,decoded)=>{
            if(err)return res.status(403).json({message:"Forbidden"})
            const foundUser=await Staff.findOne({username:decoded.username}).exec()
            if(!foundUser)return res.status(401).json({message:"Unauthorized"})
            const accessToken=jwtSign({_id:foundUser._id},process.env.ACCESS_TOKEN_SECRET,{expiresIn:"30m"})
            res.json({accessToken})
        }
    )
}//refresh

const logout=(req,res,next)=>{
    const cookies=req.cookies
    if(!cookies?.jwt)return res.sendStatus(204)
    req.session.destroy(err=>err?next(err):res.sendStatus(200))
    res.clearCookies("jwt",{httpOnly:true,sameSite:"None",secure:true})
    res.json({message:"Cookie cleared"})
}//logout

module.exports={
    login,
    requestResetPassword,
    resetPassword,
    refresh,
    logout
}