import './App.css';
import React from 'react';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {ogpList: []}
  }
  render() {
    fetch("https://my-app-2.silverbirder.workers.dev/#").then((res) => {
      res.json().then((j) => {
        this.setState({ogpList: j});
      });
    });
    return (
      <div className="App">
        <main>
          <div class="row row-cols-1 row-cols-md-3 g-4">
            {this.state.ogpList.map((ogp) => {
              return (
                <div class="col">
                  <div class="card">
                    <div class="card-header">
                      <span>
                        {ogp.siteName}
                      </span>
                      <span class="badge bg-secondary">
                        {ogp.sharedTimes}
                      </span>
                    </div>
                    <img src={ogp.image} class="card-img-top" alt={ogp.alt}></img>
                    <div class="card-body">
                      <h5 class="card-title">
                        {ogp.title}
                      </h5>
                      <p class="card-text">
                        {ogp.description}
                      </p>
                      <a href={ogp.url} class="btn btn-primary">Go the slide</a>
                    </div>
                    <div class="card-footer">
                      <small class="text-muted">Last updated 3 mins ago</small>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }
}

export default App;
