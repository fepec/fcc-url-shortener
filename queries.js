const Pool = require('pg').Pool;
const dns = require('node:dns')


const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT
})

const getAllUrls = (req, res) => {
    pool.query('SELECT * FROM url_list ORDER BY id ASC', (error, results) => {
        if (error) {
            throw error
        }
        res.status(200).json(results.rows)
    })
}

const getUrlById = (req, res) => {
    try 
{    const id = parseInt(req.params.id)
    pool.query('SELECT * FROM url_list WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        if (results.rows.length !== 0) {
            res.redirect(results.rows[0].url)
        } else {
            res.json({
                error: "No short URL found for the given input"
            })
        }


    })} catch(error) {
        console.log(error.message)
    }

}

const createUrl = async (req, res) => {
    try {
        const { url } = req.body
        let existingUrl
        const validHost = await checkHost(url)
    
        pool.query('SELECT * FROM url_list WHERE url = $1', [url], (error, results) => {
            existingUrl = results.rows
        })

        console.log(existingUrl)

        pool.query('INSERT INTO url_list (url) VALUES ($1) RETURNING *', [url], (error, results) => {
            if (error) throw error

            res.status(201).json({
                original_url: results.rows[0].url,
                short_url: results.rows[0].id})
        })

    } catch (error) {
        console.log(error.message)
        if (error.code === 'ENOTFOUND') {
            res.json({
                error: 'invalid url'
            })
        } else {

            res.status(500).json({
                message: "Internal Server Error",
            })
        }
    }
}

const deleteUrl = (req, res) => {
    const id = parseInt(req.params.id)

    pool.query('DELETE FROM url_list WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        res.status(200).send(`User deleted with ID: ${id}`)
    })
}

async function checkHost(url) {
    return new Promise((resolve, reject) => {
        dns.lookup(url, (err, address) => {
            if (err) reject(err);
            resolve(address);
        });
    });
}

module.exports = {
    getAllUrls,
    getUrlById,
    createUrl,
    deleteUrl,
}