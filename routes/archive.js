var express = require('express');
var router = express.Router();
// const { query, validationResult } = require('express-validator');
const { param, validationResult } = require('express-validator');

const validMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const monthMapping = {
    "Jan": 0,
    "Feb": 1,
    "Mar": 2,
    "Apr": 3,
    "May": 4,
    "Jun": 5,
    "Jul": 6,
    "Aug": 7,
    "Sep": 8,
    "Oct": 9,
    "Nov": 10,
    "Dec": 11
  };

/* GET users listing. */
router.get('/', function(req, res, next) {
    const {Pool, Client} = require('pg');

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

            const {rows} = await client.query(`SELECT DISTINCT month_year FROM case_logs;`);

            const convertToDate = (monthYear) => {
                const [month, year] = monthYear.split(' ');
                return new Date(year, monthMapping[month]);
            };
              
            rows.sort((a, b) => convertToDate(a.month_year) - convertToDate(b.month_year));

            const groupedData = rows.reduce((acc, item) => {
                const [month, year] = item.month_year.split(' ');

                if (!acc[year]) {
                    acc[year] = [];
                }

                acc[year].push(month);
                return acc;
            }, {});
  
            const result = Object.keys(groupedData).map(year => ({
                year: year,
                months: groupedData[year]
            }));

            res.render('archive', {grpd_data: result});            

        } catch (err){
            console.error(err);

        } finally {
            client.release();
            pool.end();

        }
    })();

 
//   res.render('archive');
});

router.get('/:year/:month', [
    param('year').isInt({ min: 1000, max: 9999 }).withMessage('Year must be a 4-digit integer').toInt(),
    param('month').toLowerCase().isIn(validMonths.map(month => month.toLowerCase())).withMessage(`Month must be one of ${validMonths.join(', ')}`)
    ], function(req, res, next) {

        const result = validationResult(req);

        if (!result.isEmpty()){
            res.send({ errors: result.array() });
            return;
        }

        let query_year = req.params.year;
        let query_month = req.params.month;

        if ( query_year < 2024 || query_year > 2024){
            res.render('404');
            return;
        }

        query_month = validMonths.find(m => m.toLowerCase() === query_month.toLowerCase());

        fullll = `${query_month} ${query_year}`

        console.log(fullll);

        fullll = fullll.toString();

        const {Pool, Client} = require('pg');

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

                const {rows} = await client.query(`SELECT * FROM case_logs WHERE interesting = true and month_year = '${fullll}';`);
 
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
 
                const sortedGroupedCases = Object.keys(groupedCases).sort((a, b) => new Date(b) - new Date(a)).reduce((acc, key) => {
                    acc[key] = groupedCases[key];
                    return acc;
                }, {});
 
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
