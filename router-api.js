const apiRouter = require('express').Router()
const userController = require('./controllers/usercontroller')
const postController = require('./controllers/postcontroller')
const cor = require('cors')

apiRouter.use(cor)

apiRouter.post('/login', userController.apiLogin)
apiRouter.post('/create-post', userController.apiMustBeLoggedIn, postController.apiCreate)
apiRouter.delete('/post/:id', userController.apiMustBeLoggedIn, postController.apiDelete)
apiRouter.get('/postByAuthor/:username', userController.apiGetPostsbyUsername)

module.exports = apiRouter