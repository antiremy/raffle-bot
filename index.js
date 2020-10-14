var readlineSync = require('readline-sync');
const fs = require('fs')
var HttpsProxyAgent = require('https-proxy-agent');

const ViralSweep = require('./modules/viralsweep')
const GoogleForms = require('./modules/google-forms')
const DSM = require('./modules/dsmny')

const CATCH_ALL = 'remysyeezys.com'

function main() {
    var url = readlineSync.question('Enter Raffle URL: ');
    var proxies = fs.readFileSync('./proxies.txt').toString().split('\n')
    if (url.includes('bdgastore.com') || url.includes('undefeated.com')) {
        console.log('ViralSweep Raffle detected')
        for (let i in proxies) {
            var proxy = proxies[i]
            if (proxy && proxy.trim() != '') {
                proxy = proxy.trim().split(':')
                if (proxy.length == 2) {
                    proxy = new HttpsProxyAgent(`http://${proxy[0]}:${proxy[1]}`)
                }
                else {
                    proxy = new HttpsProxyAgent(`http://${proxy[2]}:${proxy[3]}@${proxy[0]}:${proxy[1]}`)
                }
            }
            var task = new ViralSweep(url, CATCH_ALL, proxy, (parseInt(i) + 1))
            task.run()
        }
    }
    else if (url.includes('docs.google.com/forms')) {
        console.log('Google Forms detected')
        for (let i in proxies) {
            var proxy = proxies[i]
            if (proxy && proxy.trim() != '') {
                proxy = proxy.trim().split(':')
                if (proxy.length == 2) {
                    proxy = new HttpsProxyAgent(`http://${proxy[0]}:${proxy[1]}`)
                }
                else {
                    proxy = new HttpsProxyAgent(`http://${proxy[2]}:${proxy[3]}@${proxy[0]}:${proxy[1]}`)
                }
            }
            var task = new GoogleForms(url, CATCH_ALL, proxy, (parseInt(i) + 1))
            task.run()
        }
    }
    else if (url.includes('doverstreetmarket.com')) {
        console.log('DSM Raffle detected')
        var task = new DSM(url, CATCH_ALL, proxy, 1)
        task.run()
    }
    else {
        console.log('URL not recognized')
    }
}

main()