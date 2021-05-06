const { static } = require('express')
const Post = require('../models/Posts')

exports.viewCreateScreen = function(req, res){
    res.render('create-post')
}

exports.createPost = function(req, res){
    let post = new Post(req.body, req.session.user._id)
    post.create().then(function(newID){
        req.flash("success", "Post created successfully")
        req.session.save(() => {
            res.redirect(`/post/${newID}`)
        })
    
    }).catch(function(errors){
        errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect('/create-post'))
    })
}

exports.seePost = async function(req, res){
    try{
        let post = await Post.findSingleById(req.params.id, req.visitorID)
        res.render('postsScreen', {post: post, title: post.title})
    }catch{
        res.render('404')
    }
}

exports.editPosts = async function(req, res) {
    try {
      let post = await Post.findSingleById(req.params.id, req.visitorID)
      if (post.isVisitorOwner) {
        res.render("edit-post", {post: post})
      } else {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/"))
      }
    } catch {
      res.render("404")
    }
  }


exports.saveEditedPosts = function(req, res){
    let post = new Post(req.body, req.visitorID, req.params.id)
    post.update().then((status) => {
        //Post was successfully updated in the db
        //or there were validation errors
        if(status == "success"){
            //post updated in db
            req.flash("success", "Post successfully updated")
            req.session.save(function(){
                res.redirect(`/post/${req.params.id}/edit`)
            })
            
        }else{
            post.errors.forEach(function(error){
                req.flash("errors", error)
                req.session.save(function(){
                    res.redirect(`/post/${req.params.id}/edit`)
                })
            })
        }
    }).catch(() => {
        //a post with the requested id does not exist
        //or if current user not the owner of the post
        req.flash("Sorry, You don't permission to edit this post")
        req.session.save(function(){
            res.redirect('/')
        })

    })
}

exports.deletePost = function(req, res){
    Post.deletePost(req.params.id, req.visitorID).then(() => {
        req.flash("success", "Post deleted successfully")
        req.session.save(() => {
            res.redirect(`/profile/${req.session.user.username}`)
        })
    }).catch(() => {
        req.flash("errors", "You do not have permission to perform this operation.")
        req.session.save(() => {
            res.render('/')
        })
    })
}

exports.search = function(req, res){
    Post.search(req.body.searchTerm).then(posts => {
        res.json(posts)
    }).catch(() => {
        res.json([])
    })
}

//api related functions

exports.apiCreate = function(req, res){
    let post = new Post(req.body, req.apiUser._id)
    post.create().then(function(newID){
        res.json("Post successfully created")
    }).catch(function(errors){
        res.json(errors)
    })
}

exports.apiDelete = function(req, res){
    Post.deletePost(req.params.id, req.apiUser._id).then(() => {
        res.json('Post deleted successfully.')
    }).catch(() => {
        res.json("Invalid request")
    })
}