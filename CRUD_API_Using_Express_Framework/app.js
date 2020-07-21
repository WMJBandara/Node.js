const express = require('express');
const Joi = require('joi');
const app = express();
app.use(express.json());

const port = process.env.PORT || 3001;
const genres = [
    {id : 1, name : "Action" },
    {id : 2, name : "Adventure" },
    {id : 3, name : "Comedy" },
    {id : 4, name : "Crime" },
    {id : 5, name : "Drama" },
    {id : 6, name : "Fantasy" },
    {id : 7, name : "Historical" },
    {id : 8, name : "Historical fiction" },
    {id : 9, name : "Horror" },
    {id : 10, name : "Mystery" }
];

app.post('/api/genres', (req, res) => {
    const schema = {
        name : Joi.string().min(3).required()
    };
    var { error } = validateGenre(req.body);  
    if(error) return res.send(result.error.details[0].message);    
    const genre = {
        id  : genres.length + 1,
        name : req.body.name
    };
    genres.push(genre);
    res.send(genre);
});

app.put('/api/genres/:id', (req, res) => {
    const genre = genres.find( c => c.id == req.params.id);
    if(!genre) return res.status(404).send("Genre with given id connot find");
    var { error } = validateGenre(req.body);
    if(error) return res.send(error.details[0].message);
    genre.name = req.body.name;
    res.send(genre);
});

app.delete('/api/genres/:id', (req, res) => {
    const genre = genres.find( c => c.id == req.params.id);
    if(!genre) return res.status(404).send("The genre with given id connot find");    
    const index = genres.indexOf(genre);
    genres.splice(index, 1);
    res.send(genre);
});

app.get('/api/genres', (req, res) => {
    res.send(genres);
});

app.get('/api/genres/:id', (req, res) => {
    const genre = genres.find( c => c.id == req.params.id);
    if(!genre)  return res.status(404).send("The genre with given id connot find");
    res.send(genre);
});

function validateGenre(genre)
{
    const schema = {
        name :  Joi.string().min(3).required()
    };
    return Joi.validate(genre, schema);
}

app.listen(port, () => console.log(`Application listen to port ${port}....`));