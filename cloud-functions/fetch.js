const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

(async () => {
    const res = await (await fetch('https://speakerdeck.com/silverbirder/micro-frontends-on-kubernetes-trial')).text();
    const dom = new JSDOM(res);
    const nodeList = dom.window.document.querySelectorAll('[property^="og:"]');
    for (var i = 0; i < nodeList.length; i++) {
        var item = nodeList[i];
        console.log(item.getAttribute('property'));
        console.log(item.getAttribute('content'));
    }
})();