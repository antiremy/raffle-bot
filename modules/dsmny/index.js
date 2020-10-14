const fetch = require('node-fetch');
const cheerio = require('cheerio');
// const { JSDOM } = require('jsdom')


class DSM {

    constructor(url, catchAll, proxy) {
        this.url = url
        this.catchAll = catchAll
        this.proxy = proxy
    }

    async run() {
        console.log(`[${this.id}]`, 'Starting entry')
        try {
            var form = await this.getForm()
            // console.log(form)
        }
        catch (e) {
            console.log(`[${this.id}]`, 'Error entering raffle:', e)
        }
        return
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

        options.headers.referer = this.url

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
                if ($(elm).parent() && $(elm).parent().children()[0].tagName == 'label') {
                    console.log($(elm).parent().children()[0].children[0].data)
                }
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

        console.log(form.map((i) => {var holder = {}; holder[i.name] = i.defaultValue; return holder}))

        return form
    }
}

module.exports = DSM