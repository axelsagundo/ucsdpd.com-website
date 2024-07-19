var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

	const {Pool, Client} = require('pg');

	// console.log('DB User:', process.env.DB_USER);
	// console.log('DB Host:', process.env.HOST);
	// console.log('DB Database:', process.env.DATABASE);
	// console.log('DB Password:', process.env.PASSWORD);
	// console.log('DB Port:', process.env.DB_PORT);

	const pool = new Pool ({
		user: process.env.DB_USER,
		host: process.env.HOST,
		database: process.env.DATABASE,
		password: process.env.PASSWORD,
		post: process.env.DB_PORT
	});

	(async () => {

   		const client = await pool.connect();

   		try {
			const {rows} = await client.query(`SELECT * FROM case_logs WHERE interesting = true AND month_year = 'Jul 2024';`);

			function formatDate(date, month_option) {

				const options = {
					month: month_option,   // m
					day: 'numeric',  // Two-digit day
					year: 'numeric'  // Four-digit year
				};

				return date.toLocaleDateString('en-US', options);
			}

			rows.forEach(row => {
				 if (row.date) {
					 row.formattedDate = formatDate(new Date(row.date), 'numeric');
				 }
			});

			const groupedCases = {};

			rows.forEach(row => {

				if (row.date) {
					const formattedDate = formatDate(new Date(row.date), 'long');

					if (!groupedCases[formattedDate]) {
						groupedCases[formattedDate] = [];
					 }

					groupedCases[formattedDate].push(row);
				}
			});

			const sortedGroupedCases = Object.keys(groupedCases).sort((a, b) => new Date(b) - new Date(a)).reduce((acc, key) => {acc[key] = groupedCases[key]; return acc;}, {});

			const resultArray = Object.entries(sortedGroupedCases).map(([date, cases]) => ({ date, cases }));

			res.render('index', { title: 'UCSD Featured Crime Logs', items: resultArray });

		 } catch (err){
			 console.error(err);

		 } finally {

			client.release();
			pool.end();

		 }
	})();
});

module.exports = router;
