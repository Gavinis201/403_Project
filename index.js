
let express = require("express");
let app = express();
let path = require("path");
const port = 5000;
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
const knex = require("knex") ({
    client : "pg",
    connection : {
        host : "localhost",
        user : "postgres",
        password : "admin",
        database : "mycompany", 
        port : 5432
    }
})
app.get("/", (req, res) =>
{
    knex.select().from('pokemon').orderBy('description').then( pokes => {
        res.render("index", { pokemon: pokes });
    }).catch(err => {
        console.log(err);
        res.status(500).json({err});
    });
});
app.listen(port, () => console.log("Express App has started and server is listening!"))
