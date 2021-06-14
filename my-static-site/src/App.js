import './App.css';

function App() {
  const ogpList = [];
  for (var i = 0; i < 10; i++) {
    ogpList.push({
      url: "https://speakerdeck.com/twada/quality-and-speed-2020-autumn-edition",
      siteName: "Speaker Deck",
      title: "質とスピード（2020秋100分拡大版） / Quality and Speed 2020 Autumn Edition",
      description: "質とスピード（2020秋100分拡大版）2020/11/20 @ JaSST'20 Kyushu",
      type: "website",
      image: "https://files.speakerdeck.com/presentations/9ca54caac3db4344bdd140015dc5e081/slide_0.jpg?16782471",
      alt: "質とスピード（2020秋100分拡大版） / Quality and Speed 2020 Autumn Edition",
      sharedTimes: 10
    });
  }
  return (
    <div className="App">
      <main>
        <div class="row row-cols-1 row-cols-md-3 g-4">
          {ogpList.map((ogp) => {
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

export default App;
