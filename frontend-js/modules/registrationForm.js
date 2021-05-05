import axios from 'axios'

export default class RegistrationForm{
    constructor(){
        this._csrf = document.querySelector('[name = "_csrf"]').value
        this.form = document.querySelector('#registration-form')
        this.allFields = document.querySelectorAll('#registration-form .form-control')
        this.insertValidationElements()
        this.username = document.querySelector("#username-register")
        this.username.previousvalue = ""
        this.email = document.querySelector("#email-register")
        this.email.previousvalue = ""
        this.password = document.querySelector("#password-register")
        this.password.previousvalue = ""
        this.username.isUnique = false
        this.email.isUnique = false
        this.events()
    }

    //events
    events(){
        this.form.addEventListener("submit", (e) => {
            e.preventDefault()
            this.formSubmitHandler()
        })
        this.username.addEventListener("keyup", () => {
            this.isDifferent(this.username, this.usernameHandler)
        })
        this.email.addEventListener("keyup", () => {
            this.isDifferent(this.email, this.emailHandler)
        })
        this.password.addEventListener("keyup", () => {
            this.isDifferent(this.password, this.passwordHandler)
        })

        this.username.addEventListener("blur", () => {
            this.isDifferent(this.username, this.usernameHandler)
        })
        this.email.addEventListener("blur", () => {
            this.isDifferent(this.email, this.emailHandler)
        })
        this.password.addEventListener("blur", () => {
            this.isDifferent(this.password, this.passwordHandler)
        })
    }

    //methods
    formSubmitHandler(){
        this.usernameImmediate()
        this.usernameDelay()
        this.emailDelay()
        this.passwordImmediate()
        this.passwordDelay()

        if(this.username.isUnique && this.email.isUnique && !this.username.errors && !this.email.errors && !this.password.errors){
            this.form.submit()
        }
    }

    isDifferent(ele, handler){
        if(ele.previousvalue != ele.value){
            handler.call(this)
        }
        ele.previousvalue = ele.value
    }

    usernameHandler(){
        this.username.errors = false
        this.usernameImmediate()
        clearTimeout(this.username.timer)
        this.username.timer = setTimeout(() => this.usernameDelay(), 800)
    }

    usernameImmediate(){
        if(this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value)){
            this.showValidationError(this.username, "Username can only contain letters and numbers.")
        }
        if(this.username.value.length > 30){
            this.showValidationError(this.username, "Username cannot exceed 30 characters.")
        }
        if(!this.username.errors){
            this.hideValidationError(this.username)
        }
    }

    usernameDelay(){
     if(this.username.value.length<3) {
         this.showValidationError(this.username, "Username must be atleast 3 characters")
     } 
     
     if(!this.username.errors){
        this.hideValidationError(this.username)
        axios.post('/doesUsernameExist', {_csrf: this._csrf, username: this.username.value}).then((response) => {
            if(response.data){
                this.showValidationError(this.username, "Username is already taken.")
                this.username.isUnique = false
            }else{
                this.username.isUnique = true
            }
        }).catch(() => {
            console.log("Try later")
        })
     }
    }

    emailHandler(){
        this.email.errors = false
        //this.usernameImmediate()
        clearTimeout(this.email.timer)
        this.email.timer = setTimeout(() => this.emailDelay(), 800)
    }

    emailDelay(){
        if(!/^\S+@\S+.\S$/.test(this.email.value)){
            this.showValidationError(this.email, "Invalid email.")
        }

        if(!this.email.errors){
            this.hideValidationError(this.email)
            axios.post('/doesEmailExist', {_csrf: this._csrf, email: this.email.value}).then((response) => {
                if(response.data){
                    this.showValidationError(this.email, "Email already associated with another account.")
                    this.email.isUnique = false
                }else{
                    this.email.isUnique = true
                    this.hideValidationError(this.email)
                }
            }).catch(() => {
                console.log("Try again later")
            })
        }
    }

    passwordHandler(){
        this.password.errors = false
        this.passwordImmediate()
        clearTimeout(this.password.timer)
        this.password.timer = setTimeout(() => this.passwordDelay(), 800)
    }

    passwordImmediate(){
        if(this.password.value.length > 50){
            this.showValidationError(this.password, "Password cannot exceed 50 characters.")
        }

        if(!this.password.errors){
            this.hideValidationError(this.password)
        }
    }

    passwordDelay(){
        if(this.password.value.length<12){
            this.showValidationError(this.password, "Password must be atleast 12 characters.")
        }

        if(!this.password.errors){
            this.hideValidationError(this.password)
        }
    }

    showValidationError(el, message){
        el.nextElementSibling.innerHTML = message
        el.nextElementSibling.classList.add("liveValidateMessage--visible")
        el.errors = true
    }

    hideValidationError(el){
        el.nextElementSibling.classList.remove("liveValidateMessage--visible")
    }

    insertValidationElements(){
        this.allFields.forEach(function(ele){
            ele.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>')
        })
    }

}