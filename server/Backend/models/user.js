import mongoose from 'mongoose'

const user=mongoose.Schema({
    displayname:{
        type:String,
        minlength:1,
        required:true,
        trim:true
    },
    username:{
        type:String,
        minlength:1,
        required:true,
        trim:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        minlength:8,
        trim:true,//Removes leading/trailing whitespace automatically before saving.
    },
    points: {
        type: Number,
        default: 0
    },
    sub_name: {
        type: String,
        default: 'Rookie'
    },
    email:{
        type:String,
        minlength:1,
        required:true,
        trim:true,
        unique:true
    },
    sessiontoken:{
        type:Boolean,
        default:false
    },
    total_matches: {
        type: [String], // or Number if just a count
        default: []
    }
})
// const User = mongoose.model('User', userSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//App eik user model bana rhay hou using the schema provided so u can create,find,update,delete users from the database.
// 1. mongoose.model(...)
// This is a Mongoose function that creates a model (think of it like a template or tool to interact with a MongoDB collection).

// 2. 'User'
// This is the name of the model.
// Mongoose automatically turns this into the collection name in MongoDB:

// 'User' → turns into → 'users' (lowercase + plural)

// So it connects to the users collection in MongoDB.

// 3. userSchema
// This is the rules/structure you created earlier using new mongoose.Schema(...).
// It defines what a user looks like

export default user;