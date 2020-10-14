const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { URLSearchParams } = require('url');
const random_name = require('node-random-name');

var TwoCaptcha = require('../2captcha');
const Raffle = require('../raffle');

const VIRALSWEEP_SITEKEY = '6LdhYxYUAAAAAAcorjMQeKmZb6W48bqb0ZEDRPCl'
class ViralSweep extends Raffle {
    

    constructor(...args) {
        super(...args)
    }

    async run() {
        console.log(`[${this.id}]`, 'Starting entry')
        try {
            var [params, entryUrl] = await this.getForm()
        
            var entry = await this.submitEntry(params, entryUrl)

            console.log(`[${this.id}]`,'Successfully entered', entry)
        }    
        catch(e) {
            console.log(`[${this.id}]`,'Error entering raffle:', e)
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
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': entryUrl,
                'Origin': 'https://app.viralsweep.com'
            }
        }
        if (this.proxy) options.agent = this.proxy
        const request = await fetch('https://app.viralsweep.com/promo/enter', options)
        return request.json()
    }
    
    getForm = async () => {
        const site = await fetch(this.url)
        const pageHtml = await site.text()
    
        const [pid, sid] = pageHtml.split(`src="https://app.viralsweep.com/vsa-widget-`)[1].split(`"></script>`)[0].split('.js?sid=')
    
        const entryUrl = `https://app.viralsweep.com/vrlswp/widget/${pid}?rndid=${sid}&framed=1&vs_eid_hash=&ref=&source_url=${encodeURIComponent(this.url)}&hash=`
    
        var options = {timeout: 30000}
        if (this.proxy) options.agent = this.proxy
        const entryPage = await fetch(entryUrl, options)
        const entryPageHtml = await entryPage.text()
    
        const $ = cheerio.load(entryPageHtml)
    
        var form = {}
    
        $('input').each((i, input) => {
            var attr = input.attribs
            if (typeof attr.name == 'undefined') return
            form[attr.name] = attr.value
        })
    
        var sizeOptions = $('select')[0]
        var sizes = []
        if (sizeOptions) { 
            for (let val of sizeOptions.children) {
                if (val.name !== 'option') continue
                if (!isNaN(val.children[0].data)) sizes.push(val.children[0].data)
            }
        }
        else {
            console.log(`[${this.id}]`,entryPage.status)
        }

    
        var size = sizes[Math.floor(Math.random() * (sizes.length - 1))]
    
        form[sizeOptions.attribs.name] = size
    
        var firstName = random_name({ first: true })
        var lastName = random_name({ last: true })
        var email = `${firstName}-${lastName}-${this.random()}@${this.catchAll}`
    
    
        delete form.newsletter_subscribe
        form.email_again = ''
        form.first_name = firstName
        form.last_name = lastName
        form.email = email
        form.entry_source = this.url
        form.tv = await this.getToken(form.ti, pid.split('-')[1], entryUrl)
    
        const captchaToken = await this.solver.submitCaptcha(VIRALSWEEP_SITEKEY, entryUrl)
        console.log(`[${this.id}]`, 'Got token', captchaToken)
        form['g-recaptcha-response'] = captchaToken
    
        // console.log(form)
    
        const params = new URLSearchParams()
    
        for (let i in form) {
            params.append(i, form[i])
        }
        return [params, entryUrl]
    }
    
    getToken = async (id, pid, referer) => {
        const params = new URLSearchParams();
        params.append('id', id)
        params.append('pid', pid)
        var options = {
            timeout: 30000,
            method: 'POST',
            body: params,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': referer,
                'Origin': 'https://app.viralsweep.com'
            }
        }
        if (this.proxy) options.agent = this.proxy
        const request = await fetch('https://app.viralsweep.com/promo/token', options)
        return request.text()
    }
    
    random() {
        return Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);
    }
}


module.exports = ViralSweep