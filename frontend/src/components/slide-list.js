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
    createdAt
    constructor(data) {
        this.tweetCount = 1;
        this.likeCount = data.likeCount;
        this.quoteCount = data.quoteCount;
        this.replyCount = data.replyCount;
        this.retweetCount = data.retweetCount;
        this.totalCount = this.calcTotalCount();
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
            createdAt: this.createdAt > slideInfo.createdAt ? this.createdAt : slideInfo.createdAt
        }
        return new SlideInfo(data);
    }
}

class SlideList extends React.Component {
    state = {
        slides: [],
        unsubscribeList: []
    };

    async componentDidMount() {
        await this.start();
    }

    start() {
        const { firestore, startDate, endDate } = this.props;
        firestore
            .collection('tweets')
            .where('createdAt', '>', startDate)
            .where('createdAt', '<', endDate)
            .onSnapshot(this.handleTweets.bind(this));
    }
    unsubscribes() {
        if (this.state.unsubscribeList.length > 0) {
            this.state.unsubscribeList.map((unsubscribe) => unsubscribe());
            this.state.setState({ unsubscribeList: [] });
        }
    }
    async handleTweets(snapshot) {
        let slides = {};
        snapshot.docs.map((doc) => {
            const data = doc.data();
            data.slideIdList.map((slideId) => {
                slides[slideId] = slides.hasOwnProperty(slideId) ? slides[slideId].merge(new SlideInfo(data)) : new SlideInfo(data);
            });
        });
        let arySlides = Object.entries(slides);
        arySlides.sort(function (p1, p2) {
            var p1Key = p1[1].totalCount, p2Key = p2[1].totalCount;
            if (p1Key < p2Key) { return 1; }
            if (p1Key > p2Key) { return -1; }
            return 0;
        });
        const limitSlides = arySlides.slice(19);
        const slideIdList10 = arrayChunk(limitSlides, 10);
        this.unsubscribes();
        this.setState({slides: limitSlides})
        slideIdList10.map((slideIdList) => {
            const unsubscribe = firestore
                .collection('slides')
                .where('id', 'in', slideIdList)
                .onSnapshot(this.handleSlides.bind(this));
            this.state.unsubscribeList.push(unsubscribe);
        });
    }

    async handleSlides(snapshot) {
        snapshot.docs.map((doc) => {
            const data = doc.data();
            const id = data.id;
            const slide = slides[id];
            slides[id] = Object.assign(slide, data);
        });
        this.setState({ slides: tmpSlides });
    }

    render() {
        return (
            <div className="row row-cols-1 row-cols-md-3 g-4">
                {/* {this.state.slides.map((slide) => {
                    return (
                        <div className="col" key={slide[0]}>
                            <div className="card">
                                <div className="card-header">
                                    <span>
                                        {slide[1].site_name}
                                    </span>
                                    <span className="badge bg-secondary">
                                        {slide[1].totalCount}
                                    </span>
                                </div>
                                <img src={slide[1].image} className="card-img-top"></img>
                                <div className="card-body">
                                    <h5 className="card-title">
                                        {slide[1].title}
                                    </h5>
                                    <p className="card-text">
                                        {slide[1].description}
                                    </p>
                                    <a href={slide[1].url} className="btn btn-primary">Go the slide</a>
                                </div>
                                <div className="card-footer">
                                    <small className="text-muted">
                                        Update {slide[1].createdAt.getFullYear()}/{slide[1].createdAt.getMonth() + 1}/{slide[1].createdAt.getDate()} {slide[1].createdAt.getHours()}:{slide[1].createdAt.getMinutes()}:{slide[1].createdAt.getSeconds()}
                                    </small>
                                </div>
                            </div>
                        </div>
                    );
                })} */}
            </div>
        );
    }
}

export default withFirestore(SlideList);
