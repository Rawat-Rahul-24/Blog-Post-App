const express = require('express')
const router = express.Router()
const userController = require('./controllers/usercontroller')
const postController = require('./controllers/postcontroller')
const followController = require('./controllers/followcontroller')

//register and login
router.get('/', userController.home)
router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/logout', userController.logout)
router.post('/doesUsernameExist', userController.doesUsernameExist)
router.post('/doesEmailExist', userController.doesEmailExist)

//posts
router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen)
router.post('/create-post', userController.mustBeLoggedIn, postController.createPost)
router.get('/post/:id', postController.seePost)
router.get('/404')
router.get('/post/:id/edit', userController.mustBeLoggedIn, postController.editPosts)
router.post('/post/:id/edit', userController.mustBeLoggedIn, postController.saveEditedPosts)
router.post('/post/:id/delete', userController.mustBeLoggedIn, postController.deletePost)
router.post('/search', postController.search)

//profiles
router.get('/profile/:username', userController.ifUserExists, userController.sharedProfileData, userController.seeProfile)
router.get('/profile/:username/followers', userController.ifUserExists, userController.sharedProfileData, userController.profileFollowersScreen)
router.get('/profile/:username/following', userController.ifUserExists, userController.sharedProfileData, userController.profileFollowingScreen)


//follow
router.post('/addFollow/:username', userController.mustBeLoggedIn, followController.addFollow)
router.post('/removeFollow/:username', userController.mustBeLoggedIn, followController.removeFollow)




module.exports = router