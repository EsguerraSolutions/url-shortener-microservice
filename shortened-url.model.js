const mongoose = require('mongoose');

const shortenedUrlSchema = new mongoose.Schema({
    short_url : {
        type : Number,
        required : true
    },
    original_url : {
        type : String,
        required : true
    }
});

module.exports = mongoose.model('Shortened URLs', shortenedUrlSchema);