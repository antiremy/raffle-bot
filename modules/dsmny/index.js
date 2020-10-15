const fetch = require('node-fetch');
const cheerio = require('cheerio');
var FormData = require('form-data');
const Raffle = require('../raffle');
const chalk = require('chalk');
// const { JSDOM } = require('jsdom')


class DSMNY extends Raffle {

    constructor(...args) {
        super(...args)

    }

    async run() {
        this.log('Starting entry')
        try {
            var {form, entryUrl, sitekey} = await this.getForm()
            var params = await this.fillForm(form, sitekey)
            var multiForm = await this.convertFormToMulti(params)
            var entry = await this.submitEntry(multiForm, entryUrl)
            if (entry.status === 302 && entry.headers.get('location').includes('thank-you')) {
                this.log(chalk.green('Successfully entered raffle'))
            }
            else {
                this.log(chalk.red('Error entering raffle'), entry.status)
            }
        }
        catch (e) {
            this.log(chalk.red('Error during raffle process', e))
        }
        return
    }

    convertFormToMulti = async (form) => {
        var multipartForm = new FormData();
        for (let i in form) {
            multipartForm.append(i, form[i])
        }

        return multipartForm
    }

    submitEntry = async (params, entryUrl) => {
        var url = this.url.split('.com/')[0] + '.com'
        var options = {
            timeout: 30000,
            method: 'POST',
            body: params,
            redirect: 'manual', 
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36',
                'Referer': url + '/',
                'Origin': url,
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'en-US,en;q=0.9,es;q=0.8,nl;q=0.7',
                'cache-control':  'max-age=0'
            }
        }
        if (this.proxy) options.agent = this.proxy
        const request = await fetch(entryUrl, options)
        return request
    }
    

    fillForm = async (fields, sitekey) => {
        var form = {}
        var firstName =  this.getRandomFirstName()
        var lastName = this.getRandomLastName()
        var email = `${firstName}${lastName}${this.getRandomNumber(5)}@${this.catchAll}`
        for (let f of fields) {
            var label = f.label.toLowerCase()
            if (f.defaultValue.includes('Please add me to the')) {
                continue
            }
            else if (label === '') {
                form[f.name] = f.defaultValue;
            }
            else if (f.options) {
                form[f.name] = this.getRandom(f.options)
            }
            else if (label == 'full name') {
                form[f.name] = firstName + ' ' + lastName
            }
            else if (label == 'email') {
                form[f.name] = email
            }
            else if (label.includes('phone')) {
                form[f.name] = this.getRandomNumber(10).toString()
            }
            else if (label.includes('zip')) {
                form[f.name] = this.fakerator.entity.address().zip.substr(0,5)
            }
            else if (label.includes('first line of billing address')) {
                form[f.name]  = this.fakerator.address.street()
            }
        }

        const captchaToken = await this.solver.submitCaptcha(sitekey, this.url, this.log)
        this.log('Got token')
        form['g-recaptcha-response'] = captchaToken

        form.nonce = await this.getNonce()

        return form
    }

    getNonce = async () => {
        for (var t = "", i = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", r = 0; r < 16; r++)
            t += i.charAt(Math.floor(Math.random() * i.length));
        return t
    }

    getForm = async () => {
        var options = {
            timeout: 30000,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36',
            }
        }
        if (this.proxy) options.agent = this.proxy
        const request = await fetch(this.url, options)
        var body = await request.text()

        var scriptUrl = body.split('<script type="text/javascript" src="')[1].split('"')[0]

        options.headers.referer = this.url.split('.com/')[0] + '.com/'

        const scriptRequest = await fetch(scriptUrl, options)
        var script = await scriptRequest.text()
        script = script.split('\n')

        var doc = "<html><head></head><body>"

        for (let i in script) {
            var l = script[i]

            if (l.includes('api.js') || l.trim() == '' || typeof l == 'undefined') {
                continue
            }

            l = l.replace('document.write(', '')
            var end = l.lastIndexOf(';')
            l = l.substr(0, end - 1)
            l = eval(l)

            doc += l
        }
        doc += '</body></html>'

        const $ = cheerio.load(doc)

        var form = []

        $('input').map((i, elm) => {
            if (typeof $(elm).attr('name') != 'undefined') {
                form.push({
                    name: $(elm).attr('name'),
                    defaultValue: $(elm).attr('value') || '',
                    label: $(elm).parent() && $(elm).parent().children()[0].tagName == 'label' ? $(elm).parent().children()[0].children[0].data : ''
                })
            }
        })

        $('select').map((i, elm) => {
            if (typeof $(elm).attr('name') != 'undefined') {
                var options = []
                $(elm).children().map((i, elm) => {
                    if (elm.tagName.toLowerCase() == 'option')  {
                        options.push(elm.attribs.value)
                    }
                })
                form.push({
                    name: $(elm).attr('name'),
                    defaultValue: $(elm).attr('value') || '',
                    options,
                    label: $(elm).parent() && $(elm).parent().children()[0].tagName == 'label' ? $(elm).parent().children()[0].children[0].data : ''
                })
            }
        })


        var entryUrl = $('form').attr('action')
        var sitekey = $('.g-recaptcha').attr('data-sitekey')
        return {form, entryUrl, sitekey}
    }
}

module.exports = DSMNY