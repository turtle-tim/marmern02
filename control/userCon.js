/*
CRUD staff credential as admin
1) use getSalt w/ hash
    getAllUsers,
    createNewUser,
    updateUser,
    deactivateUser,
    deleteUser
username,password,roles, active
username,email,password,firstName,lastName,role,isActive
*/
const Staff=require("../model/credential")
const clientFolder=require("../model/clientFolder")
const bc=require("bcrypt")
const hash=bc.hash
const genSalt=bc.genSalt

const getAllUsers=async(_,res)=>{
    const users=await find().select("-password").lean()
    if(!users?.length)return res.status(400).json({message:"No users found"})
    res.json(users)
}//getAllUsers

const createNewUser=async(req,res)=>{
    const{username,email,password,firstName,lastName,roles}=req.body
    if(!username||!email||!password||!firstName||!lastName||!roles)return res.status(400).json({message:"You need to fill up the form"})
    if(await Staff.findOne({username}).collation({locate:"en",strength:2}).lean().exec())return res.status(409).json({message:"Duplicated username"})
    /*
    collation({...,strength:2})=> case insensitive
    lean()=> drop all attributes except for the string coparison
    */
    const salt=genSalt(process.env.SALT_NUM)// (1)
    const hashedPassword=hash(password,salt)
    //const hashedEmail=await bcrypt.hash(email,salt)
    const userObject=(!Array.isArray(roles)||!roles.length)//js's ifelse(): (conidtion)?<true then do1>:<false then do2>
        ?{"username":username,"email":email,"password":hashedPassword,"firstName":firstName,"lastName":lastName,"isActive":true}
        :{"username":username,"email":email,"password":hashedPassword,"firstName":firstName,"lastName":lastName,"role":roles,"isActive":true}
    if(await create(userObject))return res.status(201).json({message:`New user "${username}" created`})
    else return res.status(400).json({message:"Invalid user data"})
}//createNewUser

const updateUser=async(req,res)=>{
    const{id,username,roles,active,password}=req.body
    if(!id||!username||!Array.isArray(roles)||!roles.length||typeof active!=="boolean"||!password)
    return res.status(400).json({message:"You need to fill up the form properly"})
    const note=await clientFolder.findById(id).exec()
    if(!note) res.status(400).json({message:"(Warning) Staff member has no entry"})
    const foundUser=await Staff.findOne({username}).exec()
    const duplicate=await Staff.findOne({username}).collation({locate:"en",strength:2}).lean().exec()
    if(duplicate&&duplicate?._id.toString()!==id)return res.status(409).json({message:"Duplicated username"})

    foundUser.username=username
    foundUser.role=roles
    foundUser.active=active
    foundUser.password=hash(password,genSalt(process.env.SALT_NUM))
    res.status(200).json(`"${(await foundUser.save()).username}" updated`)
}//updateUser

const changeActivateUser=async()=>{
    const{username,email}=req.body
    if(!email||!username)return res.status(400).json({message:"Fill in the blanks"})
    const foundUser=await findOne({email:email}).exec()
    if(!foundUser)return res.status(400).json({message:"No users found"})
    if(username!=foundUser.username)return res.status(400).json({message:"Credential incorrect"})
    const legacy1=await clientFolder.findOne({staffId:foundUser._id}).lean().exec()
    const legacy2=await clientFolder.findOne({staffEntry:{"$elemMatch":{staffId:foundUser._id}}}).lean().exec()
    if(legacy1||legacy2)res.json({message:`(Warning) staff-${username} contributed to the client folder`})
    foundUser.active=!foundUser.active
    res.status(200).json(`"${(await foundUser.save()).username}" updated`)
}//changeActivateUser

const deleteUser=async(req,res)=>{
    const{username,email}=req.body
    if(!email)return res.status(400).json({message:"You need to put in an email"})
    const user=await findById(id).exec()
    if(!user)return res.status(400).json({message:"No users found"})
    if(email!=user.email)return res.status(400).json({message:"Credential incorrect"})
    const legacy1=await clientFolder.findOne({staffId:foundUser._id}).lean().exec()
    const legacy2=await clientFolder.findOne({staffEntry:{"$elemMatch":{staffId:foundUser._id}}}).lean().exec()
    if(legacy1||legacy2)return res.status(400).json({message:`(Error) Chill out! Staff-${username} contributed to the client folder`})
    const result=await user.deleteOne()
    res.status(200).json(`Deleted user-${result.username}, whose ID was ${result._id}`)
}//deleteUser

module.exports={getAllUsers,createNewUser,updateUser,changeActivateUser,deleteUser}
