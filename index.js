var readlineSync = require('readline-sync');
const fs = require('fs')
var HttpsProxyAgent = require('https-proxy-agent');
var async = require("async");

const ViralSweep = require('./modules/viralsweep')
const GoogleForms = require('./modules/google-forms')
const DSMNY = require('./modules/dsmny')


const CATCH_ALL = 'remysyeezys.com'

function main() {
    var url = readlineSync.question('Enter Raffle URL: ');
    var processCount = parseInt(readlineSync.question('Simulatenous entries: '));
    var proxies = fs.readFileSync('./proxies.txt').toString().split('\n')
    var q = async.queue(async function(task, callback) {
        await task.run()
        callback()
    }, processCount)
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
            q.push(task)
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
            q.push(task)
        }
    }
    else if (url.includes('doverstreetmarket.com')) {
        console.log('DSM Raffle detected')
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
            var task = new DSMNY(url, CATCH_ALL, proxy, (parseInt(i) + 1))
            q.push(task)
        }

    }
    else {
        console.log('URL not recognized')
    }
}

main()