import express from 'express'

const port = process.env.PORT || 8080

const app = express()

app.get('/', (req, res) => res.json({ message: "hellow world" }))

app.listen(port, () => console.log(`Server is listening on port ${port}`))
