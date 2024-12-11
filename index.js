let express = require("express");

let app = express();

let path = require("path");


const port = process.env.PORT || 3000;


app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, "public") ));


const knex = require("knex") ({
    client : "pg",
    connection : {
        host : process.env.RDS_HOSTNAME || "localhost",
        user : process.env.RDS_USERNAME || "testuser",
        password : process.env.RDS_PASSWORD || "test",
        database : process.env.RDS_DB_NAME || "BabyLogs",
        port : process.env.RDS_PORT || 5432,
        // ssl: { rejectUnauthorized: false } // Enable SSL for AWS RDS PostgreSQL
    }
})

app.get("/", (req, res) =>
{
    res.render("landing_page");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/", (req, res) => {
    res.send("Welcome to the Home Page!");
});

app.get("/Login", (req, res) => {
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

  // Route to Add new Log
app.post('/addLog', (req, res) => {
    // Extract form values from req.body
    const activity_id  = req.body.activity_id ; // Default to empty string if not provided; 
    const activity_date  = req.body.activity_date ; 
    const activity_notes  = req.body.notactivity_notes || ''; // Default to empty string if not provided
  
    // Insert the new volunteer into the database
    knex('baby_log')
      .insert({
       activity_id,
       activity_date,
       activity_notes 
      })
      .then(() => {
          res.redirect('/viewbabyLog'); // Redirect to the Home view page after adding
      })
      .catch(error => {
          console.error('Error adding Log', error);
          res.status(500).send('Internal Server Error');
      });
 });

 // Route to new user
 app.get('/addUser', (req, res) => {
    res.render('addUser', {error: "Passwords do not match. Please try again.", formSubmitted: false});
  });

// Route to Create new user
  app.post('/addUser', async (req, res) => {
    const username = req.body.username;
    const acc_first_name = req.body.acc_first_name;
    const acc_last_name  = req.body.acc_last_name ;
    const baby_name  = req.body.baby_name ;
    const password = req.body.password
    const confirm_password = req.body.confirm_password

    // checks to see if passwords match
    if (password !== confirm_password) {
      return res.status(400).render('newUser', { 
        user: {  
          username
        },
        error: "Passwords do not match. Please try again.",
        formSubmitted: true
      });
    }

    // adds the new user record to the database
    await knex('accounts').insert({ 
      username: username, 
      acc_first_name: acc_first_name,
      acc_last_name : acc_last_name ,
      baby_name : baby_name ,
      password: password })
      .then(() => {
    res.redirect('/')
    })
    .catch (error => {
        console.error("Error adding user:", error);
  })
});

app.get('/babyLog', (req, res) => {
    knex('baby_log')
        .select()
        // .where('user_id', user_id)
        .then(logs => {
            res.render('babyLog', { logs });
        })
        .catch(error => {
            console.error('Error fetching logs:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.get('/editLog/:id', (req, res) => {
    const id = req.params.id
    knex('baby_log')
        .join('activities', 'baby_log.activity_id', '=', 'activities.activity_id')
        .select(
            'activities.activity_description',
            'baby_log.activity_date',
            'baby_log.activity_notes'
        )
        .where('log_id', id)
        .then(logs => {
            res.render('/editLog', { logs });
        })
        .catch(error => {
            console.error('Error fetching logs:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.post('/editLog/:id', (req, res) => {
    const logId = req.params.id; // Extract the log ID from the URL
    const { activity_description, activity_date, activity_notes } = req.body; // Extract form data

    // Update the `baby_log` table
    knex('baby_log')
        .where('id', logId) // Match the log by ID
        .update({
            activity_id: knex('activities') // Update `activity_id` based on `activity_description`
                .select('activity_id')
                .where('activity_description', activity_description),
            activity_date, // Update the date
            activity_notes // Update the notes
        })
        .then(() => {
            // Redirect back to the main Baby Log page or a confirmation page
            res.redirect('/babyLog');
        })
        .catch(error => {
            console.error('Error updating log:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.post



app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
