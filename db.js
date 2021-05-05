const mongodb = require('mongodb')
const dotenv = require('dotenv')
dotenv.config()

mongodb.connect(process.env.URI, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client){
    module.exports = client
    console.log("Connected to db")
    const app = require('./app')
    app.listen(process.env.PORT)
})