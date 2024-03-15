/*
The schema for client folder should do the followings:
1) compartmentalize client's information- that of their own or their relatives,
2) format through getters all special characters except "-" in all customized schema types,
3) compartmentalize staff's entries,
4) only store concise tags, [String] < a schemaType- map to throw error
5) allow for ndarray.
NOTE: I dropped the schema for client activity as we can easily trace it by timeOfEntry
*/
const mg=require("mongoose")
const moment=require("moment").moment
const validEmail=/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
const validPostal=/([A-Za-z]\d[A-Za-z]\S\d[A-Za-z]\d)|([A-Za-z]\d[A-Za-z]\d[A-Za-z]\d)|(\d{5}-\d{4})/
function stripSpec(somthing){// (2)
    return somthing.replace(/[\W\S^/^.^,^'^-]*/g,"")
}

class justDate extends mg.SchemaType{
    constructor(key,options){super(key,options,"justDate")}
    cast(date){return moment(date).format("YYYYMMDD")}
}
mg.Schema.Types.justDate=justDate

const need=new mg.Schema({//subDocument first layer (5)
    item:{type:String,required:[true,"(Required) What did the client state they need?"],get:stripSpec},
    urgency:{type:Number,required:[true,"(Required) How pressing did the client state the need was?"],min:1,max:10},
    isAddressed:Boolean
})

const entry=new mg.Schema(//subschema aka subDocument second layer (3)
    {
        nature:{type:String,required:[true,"nature of entry"],index:true},
        staffIntervention:[String],
        isInteractive:Boolean,
        clientFeltNeed:[need],
        clientObservableResponse:{type:map,of:String,required:function(){
            return this.isInteractive?[true,"(Required) How did the client receive?"]:[false,"You can skip it"]
        }},
        clientWellness:{type:Number,required:function(){
            return this.isInteractive?[true,"(Required) How did they feel/ how do you infer they feel- 1(worst) to 10(best)?"]:[false,"You can skip it"]
        },min:1,max:10},
        staffReflection:{type:map,of:String,required:[false,"(Optional) How are you feeling?"]},// (4)
        staffId:{type:schema.Types.ObjectId,ref:"staffSchema"},
        timeOfEntry:{type:Date,default:Date.now}//save dates (without time) regularly- as ISODate
    },
    {timestamps:true}
)

const phia=new mg.Schema({//subDocument second layer (1)
    relationToClient:String,
    firstName:{type:String,required:[true,"(Required) Fill in the blanks"],trim:true,get:stripSpec},
    lastName:{type:String,required:[true,"(Required) Fill in the blanks"],trim:true,get:stripSpec},
    canContact:{type:String,required:[true,"(Required) Type \"yes\", \"no\" or \"only if neccessary\""],enum:["yes","no","only if neccessary"]},
    emergencyContact:{type:Boolean,required:function(){return this.canContact!="no"?false:true}},
    address:{type:String,required:[false,"(Optional) It is ok if you don\'t know or don't have one"]},
    postal:{type:String,required:function(){return this.address? true:[false,"You can skip it"]},validate:[validPostal,"Fill in a postal/ zip code"]},
    email:{type:String,required:[false,"(Optional) It is ok if you don't know or don\'t have one"],match:[validEmail,"Fill in a valid email"]},
    phoneNum:{type:String,required:[false,"(Optional) It is ok if you don't know or don\'t have one"],trim:true,get:stripSpec},
    asset:{type:[String],get:stripSpec},
    need:{type:[need],required:function(){return this.canContact=="yes"?[true,"(Required)"]:[false,"You can skip it"]},get:stripSpec}
})

const clientFolder=new mg.Schema({
    clientID:schema.Types.ObjectId,
    clientPhia:[phia],
    staffEntry:[entry],
    dateOfFolderCreation:{type:justDate,default:moment(Date.now).format("YYYYMMDD")}//! Do I need mongoose-moment?
})

module.exports=mg.model("clientFolder",clientFolder)