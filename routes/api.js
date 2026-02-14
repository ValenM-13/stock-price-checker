'use strict';

const axios = require('axios');
const crypto = require('crypto');

let stocksDB = {};

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res) {

      let stock = req.query.stock;
      let like = req.query.like;

      // Asegurarse de que stock siempre sea un array
      if (!Array.isArray(stock)) {
        stock = [stock];
      }

      const results = [];

      stock = stock.map(s => s.toUpperCase());

      for (let s of stock) {

        try {
          // Obtener precio desde la API proxy de FreeCodeCamp
          const response = await axios.get(
            `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${s}/quote`
          );

          const price = response.data.latestPrice;

          // Inicializar el stock en la "base de datos"
          if (!stocksDB[s]) {
            stocksDB[s] = { likes: [] };
          }

          // Obtener la IP real del cliente
          const clientIP = req.header('x-forwarded-for') || req.ip;

          if (like === 'true') {
            const hashedIP = crypto
              .createHash('sha256')
              .update(clientIP)
              .digest('hex');

            // Solo 1 like por IP
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

      // Si solo hay un stock
      if (results.length === 1) {
        return res.json({ stockData: results[0] });
      }

      // Si hay dos stocks, calcular rel_likes
      const relLikes = results[0].likes - results[1].likes;

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
};
