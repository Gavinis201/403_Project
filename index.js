let express = require("express");

let app = express();

let path = require("path");

const port = 3000;

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, "public") ));


const knex = require("knex") ({
    client : "pg",
    connection : {
        host : "localhost",
        user : "testuser",
        password : "test",
        database : "assignment3a",
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
