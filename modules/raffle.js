const random_name = require('node-random-name');
const TwoCaptcha = require('./2captcha');
const CAPTCHA_KEY = '86f7e2f2cfb26bc385bf94efbc4490f7'

class Raffle {
    constructor(url, catchAll, proxy, id) {
        this.url = url
        this.catchAll = catchAll
        this.proxy = proxy
        this.id = id
        this.solver = new TwoCaptcha(CAPTCHA_KEY)
        this.log = function(...args) {
            console.log(`[${id}]`, ...args)
        }
    }

    getApt(num = 3) {
        var characters= 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        var aptBld =  characters.charAt(Math.floor(Math.random() * characters.length))
        var aptNum = Math.floor(Math.random() * ((Math.pow(10, num) - 1) - Math.pow(10, num - 1) + 1) + Math.pow(10, num - 1));
        return `${aptBld}${aptNum}`
    }

    getRandom(array) {
        return array[Math.floor(Math.random() * array.length)]
    }

    getRandomString() {
        return Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);
    }

    getRandomFirstName() {
        return random_name({ first: true })
    }

    getRandomLastName() {
        return random_name({ last: true })
    }

}

module.exports = Raffle