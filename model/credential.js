/*
1) use staff's roles and activity to determine access privileges- i.e., 
    analyst, communication, security can read;
    support staff can read, create; 
    frontline can read, create, update; 
    admin/ management DELETE+cru;
    but anyone inactive has none
NOTE 1: select:false => not accessible by default; SAFETY!
NOTE 2: array 1=["a","b"], array 1.some(<condition>)-> <condition> is true for some element in array 1
NOTE 3: array 2.includes(<element>)-> <element> is in array 2
*/
const mg=require("mongoose")

const Read=["analyst","communication","security"]
const Create=["admin assist","reception","scaabe","intake"]
const Update=["intervention (e.g., Kiipewii\' Chego, Grandparent, Mentor, ROP Scaabe)"]
const Delete=["manager","admin","executive coordinator","director"]
const jobTitle=Read.concat(Create,Update,Delete)
const staff=new mg.Schema({
    //auth
    username:{type:String,required:[true,"(Required) Fill in the blanks"]},
    email:{type:String,required:[true,"(Required) Fill in the blanks"],select:false},
    password:{type:String,required:[true,"(Required) Fill in the blanks"],select:false},//WILL ENCODE!
    //info
    firstName:{type:String,required:[true,"(Required) Fill in the blanks"]},
    lastName:{type:String,required:[true,"(Required) Fill in the blanks"]},
    //privilege
    role:{type:Map,of:{type:String,enum:jobTitle},default:[Update[0]]},
    isActive:{type:Boolean,default:true},
    privilege:{type:Map,of:{type:String,enum:["canRead","canCreate","canUpdate","canDelete"]},default:[],
        get:function(rs=this.staffRole,a=this.isActive){
            if(!a)return [];
            cR=rs.some(r=>Read.includes(r))?["canRead"]:[];
            cC=cs.some(c=>Create.includes(c))?["canWrite"]:[];
            cU=us.some(u=>Update.includes(u))?["canUpdate"]:[];
            cD=ds.some(d=>Delete.includes(d))?["canDelete"]:[];
            return cR.concat(cC,cU,cD)
        }
    },
    //reset Password
    //resetLink:{data:String,default:""}
},{timestamps:true})

module.exports=mg.model("Staff",staff)