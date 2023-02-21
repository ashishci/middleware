import express from 'express';

const HOST = '0.0.0.0'
const PORT = 8080

const app = express();


app.get('/', (req, res) => {
    res.status(200).json({ data: 'I am alive' })
})

app.listen(PORT, HOST, () => {
    console.log(`listenting on ${HOST}:${PORT}`)
})
export { }
