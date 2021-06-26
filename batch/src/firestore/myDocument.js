const crypto = require('crypto');
const url = require('url');
const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const os = require('os')

class BaseDoc {
    toJson() {
        return Object.getOwnPropertyNames(this).reduce((a, b) => {
            a[b] = this[b];
            return a;
        }, {});
    }
}

class TweetDoc extends BaseDoc {
    id
    text
    createdAt
    hashTags
    retweetCount
    replyCount
    likeCount
    quoteCount
    slideIdList
    slidesClass = [];
    userId
    constructor(data, domains = []) {
        super();
        this.id = data.id;
        this.text = data.text;
        this.createdAt = new Date(data.created_at);
        this.hashTags = data.entities.hasOwnProperty('hashtags') ? data.entities.hashtags.map((h) => {
            return h.tag;
        }) : [];
        this.slideIdList = data.entities.hasOwnProperty('urls') ? data.entities.urls.filter((u) => {
            return new RegExp(`(${domains.join('|')})`).test(u.expanded_url);
        }).map((u) => {
            const wu = new url.URL(u.expanded_url);
            const canonicalURL = `${wu.protocol}//${wu.host}${wu.pathname}`;
            const hashURL = crypto.createHash('sha256').update(canonicalURL).digest('hex');
            this.slidesClass.push(new SlideDoc({ id: hashURL, url: canonicalURL }));
            return hashURL;
        }) : [];
        this.retweetCount = data.public_metrics.retweet_count;
        this.replyCount = data.public_metrics.reply_count;
        this.likeCount = data.public_metrics.like_count;
        this.quoteCount = data.public_metrics.quote_count;
        this.userId = data.author_id;
    }

    toJson() {
        const res = super.toJson();
        delete res['slidesClass'];
        return res;
    }
}

class SlideDoc extends BaseDoc {
    id
    url
    constructor(data) {
        super();
        this.id = data.id;
        this.url = data.url;
    }
    async fetch() {
        let res = null;
        try {
            res = await (await fetch(this.url)).text();
        } catch (e) {
            return;
        }
        const dom = new JSDOM(res);
        const nodeList = dom.window.document.querySelectorAll('[property^="og:"]');
        for (var i = 0; i < nodeList.length; i++) {
            var item = nodeList[i];
            const property = item.getAttribute('property').slice(3);
            const content = item.getAttribute('content');
            this[property] = content;
        }
    }
}

class UserDoc extends BaseDoc {
    id
    name
    userName
    constructor(data) {
        super();
        this.id = data.id;
        this.name = data.name;
        this.userName = data.username;
    }
}

exports.DocFactory = class DocFactory {
    constructor(data, includes, domains = []) {
        this.data = data;
        this.includes = includes;
        this.domains = domains;
    }
    async create() {
        let usersList = [];
        let tweetList = [];
        let slideList = [];
        usersList = this.includes.map((include) => {
            if (include && include.hasOwnProperty('users')) {
                return include.users.map((u) => {
                    return new UserDoc(u);
                });
            }
        }).flat().reduce((array, item) => {
            if (!array.some(ar => ar.id == item.id)) {
                array.push(item);
            }
            return array;
        }, []);
        tweetList = this.data.map((data) => {
            return new TweetDoc(data, this.domains);
        }).reduce((array, item) => {
            if (!array.some(ar => ar.id == item.id)) {
                array.push(item);
            }
            return array;
        }, []);
        slideList = tweetList.filter((tweet) => {
            return tweet.slidesClass.length > 0
        }).map((tweet) => {
            return tweet.slidesClass;
        }).flat().reduce((array, item) => {
            if (!array.some(ar => ar.id == item.id)) {
                array.push(item);
            }
            return array;
        }, []);
        console.log(`slideList: ${slideList.length}`);
        await concurrentPromise(slideList.map(async (slide) => {
            await slide.fetch();
        }), os.cpus().length - 1);
        return [usersList, tweetList, slideList];
    }
}

const concurrentPromise = async (promise_functions, max_concurrent_worker = 10) => {
    let results = [],
        current_index = 0;
    while (true) {
        let promise_functions_chunk = promise_functions.slice(current_index, current_index + max_concurrent_worker);
        if (promise_functions_chunk.length == 0) {
            break;
        }
        results = results.concat(await Promise.all(promise_functions_chunk.map(async promise_function => {
            return await promise_function;
        })));
        console.log(`concurrentPromise(current_index: ${current_index})`);
        current_index += max_concurrent_worker;
    }
    return {
        promise_results: results,
    };
};