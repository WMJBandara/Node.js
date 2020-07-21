const express = require('express');
const redis = require('redis');
const Joi = require('joi');
const async = require('async');
const exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.engine('hbs', exphbs({ 
    extname:'hbs', 
    defaultLayout: 'layout', 
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials'
}));
app.set('view engine', 'hbs');
app.use(express.static('views'));
const port = process.env.PORT || 3001;
const redis_port = process.env.REDIS_PORT || 6379;
const redis_cli = redis.createClient(redis_port);

const genres = [
    {id : "ACT", name : "Action" },
    {id : "ADV", name : "Adventure" },
    {id : "COM", name : "Comedy" },
    {id : "CRM", name : "Crime" },
    {id : "DRM", name : "Drama" },
    {id : "FAN", name : "Fantasy" },
    {id : "HIS", name : "Historical" },
    {id : "HFIC", name : "Historical fiction" },
    {id : "HOR", name : "Horror" },
    {id : "MYS", name : "Mystery" }
];

//rendering views
app.get('/api/genres/create-new-genre', (req, res) => {
    res.render('genre', {genres_types : genres, title : "Create a new genre"});
});

//rendering views
app.get('/', (req, res) => {
    res.render('home', {genres_types : genres, title : "Welcome to my express handlebars tutorial."});
});

//Post new genre to redis
app.post('/api/genres', (req, res) => {
    console.log(req.body);
     var { error } = validateGenre(req.body);
     if(error) return res.send(error.details[0].message); 
    const genre = {
        'Id' : req.body.Id,
        'Name' : req.body.Name,
        'CreatedDate' : new Date().toISOString()
    };
    redis_cli.hmset('Genres_' + req.body.Type + "_" + req.body.Id, genre, (err, obj) => {
        if(err) return  res.send(err);
        else return res.render('item', {genre : genre, title : 'Genre has been successfully created...!'});
    });
});

// Update genre by id
app.put('/api/genres/:id', (req, res) => {
    redis_cli.hgetall('Genres_' + req.body.Type + "_" + req.body.Id, (err, value) => {
        if(err) return res.send(err);
        else
        {
             const obj = {
                 'Name' : req.body.Name,
                 'Id' : req.params.id
             };            
            var { error } = validateGenre(obj);
            if(error) return res.send(error.details[0].message);
            redis_cli.hmset("Genres_" + value.Id, obj, (error, result)=>{
                if(error) return res.send(error);
                else return res.send(result);
            });
        }
    });
});

// filter by Genre type Ex : ACT - Action, COM - Comedy, DRM - Drama ex...
app.get('/api/genres/', (req, res) => {
    console.log(req.query.Type  + " " + req.query.id);
    var search_query = 'Genres_';
    if(req.query.Type)
    search_query = req.query.Type + "_";
    
    if(req.query.id)        
    search_query += req.query.id;

    redis_cli.keys(search_query + '*', (err, keys) => {
        if(err) return res.send(err);
        else
        {
            async.map(keys, (key, callback) => {
                redis_cli.hgetall(key, (error, obj) => {
                    if(error) return res.send(error);
                    else
                    {
                        callback(null, obj);
                    }
                });
            },
            (error, results) => {
                if(error) return res.send(error);
                else return res.render('list', {searchvalue : req.params.id, genres_types : genres, genres : results, title : `All genres in ${req.params.genre_type} type` });
            });
        }
    });
});

//Genre delete by id and return deleted item
app.delete('/api/genres/:id', (req, res) => {
    const genre = "";
    redis_cli.hgetall('Genres_' + req.body.Type + "_" + req.params.id, (err, obj) => {
        if(err) return res.status(404).send("The genre with given id connot find");  
        else {
            redis_cli.del("Genres_" + req.params.id, (error, result) => {
                if(error) return res.send(error);
                else return res.send(obj);
            });
        }
    });
});

//Get all are availlable genres 
// app.get('/api/genres', (req, res) => {   
//     redis_cli.keys("Genres_*", (err, keys) =>{
//         if(err) return res.send(err);
//         else
//         {
//             async.map(keys, function(key, cb){
//                 redis_cli.hgetall(key, (error, value) => {
//                     if(error) return res.send(error);
//                     else
//                     {
//                         cb(null, value);
//                     }
//                 });
//             },
//             function(error, results) {
//                 if(error) return res.send(error);
//                 else return res.render('list', { title : 'Genre List', genres : results, genres_types : genres});
//             });
//         }
//     });
// });

//Get Genre by Id
app.get('/api/genres/:type:id', (req, res) => {
    console.log('Jaya' + req.params.type + "_" + req.params.id);
    redis_cli.hgetall("Genres_" + req.params.type + "_" + req.params.id, (err, obj) => {
        if(err) return res.send(err);
        else
        {
            //obj.Id = req.params.id;    
            console.log(obj);        
            return res.render('item', { genre : obj, title : 'Genre details page'});
        }            
    });
});

function validateGenre(genre)
{
    const schema = {
        Id : Joi.string().min(3).required(),
        Name : Joi.string().min(3).required(),
        Type: Joi.string().min(3).required()
    };
    return Joi.validate(genre, schema.unknow());
}

app.listen(port, () => console.log(`Application listen to port ${port}....`));