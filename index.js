
let express = require("express");

let app = express();

let path = require("path");

const port = 5002;


app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({extended: true}));

app.use(express.static('public'));

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
    res.render("landing_page");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
