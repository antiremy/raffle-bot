const fetch = require('node-fetch')

const postUrl = 'http://2captcha.com/in.php';

const getUrl = 'http://2captcha.com/res.php';

class TwoCaptcha {
    constructor(api_key) {
        this.api_key = api_key
    }

    async submitCaptcha(sitekey, url) {
        var res = await fetch(`${postUrl}?key=${this.api_key}&method=userrecaptcha&googlekey=${sitekey}&pageurl=${url}&json=1`)
        var data = await res.json()
        if (data.status == 1) {
            console.log('Captcha submitted, waiting for response')
            await sleep(15000)
            return this.checkCaptcha(data.request)
        }
        else {
            
            if (data.request == 'ERROR_NO_SLOT_AVAILABLE') {
                await sleep(5000)
                return this.submitCaptcha(sitekey, url)
            }
            else {
                console.log('Error submitting captcha', data)
            }
        }


    }

    async checkCaptcha(id) {
        var res = await fetch(`${getUrl}?key=${this.api_key}&action=get&id=${id}`)
        var token = await res.text()
        if (token == 'CAPCHA_NOT_READY') {
            console.log('Captcha not ready, sleeping 5s')
            await sleep(5000)
            return this.checkCaptcha(id)
        }
        else if (token.includes('ERROR')) {
            throw new Error(token)
        }
        else {
            return token.replace('OK|', '')
        }
    }
}

module.exports = TwoCaptcha

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
  