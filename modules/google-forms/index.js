const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const Raffle = require('../raffle')


class GoogleForms extends Raffle{
    constructor(...args) {
        super(...args)
    }

    async run(entries) {
        try {
            var {form, url} = await this.getForm()
            var entry = await this.submitEntry(form, url)
            if (entry.status === 200) this.log('Entry successful')
            else this.log('Entry failed', entry.status)
        }
        catch(e) {
            this.log('Error submitting form', e)
        }

        return
    }

    submitEntry = async (params, entryUrl) => {
        var options = {
            timeout: 30000,
            method: 'POST',
            body: params,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': this.url,
                'Origin': 'https://docs.google.com',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'en-US,en;q=0.9,es;q=0.8,nl;q=0.7',
                'cache-control': 'max-age=0'
            }
        }
        if (this.proxy) options.agent = this.proxy
        const request = await fetch(entryUrl, options)
        return request
    }
    

    getForm = async () => {
        var options = {
            timeout: 30000
        }
        if (this.proxy) options.agent = this.proxy
        const request = await fetch(this.url, options)
        if (request.status === 200) {
            const html = await request.text()

            const sitekey = html.split('data-sitekey="')[1].split('"')[0]
    
            const { window } = new JSDOM(html, { runScripts: "dangerously", url: this.url })
            const document = window.document
    
            const entryLookup = window.FB_PUBLIC_LOAD_DATA_[1][1]
    
            var form = {}
    
            var firstName = this.getRandomFirstName()
            var lastName = this.getRandomLastName()
            for (let i of entryLookup) {
                var field = i[1].toLowerCase()
                var id = i[4][0][0]
                // this.log(field,id)
                if (field.includes('first')) {
                    form[`entry.${id}`] = firstName
                }
                else if (field.includes('last')) {
                    form[`entry.${id}`] = lastName
                }
                else if (field.includes('address')) {
                    form[`entry.${id}`] = "2431 Siskiyou Street, APT. " + this.getApt(3).toString()
                }
                else if (field.includes('city')) {
                    form[`entry.${id}`] = 'Lewisville'
                }
                else if (field.includes('state')) {
                    form[`entry.${id}`] = 'Texas'
                }
                else if (field.includes('zip') || field.includes('postal')) {
                    form[`entry.${id}`] = '75056'
                }
                else if (field.includes('size')) {
                    var sizes = i[4][0][1].map((s) => s[0])
                    form[`entry.${id}`] = this.getRandom(sizes)
                }
            }
            form.emailAddress = `${firstName}${lastName}${this.getRandomString()}@${this.catchAll}`
    
    
            var formSubmit = document.querySelector('form').action
            var input = document.querySelectorAll('input')
    
            for (let i of input) {
                if (i.name == '') continue
                form[i.name] = i.value.replace('\n', '\r\n')
            }
    
            const captchaToken = await this.solver.submitCaptcha(sitekey, this.url)
            this.log('Got token')
            form['g-recaptcha-response'] = captchaToken
    
            const params = new URLSearchParams()
        
            for (let i in form) {
                params.append(i, form[i])
            }
    
            return {form: params, url: formSubmit}
        }
        else {
            throw new Error('Failed to get form',request.status)
        }

    }
}



module.exports = GoogleForms