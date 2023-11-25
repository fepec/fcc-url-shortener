const Pool = require('pg').Pool;
const dns = require('node:dns');
const validUrl = require('valid-url');

const dnsPromises = dns.promises

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
    try {
        const id = parseInt(req.params.id)
        pool.query('SELECT * FROM url_list WHERE id = $1', [id], (error, results) => {
            if (error) throw error

            if (results.rows.length !== 0) {
                res.redirect(results.rows[0].url)
            } else {
                res.json({
                    error: "No short URL found for the given input"
                })
            }
        })
    } catch (error) {
        console.log(error.message)
    }

}

const createUrl = async (req, res) => {
    try {
        const { url } = req.body
        let existingUrl

        // check if URL is well formed
        let checkedUrl = validUrl.isUri(url);
        if (!checkedUrl) {
            throw new Error('Invalid URL')
        }

        // check if host is valid
        let u = new URL(checkedUrl)
        await dnsPromises.lookup(u.hostname).catch(() => {
            throw new Error('Invalid Hostname')
            })
        
        // if (!isValidUrlAndHost(url).isValid) {
        //     throw new Error(isValidUrlAndHost(url).error.message)
        // }

        // check if url already in database
        pool.query('SELECT * FROM url_list WHERE url = $1', [url], (error, results) => {
            existingUrl = results.rows
        })

        console.log(existingUrl) // DEBUG

        // insert new record
        pool.query('INSERT INTO url_list (url) VALUES ($1) RETURNING *', [url], (error, results) => {
            if (error) throw error

            res.status(201).json({
                original_url: results.rows[0].url,
                short_url: results.rows[0].id
            })
        })

    } catch (error) {
            res.json({
                error: error.message
            })
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

async function isValidUrlAndHost(url) {
    let isValid = {}
    let checkedUrl = validUrl.isUri(url);
    if (!checkedUrl) {
        isValid = {
            isValid: false,
            error: { message: "Invalid URL" }
        }
        return isValid
    }

    if (checkedUrl) {
        let u = new URL(checkedUrl)
        isValid = await dnsPromises.lookup(u.hostname).then(result => {
            return {
                isValid: true,
                address: result.address
            }
        }).catch(() => {
            return {
                isValid: false,
                error: {
                    message: "Invalid Host",
                    code: "ENOTFOUND"
                }
            }
        })
    }
    return isValid
}



module.exports = {
    getAllUrls,
    getUrlById,
    createUrl,
    deleteUrl,
}