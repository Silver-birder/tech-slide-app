extern crate cfg_if;
extern crate wasm_bindgen;

mod utils;

use cfg_if::cfg_if;
use wasm_bindgen::prelude::*;

cfg_if! {
    // When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
    // allocator.
    if #[cfg(feature = "wee_alloc")] {
        extern crate wee_alloc;
        #[global_allocator]
        static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
    }
}

struct OGP {
    image: String,
}

/*
    url = "https://speakerdeck.com/twada/quality-and-speed-2020-autumn-edition",
    siteName = "Speaker Deck",
    title = "質とスピード（2020秋100分拡大版） / Quality and Speed 2020 Autumn Edition",
    description = "質とスピード（2020秋100分拡大版）2020/11/20 @ JaSST'20 Kyushu",
    type = "website",
    image = "https://files.speakerdeck.com/presentations/9ca54caac3db4344bdd140015dc5e081/slide_0.jpg?16782471",
    sharedTimes = 10
*/
#[wasm_bindgen]
pub fn greet() -> String {
    let opg = OGP { image: "https://files.speakerdeck.com/presentations/9ca54caac3db4344bdd140015dc5e081/slide_0.jpg?16782471".to_string()};
    let v = vec![opg];
    let mut st = String::new();
    for i in &v {
        println!("{}", i.image);
        st = format!("{}{}", st, i.image);
    }
    format!("
    <!doctype html>
    <html>
    <head>
      <meta charset='utf-8'>
      <meta name='viewport' content='width=device-width, initial-scale=1'>
      <!-- [BOOTSTRAP] https://getbootstrap.jp/docs/5.0/getting-started/introduction/ -->
      <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/css/bootstrap.min.css' rel='stylesheet' integrity='sha384-giJF6kkoqNQ00vy+HMDP7azOuL0xtbfIcaT9wjKHr8RbDVddVHyTfAAsrekwKmP1' crossorigin='anonymous'>
    </head>
    <body>
    {}
    </body>
    </html>
    ", format!("
    <div class='row row-cols-1 row-cols-md-3 g-4'>
    <div class='col'>
        <div class='card'>
          <div class='card-header'>
            <span>
              Speaker Deck
            </span>
            <span class='badge bg-secondary'>
              10
            </span>
          </div>
          <img src='{}' class='card-img-top'>
          <div class='card-body'>
            <h5 class='card-title'>
              質とスピード（2020秋100分拡大版） / Quality and Speed 2020 Autumn Edition
            </h5>
            <p class='card-text'>
              質とスピード（2020秋100分拡大版）2020/11/20 @ JaSST'20 Kyushu
            </p>
            <a href='https://speakerdeck.com/twada/quality-and-speed-2020-autumn-edition' class='btn btn-primary'>Go the slide</a>
          </div>
          <div class='card-footer'>
            <small class='text-muted'>Last updated 3 mins ago</small>
          </div>
        </div>
      </div>
    </div>
    ", st)).to_string()
}