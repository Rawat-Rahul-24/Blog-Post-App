const express = require('express')
const app = express()
const session = require('express-session')
const MongoStore = require('connect-mongo')
const flash = require('connect-flash')
const markdown = require('marked')
const sanitizeHtml = require('sanitize-html')
const csrf = require('csurf')



var sessionOptions = session({
    secret: "Our app is running",
    resave: false,
    store: MongoStore.create({client: require('./db')}),
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})

const router = require('./router.js')

app.use(sessionOptions)
app.use(flash())
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(express.static('public'))
app.set('views', 'views')
app.set('view engine', 'ejs')

app.use(function(req, res, next){
    //make markdown available for all templates
    res.locals.filterHtml = function(content){
        return sanitizeHtml(markdown(content), {allowedTags: ['p', 'br', 'ul', 'li', 'ol', 'strong', 'h1', 'bold'], allowedAttributes: {}})
    }
    //make all error and success falsh messages available to all templated
    res.locals.errors = req.flash("errors")
    res.locals.success = req.flash("success")
    //make current user id available in the request
    if(req.session.user) {
        req.visitorID = req.session.user._id
    }else{
        req.visitorID = 0
    }
    //user session data
    res.locals.user = req.session.user
    next()
})

app.use(csrf())

app.use(function(req, res, next){
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use('/', router)
app.use(function(err, req, res, next){
    if(err){
        if(err.code = "EBADCSRFTOKEN"){
            req.flash('errors', "Cross Site Request Forgery detected")
            req.session.save(() => res.redirect('/'))
        }else{
            res.render('404')
        }
    }
})

const server = require('http').createServer(app)

const io = require('socket.io')(server)
io.use(function(socket, next){
    sessionOptions(socket.request, socket.request.res, next)
})

io.on('connection', function(socket){
    if(socket.request.session.user){
        let user = socket.request.session.user

        socket.emit('welcome', {username: user.username, avatar: user.avatar})

        socket.on('chatMessageFromBrowser', function(data){
            socket.broadcast.emit('chatMessageFromServer', {message: sanitizeHtml(data.message, {allowedTags: [], allowedAttributes: []}), username: user.username, avatar: user.avatar})
        })
    }
})

module.exports = server