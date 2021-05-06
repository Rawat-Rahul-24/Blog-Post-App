const User = require('../models/User')
const Post = require('../models/Posts')
const Follow = require('../models/Follow')
const jwt = require('jsonwebtoken')

exports.doesUsernameExist = function(req, res){
    User.findByUsername(req.body.username).then(function(){
        res.json(true)
    }).catch(function(){
        res.json(false)
    })
}

exports.doesEmailExist = async function(req, res){
  let emailBool = await  User.doesEmailExist(req.body.email)
  res.json(emailBool)
}

exports.home = async function(req, res){
    if(req.session.user){
        //fetch feed of posts for current user
        let posts = await Post.getFeed(req.session.user._id)
        res.render("home-dashboard", {posts: posts})
    }else{
        res.render('home-guest', {regErrors: req.flash('regErrors')})
    }
    
}

exports.login = function(req, res){
    let user = new User(req.body)
    user.login().then(function(result){
        req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
        req.session.save(function() {
            res.redirect('/')
        })
    }).catch(function(error){
        req.flash('errors', error)
        req.session.save(function(){
            res.redirect('/')
        })
    })
}

exports.register = async function(req, res){
    let user = new User(req.body)
   user.register().then(() => {
        req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
        req.session.save(function(){
            res.redirect('/')
        })
   }).catch((regErrors) => {
    regErrors.forEach(function(message){
        req.flash('regErrors', message)
    })
    req.session.save(function(){
        res.redirect('/')
    })
   })
    
}

exports.logout = function(req, res){
    req.session.destroy(function(){
        res.redirect('/')
    })
 }

 exports.mustBeLoggedIn = function(req, res, next){
     if(req.session.user){
        next()
     }else{
         req.flash('errors', 'You must be logged in if you want to create posts.')
         req.session.save(function(){
            res.redirect('/')
         })
        
     }
 }

 exports.ifUserExists = function(req, res, next){
    User.findByUsername(req.params.username).then(function(userDoc){
        req.profileUser = userDoc
        next()
    }).catch(function(){
        res.render('404')
    })
 }

 exports.seeProfile = function(req, res){
    Post.findByAuthorId(req.profileUser._id).then(function(posts){
        res.render('profile', {
            title: `${req.profileUser.username}'s Profile`,
            currentPage: "posts",
            posts: posts,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing:  req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    }).catch(function(){
        res.render('404')
    })
 }

exports.sharedProfileData = async function(req, res, next){
    let isVisitorsProfile = false
    let isFollowing = false
    if(req.session.user){
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorID)
    }
    req.isVisitorsProfile = isVisitorsProfile
    req.isFollowing = isFollowing
    //retrieve counts for posts, follower and following
    let postCountPromise =  Post.countPostsByAuthor(req.profileUser._id)
    let followerCountPromise =  Follow.countFollowerById(req.profileUser._id)
    let followingCountPromise =  Follow.countFollowingById(req.profileUser._id)
   let [postCount, followerCount, followingCount] =  await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])
   req. postCount = postCount
   req.followerCount = followerCount
   req.followingCount = followingCount
   next()
}

exports.profileFollowersScreen = async function(req, res) {
    try{
        let followers = await Follow.getFollowersByID(req.profileUser._id)
    res.render('profile-followers', {
        currentPage: "follower",
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isFollowing:  req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        followers: followers,
        counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })
    }catch{
        res.render('404')
    }
}

exports.profileFollowingScreen = async function(req, res){
    try{
        let following = await Follow.getFollowingByID(req.profileUser._id)
    res.render('profile-following', {
        currentPage: "following",
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isFollowing:  req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        following: following,
        counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })
    }catch{
        res.render('404')
    }
}

//api related functions

exports.apiLogin = function(req, res){
    let user = new User(req.body)
    user.login().then(function(result){
        res.json(jwt.sign({_id: user.data._id}, process.env.JWTSECRET, {expiresIn: '1d'}))

    }).catch(function(error){
        res.json("Incorrect credentials")
    })

}

exports.apiMustBeLoggedIn = function(req, res, next){
    try{
        req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET)
        next()
    }catch{
        res.json("Invalid token")
    }
}

exports.apiGetPostsbyUsername = async function(req, res){
    try{
        let authorDoc = await User.findByUsername(req.params.username)
        let posts = await Post.findByAuthorId(authorDoc._id)
        res.json(posts)
    }catch{
        res.json("Invalid username")
    }
}