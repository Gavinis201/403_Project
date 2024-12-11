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
        user : process.env.RDS_USERNAME || "intex",
        password : process.env.RDS_PASSWORD || "password",
        database : process.env.RDS_DB_NAME || "project_3_v2",
        port : process.env.RDS_PORT || 5432,
        // ssl: { rejectUnauthorized: false } // Enable SSL for AWS RDS PostgreSQL
    }
})

app.get("/", (req, res) =>
{
    res.render("landing_page");
});

app.get("/login", (req, res) => {
  const error = req.query.error;
  security = false;
  res.render("login", { error });
});

// Route to login to administrator side
// Compares username and password
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Check for missing fields
  if (!username || !password) {
    return res.status(400).send('Username and password are required. Why though?');
  }

  try {
    // Fetch the user by username
    const user = await knex('accounts')
      .select('*')
      .where({ username })
      .first(); // Fetch the first matching record

    if (!user) {
      // If no matching user is found
      console.log('No user found with username:', username);
      return res.redirect('/login?error=invalid_credentials');
    }

    if (password === user.password) {
      // Passwords match
      console.log('Login was successful');
      res.redirect(`/babyLog/${user.user_id}`);
    } else {
      // Passwords don't match
      console.log('Password does not match user', username);
      return res.redirect('/login?error=invalid_credentials');
    }
  } catch (error) {
    // Handle any errors during the database query or password comparison
    console.error('Error during login:', error.message);
    return res.status(500).send('An error occurred. Please try again later.');
  }
});


// Route to populate add Log dropdown
app.get('/addLog/:user_id', (req, res) => {
    const { success } = req.query; 
    const user_id = req.params.user_id;
    // Fetch types to populate the dropdown
    knex('activities')
      .select('activity_id', 'activity_description')
      .then(activity_types => {
            // Render the add form with the activity type
            const currentDate = new Date();
            const localDate = currentDate.toLocaleDateString('en-US', {
              timeZone: 'America/Denver', // Utah's time zone
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
          });
            res.render('addLog', { activity_types, localDate, user_id });
        })

        .catch(error => {
            console.error('Error fetching activity types:', error);
            res.status(500).send('Internal Server Error');
    });
});

  // Route to Add new Log
app.post('/addLog/:user_id', (req, res) => {
    // Extract form values from req.body
    const activity_id  = req.body.activity_id ; // Default to empty string if not provided; 
    const activity_date  = req.body.activity_date ; 
    const activity_notes  = req.body.activity_notes || ''; // Default to empty string if not provided
    const user_id = req.params.user_id;

    console.log(activity_id, activity_date, activity_notes, user_id);
  
    // Insert the new volunteer into the database
    knex('baby_log')
      .insert({
       user_id: user_id,
       activity_id: activity_id,
       activity_date: activity_date,
       activity_notes: activity_notes
      })
      .then(() => {
          res.redirect(`/babyLog/${user_id}`); // Redirect to the Home view page after adding
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

app.get('/babyLog/:user_id', (req, res) => {
  const user_id = req.params.user_id;

    knex('baby_log')
        .where('user_id', user_id)
        .join('activities', 'baby_log.activity_id', '=', 'activities.activity_id')
        .then(logs => {
            // Format the activity_date before sending to the template
            const formattedLogs = logs.map(log => ({
              ...log,
              activity_date: new Intl.DateTimeFormat('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
              }).format(new Date(log.activity_date))
          }));

          res.render('babyLog', { logs: formattedLogs, user_id });
        })
        .catch(error => {
            console.error('Error fetching logs:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.get('/editLog/:id', (req, res) => {
    const logId = req.params.id;

    // Fetch log data for the provided logId
    knex('baby_log')
        .join('activities', 'baby_log.activity_id', '=', 'activities.activity_id')
        .select(
            'baby_log.log_id',
            'activities.activity_id', // Make sure to fetch the activity_id for later use
            'activities.activity_description',
            'baby_log.activity_date',
            'baby_log.activity_notes'
        )
        .where('baby_log.log_id', logId)
        .first()
        .then(log => {
            // Fetch all activities for the dropdown
            knex('activities').select('activity_id', 'activity_description')
                .then(activities => {
                    // Render the edit log page with the log data and available activities
                    res.render('editLog', { log, activities, logId });
                })
        })
        .catch(error => {
            console.error('Error fetching log:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.post('/editLog/:id', (req, res) => {
    const logId = req.params.id; // Extract the log ID from the URL
    const activity_id = req.body.activity_id;
    const activity_date = req.body.activity_date;
    const activity_notes = req.body.activity_notes;


            // Update the `baby_log` table with the new values
            knex('baby_log')
                .where('log_id', logId)
                .update({
                    activity_id: activity_id, // Set the correct activity_id
                    activity_date: activity_date, // Update the date
                    activity_notes: activity_notes // Update the notes
                })
                .then(() => {

                  knex('baby_log')
                  .where('log_id', logId)
                  .first()
                  .then(log => {
                    res.redirect(`/babyLog/${log.user_id}`);
                  })
                })
                .catch(error => {
                    console.error('Error updating log:', error);
                    res.status(500).send('Internal Server Error');
                });
        })

//Route to delete log
app.post("/deleteLog/:log_id", (req, res) => {
  const log_id = req.params.log_id;  

  knex("baby_log")
    .where("log_id", log_id)
    .select("user_id") // We only need the user_id
    .first() // Get the first (and only) result
    .then(log => {
      if (!log) {
        console.error("Log not found for log_id:", log_id);
        return res.status(404).json({ error: "Log not found" });
      }

      //Delete the log
      return knex("baby_log")
        .where("log_id", log_id)
        .del()
        .then(() => {
          res.redirect(`/babyLog/${log.user_id}`);
        });
    })
    .catch(err => {
      console.error("Error deleting Log:", err);
      res.status(500).json({ error: "Unable to delete the log. Please try again." });
    });
});

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
