import logo from './logo.svg';
import './App.css';
import { FirestoreCollection, withFirestore } from 'react-firestore';
import React from 'react';

class App extends React.Component {
  state = {
    tweets: [],
    slides: [],
    users: [],
  };

  async componentDidMount() {
    const { firestore } = this.props;
    // const snapshot = await firestore.collection('tweets').where('likeCount', '>', 0).get();
    // const dataList = snapshot.docs.map((doc) => {
    //   return doc.data();
    // });
    // this.setState({tweets: dataList});
    firestore
      .collection('tweets')
      .where('createdAt', '>', new Date("2021-06-01"))
      .where('createdAt', '<', new Date('2021-07-01'))
      .onSnapshot(snapshot => {
        this.setState({ tweets: snapshot.docs.map((doc) => doc.data()) });
        const slideIdList = Array.from(new Set(snapshot.docs.map((doc) => {
          const data = doc.data();
          return data.slideIdList;
        }).flat()));
        firestore
          .collection('slides')
          .where('id', 'in', slideIdList)
          .onSnapshot(snapshot => {
            this.setState({ slides: snapshot.docs.map((doc) => doc.data()) });
          });
      });
  }

  render() {
    return (
      <div className="App">
        {this.state.tweets.map((tweet) => {
          return (<div key={tweet.id}>{tweet.text}</div>)
        })}
        {this.state.slides.map((slide) => {
          return (<div key={slide.id}>{slide.url}</div>)
        })}
        {/* <FirestoreCollection
          path="tweets"
          render={({ isLoading, data }) => {
            return isLoading ? (
              <div>loading ...</div>
            ) : (
              <div>
                <h1>Tweets</h1>
                <ul>
                  {data.map(tweet => (
                    <li key={tweet.id}>
                      {tweet.text}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }}
        /> */}
      </div>
    );
  }
}

export default withFirestore(App);
