const index = require('./index');
const express = require('express');
const app = express();

app.get('/', async (req, res) => {
    await index.main();
    res.json({});
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`listening on port ${port}`);
});