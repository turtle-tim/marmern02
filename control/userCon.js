/*
CRUD staff credential as admin
1) use getSalt w/ hash
    getAllUsers,
    createNewUser,
    updateUser,
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
    const duplicate=await Staff.findOne({username}).collation({locate:"en",strength:2}).lean().exec()
    if(duplicate&&duplicate?._id.toString()!==id)return res.status(409).json({message:"Duplicated username"})

    Staff.username=username
    Staff.role=roles
    Staff.active=active
    Staff.password=hash(password,genSalt(process.env.SALT_NUM))
    res.status(200).json(`"${(await Staff.save()).username}" updated`)
}//updateUser

const deleteUser=async(req,res)=>{
    const{id,username}=req.body
    if(!id)return res.status(400).json({message:"You need to put in an ID"})
    const user=await findById(id).exec()
    if(!user)return res.status(400).json({message:"No users found"})
    if(await clientFolder.findOne({user:id}).lean().exec())
        return res.status(400).json({message:`User-${username}, still has some note(s). Chill the f out`})
    const result=await user.deleteOne()
    res.status(200).json(`Deleted user-${result.username}, whose ID was ${result._id}`)
}//deleteUser

module.exports={getAllUsers,createNewUser,updateUser,deleteUser}