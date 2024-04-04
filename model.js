const mongoose = require('mongoose');


const Schema = mongoose.Schema;
const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    }, email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    cognitoSub: {
        type: String,
        required: true
    },
    createdAt: { type: Date, default: Date.now },
    mobileNumber: {
        type: String,
        required: true,
    },
    fileUpload: {
        type: String,
        required: true,
    }, // Assuming storing file path 
    emailVerified: Boolean,
    mobileVerified: Boolean,
    mobileOTP: {
        type: String,
    }
});


const userModel = mongoose.model('Teks', UserSchema);

module.exports = { userModel };
// module.exports = mongoose.model('User', UserSchema);