import { withFirestore } from 'react-firestore';
import React from 'react';

const arrayChunk = ([...array], size = 1) => {
    return array.reduce((acc, value, index) => index % size ? acc : [...acc, array.slice(index, index + size)], []);
}

class SlideInfo {
    count = 0
    likeCount = 0
    quoteCount = 0
    replyCount = 0
    retweetCount = 0
    totalCount = 0
    hashTags = []
    createdAt
    constructor(data) {
        this.tweetCount = 1;
        this.likeCount = data.likeCount;
        this.quoteCount = data.quoteCount;
        this.replyCount = data.replyCount;
        this.retweetCount = data.retweetCount;
        this.totalCount = this.calcTotalCount();
        this.hashTags = data.hashTags;
        this.createdAt = data.createdAt.hasOwnProperty('toDate') ? data.createdAt.toDate() : data.createdAt;
    }
    calcTotalCount() {
        return this.tweetCount + this.likeCount + this.quoteCount + this.replyCount;
    }
    merge(slideInfo) {
        const data = {
            likeCount: this.likeCount + slideInfo.likeCount,
            quoteCount: this.quoteCount + slideInfo.quoteCount,
            replyCount: this.replyCount + slideInfo.replyCount,
            retweetCount: this.retweetCount + slideInfo.retweetCount,
            totalCount: this.totalCount + slideInfo.totalCount,
            hashTags: this.hashTags.concat(slideInfo.hashTags),
            createdAt: this.createdAt > slideInfo.createdAt ? this.createdAt : slideInfo.createdAt
        }
        return new SlideInfo(data);
    }
}

class SlideList extends React.Component {
    state = {
        slides: {},
        unsubscribeList: []
    };

    async componentDidMount() {
        await this.start();
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (
            prevProps.startDate !== this.props.startDate ||
            prevProps.endDate !== this.props.endDate ||
            prevProps.hosts.slideshare !== this.props.hosts.slideshare ||
            prevProps.hosts.googleslide !== this.props.hosts.googleslide ||
            prevProps.hosts.speakerdeck !== this.props.hosts.speakerdeck
        ) {
            await this.start();
        }
    }
    start() {
        const { firestore } = this.props;
        this.setState({ slides: {} });
        firestore
            .collection('tweets')
            .where('createdAt', '>=', new Date(`${this.props.startDate} 00:00:00`))
            .where('createdAt', '<=', new Date(`${this.props.endDate} 23:59:59`))
            .limit(1000)
            .onSnapshot(this.handleTweets.bind(this));
    }
    unsubscribes() {
        if (this.state.unsubscribeList.length > 0) {
            this.state.unsubscribeList.map((unsubscribe) => unsubscribe());
            this.setState({ unsubscribeList: [] });
        }
    }
    async handleTweets(snapshot) {
        const { firestore } = this.props;
        let slides = {};
        snapshot.docs.map((doc) => {
            const data = doc.data();
            data.slideIdList.map((slideId) => {
                slides[slideId] = slides.hasOwnProperty(slideId) ? slides[slideId].merge(new SlideInfo(data)) : new SlideInfo(data);
            });
        });
        const slideIds = Object.keys(slides);
        const slideIdList10 = arrayChunk(slideIds, 10);
        this.unsubscribes();
        slideIdList10.map((slideIdList) => {
            const unsubscribe = firestore
                .collection('slides')
                .where('id', 'in', slideIdList)
                .onSnapshot(this.handleSlides.bind(this, slides));
            this.state.unsubscribeList.push(unsubscribe);
        });
    }

    async handleSlides(slides, snapshot) {
        snapshot.docs.map((doc) => {
            const data = doc.data();
            const id = data.id;
            const slide = slides[id];
            slides[id] = Object.assign(slide, data);
        });
        this.setState({ slides: Object.assign(slides, this.state.slides) });
    }

    render() {
        const hosts = [];
        if (this.props.hosts.slideshare) {
            hosts.push('www.slideshare.net');
        }
        if (this.props.hosts.googleslide) {
            hosts.push('docs.google.com');
        }
        if (this.props.hosts.speakerdeck) {
            hosts.push('speakerdeck.com')
        }
        const slides = this.state.slides;
        const slideIds = Object.keys(slides);
        const filterdSlideIds = slideIds.filter((slideId) => {
            return hosts.indexOf(slides[slideId].host) !== -1;
        })
        filterdSlideIds.sort((a, b) => {
            if (slides[a].totalCount > slides[b].totalCount) {
                return -1;
            } else if (slides[a].totalCount < slides[b].totalCount) {
                return 1;
            } else {
                return 0;
            }
        });
        return (
            <div className="row row-cols-1 row-cols-md-3 g-4">
                {filterdSlideIds.map((slideId) => {
                    const slide = slides[slideId];
                    return (
                        <div className="col" key={slideId} data-id={slideId}>
                            <div className="card">
                                <div className="card-header">
                                    <span>
                                        {slide.host} <span className="badge bg-secondary">{slide.totalCount}</span>
                                    </span>
                                </div>
                                <img src={slide.image} className="card-img-top"></img>
                                <div className="card-body">
                                    <h5 className="card-title">
                                        {slide.title}
                                    </h5>
                                    <p className="card-text">
                                        {slide.description}
                                        {/* ある一定文字数超えたら、隠すように */}
                                        {/* twitter iconを出したい */}
                                    </p>
                                    <a href={slide.url} className="btn btn-primary" target="_blank">Go the slide</a>
                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item text-start">
                                            {/* <img src="https://pbs.twimg.com/profile_images/1001734669719818240/FXI4G2Uv_normal.jpg" className="border border-5 rounded-circle" />
                                            <img src="https://pbs.twimg.com/profile_images/1001734669719818240/FXI4G2Uv_normal.jpg" className="border border-5 rounded-circle" />
                                            <img src="https://pbs.twimg.com/profile_images/1001734669719818240/FXI4G2Uv_normal.jpg" className="border border-5 rounded-circle" /> */}
                                        </li>
                                        <li className="list-group-item text-start">
                                            {Array.from(new Set(slide.hashTags)).map((hashTag) => {
                                                return (
                                                    <div key={hashTag}>
                                                        <a href={`https://twitter.com/hashtag/${hashTag}`}>#{hashTag}</a>
                                                    </div>
                                                )
                                            })}</li>
                                    </ul>
                                </div>
                                <div className="card-footer">
                                    <small className="text-muted">
                                        Update {slide.createdAt.toDate().getFullYear()}/{slide.createdAt.toDate().getMonth() + 1}/{slide.createdAt.toDate().getDate()} {slide.createdAt.toDate().getHours()}:{slide.createdAt.toDate().getMinutes()}:{slide.createdAt.toDate().getSeconds()}
                                    </small>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
}

export default withFirestore(SlideList);
