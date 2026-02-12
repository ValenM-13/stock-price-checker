'use strict';

const axios = require('axios');
const crypto = require('crypto');

let stocksDB = {};


module.exports = function (app) {

  app.route('/api/stock-prices')
  .get(async function (req, res){

    let stock = req.query.stock;
    let like = req.query.like;

    if (!Array.isArray(stock)) {
      stock = [stock];
    }

    const results = [];

    for (let s of stock) {

      try {

        const response = await axios.get(
          `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${s}/quote`
        );

        const price = response.data.latestPrice;

        if (!stocksDB[s]) {
          stocksDB[s] = { likes: [] };
        }

        if (like === 'true') {

          const hashedIP = crypto
            .createHash('sha256')
            .update(req.ip)
            .digest('hex');

          if (!stocksDB[s].likes.includes(hashedIP)) {
            stocksDB[s].likes.push(hashedIP);
          }
        }

        results.push({
          stock: s,
          price: price,
          likes: stocksDB[s].likes.length
        });

      } catch (err) {
        return res.json({ error: 'Invalid stock symbol' });
      }
    }

    if (results.length === 1) {
      return res.json({ stockData: results[0] });
    }

    const relLikes =
      results[0].likes - results[1].likes;

    return res.json({
      stockData: [
        {
          stock: results[0].stock,
          price: results[0].price,
          rel_likes: relLikes
        },
        {
          stock: results[1].stock,
          price: results[1].price,
          rel_likes: -relLikes
        }
      ]
    });

  });
}