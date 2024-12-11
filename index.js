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

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const authenticateUser = (req, res, next) => {
    // Check if the user_id cookie exists
    const userId = req.cookies['user_id'];
  
    if (!userId) {
      return res.redirect('/login?error=not_authenticated'); // Redirect if not authenticated
    }
  
    // You can use the userId to fetch the user data from the database, if needed
    req.user_id = userId;
    next(); // Allow the request to proceed
  };
  

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
      return res.status(400).send('Username and password are required.');
    }
  
    try {
      // Fetch the user by username
      const user = await knex('accounts')
        .select('*')
        .where({ username })
        .first(); // Fetch the first matching record
  
      if (!user || password !== user.password) {
        // If no matching user or incorrect password
        return res.redirect('/login?error=invalid_credentials');
      }
  
      // Store user information in a cookie
      res.cookie('user_id', user.user_id, { httpOnly: true, maxAge: 3600000 }); // Expires in 1 hour
  
      console.log('Login was successful');
      res.redirect('/babyLog'); // Redirect to a protected route after successful login
    } catch (error) {
      console.error('Error during login:', error.message);
      return res.status(500).send('An error occurred. Please try again later.');
    }
  });
  


// Route to populate add Log dropdown
app.get('/addLog', authenticateUser, (req, res) => {
    const { success } = req.query; 
    const user_id = req.cookies.user_id;
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
  app.post('/addLog', authenticateUser, (req, res) => {
    // Extract form values from req.body
    const activity_id = req.body.activity_id; 
    const activity_date = req.body.activity_date; 
    const activity_notes = req.body.activity_notes || ''; // Default to empty string if not provided
    const user_id = req.cookies.user_id;
  
    // Log the values to ensure they are being received correctly
    console.log({ activity_id, activity_date, activity_notes, user_id });
  
    if (!activity_id || !activity_date || !user_id) {
      return res.status(400).send('All fields are required.');
    }
  
    // Insert the new log into the database
    knex('baby_log')
      .insert({
        user_id: user_id,
        activity_id: activity_id,
        activity_date: activity_date,
        activity_notes: activity_notes
      })
      .then(() => {
        res.redirect(`/babyLog`); // Redirect to the Home view page after adding
      })
      .catch(error => {
        console.error('Error adding Log:', error);
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

  try {
    // Insert the new user record
    await knex('accounts').insert({ 
      username, 
      acc_first_name,
      acc_last_name,
      baby_name,
      password 
    });
  
    // Retrieve the newly created user from the database
    const user = await knex('accounts')
      .select('*')
      .where({ username })
      .first();
  
    if (!user) {
      throw new Error('User not found after creation.');
    }
  
    // Store user information in a cookie and redirect
    res.cookie('user_id', user.user_id, { httpOnly: true, maxAge: 3600000 }); // 1-hour expiration
    res.redirect('/babyLog');
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).render('newUser', { 
      user: { username }, 
      error: "There was an error creating your account. Please try again.", 
      formSubmitted: true 
    });
  }
});

//Route to access baby Log landing page
app.get('/babyLog', authenticateUser, (req, res) => {
    const user_id = req.user_id;
    const activityFilter = req.query.activity || ''; // Get the activity filter from the query parameter, default to an empty string if not provided

    let query = knex('baby_log')
        .join('activities', 'baby_log.activity_id', '=', 'activities.activity_id')
        .select(
            'baby_log.user_id',
            'baby_log.log_id',
            'activities.activity_id',
            'activities.activity_description as activity',
            'baby_log.activity_date',
            'baby_log.activity_notes'
        )
        .where('baby_log.user_id', user_id);

    if (activityFilter) {
        query = query.andWhere('activities.activity_description', activityFilter);
    }

    query.orderBy('baby_log.activity_date', 'asc')
        .then(logs => {
            // Fetch distinct activities for the filter dropdown
            return knex('activities').distinct('activity_description').then(activities => {
                res.render('babyLog', { logs, activities, selectedActivity: activityFilter });
            });
        })
        .catch(error => {
            console.error('Error fetching logs:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.get('/editLog/:id', authenticateUser, (req, res) => {
    const logId = req.params.id;

    // Fetch log data for the provided logId
    knex('baby_log')
    .join('activities', 'baby_log.activity_id', '=', 'activities.activity_id')
    .select(
        'baby_log.log_id',
        'activities.activity_id',
        'activities.activity_description as activity',
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
                res.render('editLog', { log, activities });
            });
    })
    .catch(error => {
        console.error('Error fetching log:', error);
        res.status(500).send('Internal Server Error');
    });
});

app.post('/editLog/:id', authenticateUser, (req, res) => {
    const logId = req.params.id; // Extract the log ID from the URL
    const { activity_id, activity_date, activity_notes } = req.body; // Extract form data

    // Update the `baby_log` table with the new values
    knex('baby_log')
        .where('log_id', logId)
        .update({
            activity_id, // Use the selected activity_id directly
            activity_date, // Update the date
            activity_notes // Update the notes
        })
        .then(() => {
            // Redirect back to the main Baby Log page
            res.redirect('/babyLog');
        })
        .catch(error => {
            console.error('Error updating log:', error);
            res.status(500).send('Internal Server Error');
        });
});


app.post('/logout', (req, res) => {
    res.clearCookie('user_id'); // Clear the user cookie
    res.redirect('/'); // Redirect to the home page or login page
  });

//Route to delete log
  //Route to delete log
  app.post("/deleteLog/:log_id", authenticateUser, (req, res) => {
    const log_id = req.params.log_id;  
        //Delete the log
        return knex("baby_log")
          .where("log_id", log_id)
          .del()
          .then(() => {
            res.redirect(`/babyLog`);
          })
      .catch(err => {
        console.error("Error deleting Log:", err);
        res.status(500).json({ error: "Unable to delete the log. Please try again." });
    });
})

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));

