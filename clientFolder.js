/*
The schema for client folder should do the followings:
1) compartmentalize client's information- that of their own or their relatives,
2) format through getters all special characters except "-" in all customized schema types,
3) compartmentalize staff's entries,
4) only store concise tags, [String] < a schemaType- Map to throw error
5) prompt clients' self-affirmation of resources- be those somatic, psychosocial/ interpersonal, systemic/ legal
6) allow for ndarray,
7) save date as moment,
8) JS get parent,
9) DARN-ACT,
10) cycle of change,
11) follow up questions if there are signs of reactance- Stop, Drop, ,
12) enum of resolution must be one of the 3

NOTE 1: I dropped the schema for client activity as we can easily trace it by timeOfEntry
NOTE 2: Depending on what the 2nd floor find overly verbose or just adequately strength-based and solution-focused, 
we can embed prompts for some MI, somatic experiencing, traditional teaching and systemic intervention into our schemas
NOTE 3: For future reference, to customize a schema type: class newType extends mg.SchemaType{
    constructer(key,options){super(key,options,"newType")}
    cast(variable){return function(variable)}
}
    mg.Schema.Types.newType=newType
NOTE 4: TO-DO Whenever there is a "OUT OF OUR HAND (need referral)" in any [need]'s cycleOfChange, send notification!
        array.reduce((placeholder,str)=>placeholder+str.includes("HAND"),0)
*/
const mg=require("mongoose")

