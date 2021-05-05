const usersCollection = require('../db').db().collection("users")
const followsCollection = require('../db').db().collection("follows")
const User = require('./User')
const objectID = require('mongodb').ObjectID

let Follow = function(followedUsername, authorID) {
    this.followedUsername = followedUsername
    this.authorID = authorID
    this.errors = []
}

Follow.prototype.cleanup = function(){
    if(typeof(this.followedUsername) != "string"){ this.followedUsername = ""}
}

Follow.prototype.validate = async function(operation) {
    // followedUsername must exist in database
    let followedAccount = await usersCollection.findOne({username: this.followedUsername})
    if (followedAccount) {
      this.followedId = followedAccount._id
    } else {
      this.errors.push("You cannot follow a user that does not exist.")
    }
    let doesFollowAlreadyExist = await followsCollection.findOne({followedId: this.followedId, authorID: new objectID(this.authorID)})
    if(operation == "create"){
        if(doesFollowAlreadyExist){this.errors.push("You are already following this user.")}
    }
    if(operation == "delete"){
        if(!doesFollowAlreadyExist){this.errors.push("You cannot stop following someone you do not follow.")}
    }

    //should not be avle to follow yourself
    if(this.followedId.equals(this.authorID)) { this.errors.push("You cannot follow yourself.")}
  }

Follow.prototype.create = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanup()
        await this.validate("create")
        if(!this.errors.length){
            await followsCollection.insertOne({followedId: this.followedId, authorID: new objectID(this.authorID)})
            resolve()
        }else{
            reject(this.errors)
        }
    })
}

Follow.prototype.delete = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanup()
        await this.validate("delete")
        if(!this.errors.length){
            await followsCollection.deleteOne({followedId: this.followedId, authorID: new objectID(this.authorID)})
            resolve()
        }else{
            reject(this.errors)
        }
    })
}

Follow.isVisitorFollowing = async function(followedId, visitorID){
    let followDoc = await followsCollection.findOne({followedId: followedId, authorID: new objectID(visitorID)})
    if(followDoc){
        return true
    }else{
        return false
    }
}

Follow.getFollowersByID = function(id) {
    return new Promise(async (resolve, reject) => {
        try{
            let followers = await followsCollection.aggregate([
                {$match: {followedId: id}},
                {$lookup: {from: "users", localField: "authorID", foreignField: "_id", as: "userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()
            followers = followers.map(function(follower){
                //create a user
                let user = new User(follower, true)
                return {username: follower.username, avatar: user.avatar}
            })
            resolve(followers)
        }catch{
            reject()
        }
    })
}

Follow.getFollowingByID = function(id) {
    return new Promise(async (resolve, reject) => {
        try{
            let following = await followsCollection.aggregate([
                {$match: {authorID: id}},
                {$lookup: {from: "users", localField: "followedId", foreignField: "_id", as: "userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()
            following = following.map(function(follower){
                //create a user
                let user = new User(follower, true)
                return {username: follower.username, avatar: user.avatar}
            })
            resolve(following)
        }catch{
            reject()
        }
    })
}

Follow.countFollowerById = function(id){
    return new Promise(async (resolve, reject) => {
        let followerCount = await followsCollection.countDocuments({followedId: id})
        resolve(followerCount)
    })
}

Follow.countFollowingById = function(id){
    return new Promise(async (resolve, reject) => {
        let followingCount = await followsCollection.countDocuments({authorID: id})
        resolve(followingCount)
    })
}


module.exports = Follow