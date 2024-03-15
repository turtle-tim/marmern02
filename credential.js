const mg=require("mongoose")

const staff=new mg.Schema({
    staffFirstName:String,
    staffLastName:String,
    staffPassword:String,//WILL ENCODE!
    staffRole:{type:[String],default:["advocate"]},
    isActive:{type:Boolean,default:true}
})

module.exports=mg.model("staffSchema",staff)