const validEmail=/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
const validPostal=/([A-Za-z]\d[A-Za-z]\S\d[A-Za-z]\d)|([A-Za-z]\d[A-Za-z]\d[A-Za-z]\d)|(\d{5}-\d{4})/
const validPhone=/\d{7}|\d{3}[\s-]\d{4}|\d{10}|(\+?1[\s-]){0,1}\d{3}[\s-]\d{3}[\s-]\d{4}|(\+?1[\s-]){0,1}\(\d{3}\)[\s-]{0,1}\d{3}[\s-]\d{4}/
function stripSpec(somthing){// embedded trim (2)
    return somthing.replace(/^ +| +$|[^\w^\s^/^.^,^'^-]*/g,"")
}

//First layer
const DARN=["Desire more","Ability to act","Reason not to stay the same","Need to try something new"]
const ACT=["Activating language (e.g. \"thinking about it\")","Committing to act","Taking steps"]
const DARNACT=DARN.concat(ACT)
//motive->asset+ need
const motive=new mg.Schema({//DARN-ACT (9)
    item:{type:String,required:[true,"Fill in the blanks"],get:stripSpec},
    changeTalk:{type:String,enum:DARNACT,required:[true,"Pick one"]},
    talkType:{type:String,get:function(){return DARN.includes(this.changeTalk)?"Preparatory":"Mobilizing"}}
})
//reaction->action
const reaction=new mg.Schema({// subDoc layer 0
    envisionedStep:{type:String,get:stripSpec},
    envisionedCatastrophe:[{type:String,get:stripSpec}],
    realityCheck:{type:Map,of:{type:Boolean,get:stripSpec},required:function(){
        return this.envisionedCatastrophe.length?[true,"(Required) How did you and your client review the basis of the fear?"]:
        [false,"You can skip it"]},
        validate:function(v){return [v.length==this.envisionedCatastrophe.length,
            "The list of Reality Check must have the same number of item as the list of Catatstrophes"]}
    },//subDoc!
    miracleQuestion:{type:Map,of:{type:String,get:stripSpec},required:function(){
        return this.envisionedCatastrophe.length?[true,"(Required) How did you and your client review the basis of the fear?"]:
        [false,"You can skip it"]},
        validate:function(v){return [v.length==this.envisionedCatastrophe.length,
            "The list of Miracle Questions must have the same number of item as the list of Catatstrophes"]}},//subDoc!
    gainTalk:{type:Map,of:{type:String,get:stripSpec},
        required:[true,"(Required) What did the client state they\'d stand to gain by trying to take the step?"]}
})
//resource->asset+need
const rt=["somatic/ self-counselling techniques (e.g., grounding, expressive art)","psychosocial/ interpersonal","financial","traditional teaching","systemic/ legal"]
const resource=new mg.Schema({
    resourceType:{type:String,enum:{values:rt,message:"You picked a resource type that we didn\'t expect. Please educate us."}}
})
//action->need+asset
const action=new mg.Schema({
    step:String,
    priority:Number,
    excitement:{type:Number,required:[true,"(Required) REACTANCE PREVENTION! How excited or comfortable was the client to talk about it?"],min:1,max:7},
    concreteness:{type:Number,required:[true,"(Required) REACTANCE PREVENTION! How genuiene and specific could the client talk about it?"],min:1,max:7},
    staffReposition:{type:Boolean,required:function(){// (11)
        return this.excitement<4&&this.concreteness<4?
        [true,"(Required) Did you take a step back and convey to the client that you\'re not pushing for a solution against their will?"]:
        [false,"You can skip it"]}},
    staffRestoreAllyship:{type:Boolean,required:function(){// (11)
        return this.excitement<4&&this.concreteness<4?
        [true,"(Required) Did you invite the client to accept your role as an ally?"]:
        [false,"You can skip it"]}},
    clientAutonomy:{type:Map,of:{type:String,get:stripSpec},required:function(){// (11) subDoc! NEED (8)
        return this.excitement<4&&this.concreteness<4?
        [true,"(Required) What asset/ resource did the client agree to lean on to restore their sense of control?"]:[false,"You can skip it"]}},
    sitWithSustainTalk:{type:Map,of:String,required:function(){// (11) subDoc! 
        return this.excitement<4&&this.concreteness<4?
        [true,"(Required) How did you reflect and, only then, reframe the client\'s sustain talk?"]:[false,"You can skip it"]}},
    clientGainTalk:{type:Map,of:reaction,required:function(){// (11) subDoc!
        return this.excitement<4&&this.concreteness<4?
        [true,"(Required) Please elaborate on how the client and you discussed how some piece(s) of the planned action may translate into outcomes they\'d like to see"]:
        [false,"You can skip it"]}},
    resolution:{type:Map,of:{type:String,enum:{values:["try it","scrap it","alter it (Please add another action item)"],message:"Must be one of the three"}},
        required:function(){// (11) subDoc!
            return this.excitement<4&&this.concreteness<4?
            [true,"(Required) What did the client and you decided to do with this action plan?"]:[false,"You can skip it"]}}
})
//meansOfContact->supportContact
const meansOfContact=new mg.Schema({
    role:{type:String,enum:["informal (caregiver, family or friends)","legal","EIA","CFS","CLDS","other agency or systemic support"],
        required:[true,"(Required) Select one"]},
    location:{type:String,required:function(){
        return this.role!="informal (caregiver, family or friends)"?[true,"(Required) Fill in the blanks"]:[false,"You can skip it"]}},
    email:{type:String,required:function(){
        return this.role!="informal (caregiver, family or friends)"?[true,"(Required) Fill in the blanks"]:[false,"You can skip it"]},
        match:[validEmail,"Fill in a valid email"]},
    phoneNum:{type:String,required:function(){
        return this.role!="informal (caregiver, family or friends)"?[true,"(Required) Fill in the blanks"]:[false,"You can skip it"]},
        trim:true,get:stripSpec,match:[validPhone,"Fill in a valid phone number"]}
})
//supportContact->asset+need
const supportContact=new mg.Schema({
    supportFirstName:{type:String,get:stripSpec},
    supportLastName:{type:String,get:stripSpec},
    contact:meansOfContact//subDoc!
})

//Second layer
const coc=["Pre-contemplate","Contemplate","Prepare","Act","Maintain","Relapse",
"Terminate (no more need for pointed intervention)","OUT OF OUR HAND (need referral)"]// (10)
//asset->entry
const asset=new mg.Schema({// (6)
    nature:{type:Map,of:resource,rquired:[true,"(Required) Under what aspect was the client\'s resource fall?"],//subDoc!
    validate:[function(val){return val.length<=rt.length},`"You might have selected duplicates as we have only ${rt.length} types"`]},
    item:{type:String,required:[true,"(Required) To what did the client state they could resort?"],get:stripSpec},
    reliability:{type:Number,required:[true,"(Required) How often did the client state they can tap into the resource?"],min:1,max:7},
    resourceContact:{type:Map,of:supportContact,required:function(){
        return this.nature!="somatic"&&this.nature!="traditional teaching"?
        [true,"(Required) Please elaborate how to get in touch with them"]:[false,"You can skip it"]
    }},
    wantOurSupport:{type:Boolean,required:[true,"(Required) Even you talking about it counts as \'yes\'"]},
    isAddressed:{type:Boolean,required:function(){
        return this.wantOurSupport?[true,"(Required) Did we do anything about it?"]:[false,"you can skip it"]
    }},
    declairedMotivation:{type:[motive],required:function(){//subDoc!
        return this.wantOurSupport?[true,"(Required) What did the client consider to be the reasons to work through the challenge?"]:
        [false,"you can skip it"]
    }},
    contractedActionPlan:{type:[action],required:function(){//subDoc!
        return this.wantOurSupport?[true,"(Required) What did your client and you agree to do?"]:[false,"you can skip it"]
    }},
    cycleOfChange:{type:String,enum:coc,required:[true,"(Required) Specific to leaning on this asset, how would you position the client in the cycle of change?"],
    default:function(){
        return this.wantOurSupport?this.reliability<4?this.isAddressed?"Act":"Prepare":
                                            this.isAddressed?"Contemplate":this.reliability<6?"Maintain":"Terminate (no more need for pointed intervention)":
                                        this.reliability<2?"Pre-contemplate":"Maintain"
    }}
})
//need->entry
const need=new mg.Schema({// (6)
    nature:{type:[resource],required:[true,"(Required) Under what aspect was the client\'s need fall?"],// subDoc!
        validate:[function(val){return val.length<=rt.length},`"You might have selected duplicates as we have only ${rt.length} types"`]},
    item:{type:String,required:[true,"(Required) What did the client state they needed?"],get:stripSpec},
    urgency:{type:Number,required:[true,"(Required) How pressing did the client state the need was?"],min:1,max:7},
    wantOurIntervention:{type:Boolean,required:[true,"(Required) Even you talking about it counts as \'yes\'"]},
    isAddressed:{type:Boolean,required:function(){
        return this.wantOurIntervention?[true,"(Required) Did we do anything about it?"]:[false,"you can skip it"]
    }},
    declairedMotivation:{type:[motive],required:function(){//subDoc!
        return this.wantOurIntervention?[true,"(Required) What did the client consider to be the reasons to work through the challenge?"]:
        [false,"you can skip it"]
    }},
    contractedActionPlan:{type:[action],required:function(){//subDoc!
        return this.wantOurIntervention?[true,"(Required) What did your client and you agree to do?"]:[false,"you can skip it"]
    }},
    cycleOfChange:{type:String,enum:coc,required:[true,"(Required) Specific to overcoming this need, how would you position the client in the cycle of change?"],
    default:function(){
        return this.wantOurIntervention?this.urgency>3?this.isAddressed?"Act":"Prepare":
                                            this.isAddressed?"Contemplate":this.urgency>2?"Maintain":"Terminate (no more need for pointed intervention)":
                                        this.urgency>5?"OUT OF OUR HAND (need referral)":this.urgency>3?"Pre-contemplate":"Maintain"
    }}
})

//Third layer
const entry=new mg.Schema(//subschema aka subDocument (3)
    {
        staffInterventionAbstract:[{type:String,required:[true,"(Required) In brief, what did you do? [elaborate later]"],get:stripSpec}],//subDoc!
        isInteractive:Boolean,
        clientResource:{type:Map,of:asset,required:[true,"(Required) Elaborate how you and your client built their capacity"]},//subDoc!
        clientFeltNeed:{type:Map,of:need,required:[true,"(Required) Elaborate how you and your client addressed the challenges they faced"]},//subDoc!
        callsForUrgentReferral:{type:Number,default:0,get:()=>this.clientResource.cycleOfChange.reduce((placeHolder,str)=>placeHolder+str.includes("OUT OF HAND"),0)},
        clientObservableResponse:{type:Map,of:{type:String,get:stripSpec},required:function(){// subDoc!
            return this.isInteractive?[true,"(Required) How did the client receive?"]:[false,"You can skip it"]
        }},
        clientWellness:{type:Number,required:function(){
            return this.isInteractive?[true,"(Required) How did they feel/ how do you infer they feel- 1(worst) to 7(best)?"]:[false,"You can skip it"]
        },min:1,max:7},
        staffReflection:{type:Map,of:{type:String,get:stripSpec},required:[false,"(Optional) How are you feeling?"]},// (4) subDoc!
        //data entry
        staffId:{type:mg.Schema.Types.ObjectId,ref:"staffSchema"},
        timeOfEntry:{type:Date,get:()=>Date.now()}//save dates (without time) regularly- as ISODate
    },
    {timestamps:true}
)

const phia=new mg.Schema({// (1)
    relationToClient:String,
    firstName:{type:String,required:[true,"(Required) Fill in the blanks"],trim:true,get:stripSpec},
    lastName:{type:String,required:[true,"(Required) Fill in the blanks"],trim:true,get:stripSpec},
    canContact:{type:String,required:[true,"(Required) Type \"yes\", \"no\" or \"only if neccessary\""],enum:["yes","no","only if neccessary"]},
    emergencyContact:{type:Boolean,required:function(){return this.canContact!="no"}},
    address:{type:String,required:[false,"(Optional) It is ok if you don\'t know or don't have one"]},
    postal:{type:String,required:function(){return this.address? true:[false,"You can skip it"]},validate:[validPostal,"Fill in a postal/ zip code"]},
    email:{type:String,required:[false,"(Optional) It is ok if you don't know or don\'t have one"],match:[validEmail,"Fill in a valid email"]},
    phoneNum:{type:String,required:[false,"(Optional) It is ok if you don't know or don\'t have one"],trim:true,get:stripSpec,
        match:[validPhone,"Fill in a valid phone number"]},
    dateOfBirth:Date,// NEED (7)!
    //CFS involvement
    everInvolvedWithCFS:{type:Boolean,default:false},
    currentlyWithCFS:{type:Boolean,required:function(){return this.everInvolvedWithCFS},
    default:function(){return dateOfPhiaEntry-this.dateOfBirth>18*(1461/4*24*60*60*1000)&&this.everInvolvedWithCFS}},//Date.now()-new Date("yyyy-mm-dd")
    placementSatisfaction:{type:Number,min:1,max:7,
        required:function(){return this.currentlyWithCFS?
            [true,"(Required) How did the client state they felt about the current arrangement?"]:[false,"You can skip it"]}},
    upcomingReunification:{type:Boolean,required:function(){return this.currentlyWithCFS},default:function(){return this.placementSatisfaction<4}},
    projectedReunificationDate:{type:Date,required:function(){return this.upcomingReunification}},
    //data entry
    staffId:{type:mg.Schema.Types.ObjectId,ref:"staffSchema"},
    dateOfPhiaEntry:{type:Date,get:()=>Date.now()},// Date.now is a function

})

//Main layer
const clientFolder=new mg.Schema({
    clientPhia:[phia],
    staffEntry:[entry],
    //data entry
    clientID:mg.Schema.Types.ObjectId,
    dateOfFolderCreation:Date//WILL PASS THROUGH MOMENT/ MONGOOSE-MOMENT  NEED (7)!
})

module.exports=mg.model("clientFolder",clientFolder)
