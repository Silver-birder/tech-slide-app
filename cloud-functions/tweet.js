const Twitter = require('twitter-v2');
const crypto = require('crypto');
const url = require('url');
const {Firestore} = require('@google-cloud/firestore');
const firestore = new Firestore();

class Tweet {
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
    constructor(data) {
        this.id = data.id;
        this.text = data.text;
        this.createdAt = new Date(data.created_at);
        this.hashTags = data.entities.hasOwnProperty('hashtags') ? data.entities.hashtags.map((h) => {
            return h.tag;
        }) : [];
        this.slideIdList = data.entities.hasOwnProperty('urls') ? data.entities.urls.filter((u) => {
            return new RegExp("(speakerdeck.com|slideshare.net|docs.google.com)").test(u.expanded_url);
        }).map((u) => {
            const wu = new url.URL(u.expanded_url);
            const canonicalURL = `${wu.protocol}//${wu.host}${wu.pathname}`;
            const hashURL = crypto.createHash('sha256').update(canonicalURL).digest('hex');
            this.slidesClass.push(new Slide({ id: hashURL, url: canonicalURL }));
            return hashURL;
        }) : [];
        this.retweetCount = data.public_metrics.retweet_count;
        this.replyCount = data.public_metrics.reply_count;
        this.likeCount = data.public_metrics.like_count;
        this.quoteCount = data.public_metrics.quote_count;
        this.userId = data.author_id;
    }
    toJson() {
        return {
            id: this.id,
            text: this.text,
            createdAt: this.createdAt,
            hashTags: this.hashTags,
            retweetCount: this.retweetCount,
            replyCount: this.replyCount,
            likeCount: this.likeCount,
            quoteCount: this.quoteCount,
            slideIdList: this.slideIdList,
            userId: this.userId,
        }
    }
}

class Slide {
    id
    url
    constructor(data) {
        this.id = data.id;
        this.url = data.url;
    }
    toJson() {
        return {
            id: this.id,
            url: this.url,
        }
    }
}

class TwitterUser {
    id
    name
    userName
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.userName = data.username;
    }
    toJson() {
        return {
            id: this.id,
            name: this.name,
            userName: this.userName
        }
    }
}

async function listenForever(streamFactory, dataConsumer) {
    try {
        for await (const { data, includes } of streamFactory()) {
            dataConsumer(data, includes);
        }
        console.log('Stream disconnected healthily. Reconnecting.');
        listenForever(streamFactory, dataConsumer);
    } catch (error) {
        console.warn('Stream disconnected with error. Retrying.', error);
        listenForever(streamFactory, dataConsumer);
    }
}

const client = new Twitter({
    bearer_token: process.env.TWITTER_V2_BEARER_TOKEN,
});

listenForever(
    () => client.stream('tweets/search/stream', {
        tweet: {
            fields: 'created_at,public_metrics,entities'
        },
        expansions: 'author_id',
    }),
    async (data, includes) => {
        console.log('found!');
        console.log(data);
        console.log(includes);
        let usersList = [];
        if (includes.hasOwnProperty('users')) {
            usersList = includes.users.map((u) => {
                return new TwitterUser(u);
            })
        }
        // const tweetList = data.map((data) => {
        //     return new Tweet(data);
        // });
        const tweetList = [new Tweet(data)];
        const slideList = tweetList.filter((tweet) => {
            return tweet.slidesClass.length > 0
        }).map((tweet) => {
            return tweet.slidesClass;
        }).flat();
        let bulkWriter = firestore.bulkWriter();
        tweetList.map(async (tweet) => {
            let documentRef = firestore.collection('tweets').doc(tweet.id);
            const res = await bulkWriter.create(documentRef, tweet.toJson());
            console.log(res);
        });
        slideList.map(async (slide) => {
            let documentRef = firestore.collection('slides').doc(slide.id);
            const res = await bulkWriter.create(documentRef, slide.toJson());
            console.log(res);
        });
        usersList.map(async (user) => {
            let documentRef = firestore.collection('users').doc(user.id);
            const res = await bulkWriter.create(documentRef, user.toJson());
            console.log(res);
        });
        await bulkWriter.close().then(() => {
            console.log('Executed all writes');
        })
    }
);