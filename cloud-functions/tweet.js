const Twitter = require('twitter-v2');

(async () => {
    // const query = encodeURIComponent('nodejs has:links -is:reply -is:retweet url:"https://speakerdeck.com"');
    // const query = encodeURIComponent('from:TwitterDev');
    const client = new Twitter({
        bearer_token: '',
    });

    const { data, includes } = await client.get('tweets/search/recent',
        {
            query: 'has:links -is:reply -is:retweet (url:"https://speakerdeck.com" OR url:"https://www.slideshare.net")',
            tweet: {
                fields: 'created_at,public_metrics,entities'
            },
            expansions: 'author_id',
            max_results: 10
        }
    );
    console.log(data);
    console.log(includes);
})();