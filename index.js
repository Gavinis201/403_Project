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


// Route to populate add Log dropdown
app.get('/addLog', (req, res) => {
    const { success } = req.query; 
    // Fetch types to populate the dropdown
    knex('activities')
      .select('activity_id', 'activity_description')
      .then(activity_types => {
            // Render the add form with the activity type
            res.render('addLog', { activity_types });
        })

        .catch(error => {
            console.error('Error fetching activity types:', error);
            res.status(500).send('Internal Server Error');
    });
});

// Route to Create new log
app.post('/addLog', (req, res) => {
    // Extract form values from req.body
    const activity = req.body.activity; // Default to empty string if not provided; 
    const date = req.body.date; 
    const notes = req.body.notes || ''; // Default to empty string if not provided
  
    // Insert the new log into the database
    knex('BabyLog')
      .insert({
       activity,
       date,
       notes
      })
      .then(() => {
          res.redirect('/viewbabyLog'); // Redirect to the Home Baby Log page after adding
      })
      .catch(error => {
          console.error('Error adding Log', error);
          res.status(500).send('Internal Server Error');
      });
 });

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
