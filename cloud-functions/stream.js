const Twitter = require('twitter-v2');

const client = new Twitter({
    bearer_token: process.env.TWITTER_V2_BEARER_TOKEN,
});

// (async () => {
//     const res = await client.post('tweets/search/stream/rules', {
//         "add": [
//             {
//                 "value": 'has:links -is:reply -is:retweet -is:quote (url:"https://speakerdeck.com" OR url:"https://www.slideshare.net" OR url:"https://docs.google.com/presentation")',
//                 "tag": "filter slide links"
//             },
//         ]
//     });
//     console.log(res);
// })();

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

listenForever(
    () => client.stream('tweets/search/stream', {
        tweet: {
            fields: 'created_at,public_metrics,entities'
        },
        expansions: 'author_id',
    }),
    (data, includes) => {
    }
);