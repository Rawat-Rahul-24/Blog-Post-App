const postsCollection = require('../db').db().collection('posts')
const followsCollection = require('../db').db().collection('follows')
const objectID = require('mongodb').ObjectID
const User = require('./User')
const sanitizeHtml = require('sanitize-html')

let Post = function(data, userId, requestedPostID){
    this.data = data
    this.errors = []
    this.userId = userId
    this.requestedPostID = requestedPostID
}

Post.prototype.cleanUp = function(){
   if(typeof(this.data.title) != "string") { this.data.title="" }
   if(typeof(this.data.body) != "string") { this.data.body="" } 

   this.data = {
       title: sanitizeHtml(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
       body: sanitizeHtml(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
       author: objectID(this.userId),
       createdDate: new Date()
   }
}

Post.prototype.validate = function(){
    if(this.data.title == "") {this.errors.push("Title cannot be empty.")}
    if(this.data.body == "") {this.errors.push("Body cannot be empty.")}
}


Post.prototype.create = function(){
    
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()
        if(!this.errors.length){
            //save post into db
            postsCollection.insertOne(this.data).then((info) => {
                resolve(info.ops[0]._id)
            }).catch(() => {
                this.errors.push("Please try again later!")
                reject(this.errors)
            })
           
        }else{
            reject(this.errors)
        }
    })
}

Post.prototype.update = async function(visitorID){
    return new Promise(async (resolve, reject) => {
        try{
            let post = await Post.findSingleById(this.requestedPostID, this.userId)
            if(post.isVisitorOwner){
                //update the db
                let status = await this.updatePost()
                resolve(status)
            }else{
                reject()
            }
        }catch{
            reject()
        }
    })
}

Post.prototype.updatePost = function(){
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        this.validate()
        if(!this.errors.length){
            await postsCollection.findOneAndUpdate({_id: new objectID(this.requestedPostID)}, {$set: {title: this.data.title, body: this.data.body}})
            resolve("success")
        }else{
            resolve("failure")
        }
    })
}

Post.findById = function(operations, visitorID, finalOperations = []){
    return new Promise(async function(resolve, reject){
        let aggOps = operations.concat([
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDoc"}},
            {$project: {
                title: 1,
                body: 1,
                createdDate: 1,
                authorId: "$author",
                author: {$arrayElemAt: ["$authorDoc", 0]}
            }}
        ]).concat(finalOperations)
        let posts = await postsCollection.aggregate(aggOps).toArray()
        //clean up author in each post
        posts = posts.map(function(post){
            post.isVisitorOwner = post.authorId.equals(visitorID)
            post.authorId = undefined
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            return post
        })
        resolve(posts)
    })
}

Post.findSingleById = function(id, visitorID){
    return new Promise(async function(resolve, reject){
        if(typeof(id) != "string" || !objectID.isValid(id)) {
            reject()
            return
        }

       let post = await Post.findById([
           {$match: {_id: new objectID(id)}}
       ], visitorID)
        if(post.length){
            resolve(post[0])
        }else{
            reject()
        }
    })
}

Post.findByAuthorId = function(authorID){
    return Post.findById([
        {$match: {author: authorID}},
        {$sort: {createdDate: -1}}
    ])
}

Post.deletePost = function(postIDToDelete, currentUserID){
    return new Promise(async function(resolve, reject){
        try{
            let post = await Post.findSingleById(postIDToDelete, currentUserID)
            if(post.isVisitorOwner){
                await postsCollection.deleteOne({_id: new objectID(postIDToDelete)})
                resolve()
            }else{
                reject()
            }
        }catch{
            reject()
        }
    })
}

Post.search = function(searchTerm){
    return new Promise(async (resolve, reject) => {
        if(typeof(searchTerm) == "string"){
            let posts = await Post.findById([
                {$match: {$text: {$search: searchTerm}}}
            ], undefined, [{$sort: {score: {$meta: "textScore"}}}])
            resolve(posts)
        }else{
            reject()
        }
    })
}

Post.countPostsByAuthor = function(id){
    return new Promise(async (resolve, reject) => {
        let postCount = await postsCollection.countDocuments({author: id})
        resolve(postCount)
    })
}

Post.getFeed = async function(id){
    let followedUsers = await followsCollection.find({authorID: new objectID(id)}).toArray()
    followedUsers = followedUsers.map(function(followedUser){
        return followedUser.followedId
    })

    return Post.findById([
        {$match: {author: {$in: followedUsers}}},
        {$sort: {createdDate: -1}}
    ])
}

module.exports = Post