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
        user : process.env.RDS_USERNAME || "postgres",
        password : process.env.RDS_PASSWORD || "Gavin12",
        database : process.env.RDS_DB_NAME || "baby",
        port : process.env.RDS_PORT || 5432,
        
    }
})

app.get("/", (req, res) =>
{
    res.render("landing_page");
});

app.get("/login", (req, res) => {
  const error = req.query.error;
  security = false;
  res.render("login", { error });res.render("login");
});

// Route to login to administrator side
// Compares username and password
app.post('/login', async (req, res) => {
  const { UserName, Password } = req.body;

  try {
    // Fetch the user by username
    const user = await knex('accounts')
      .select('*')
      .where({ UserName })
      .first(); // Fetch the first matching record

    if (!user) {
      // If no matching user is found
      console.log('No user found with username:', UserName); // Debugging line
      return res.redirect('/loginPage?error=invalid_credentials');
    }

    if (Password === user.password) {
      // Passwords match
      security = true;
      return res.redirect('/view');
    } else {
      // Passwords don't match
      security = false;
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
app.get('/addLog', (req, res) => {
    if (security == false) {
        // Return to Login screen
        return res.redirect('/login');
      }
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
    res.redirect('/landing_page')
    })
    .catch (error => {
        console.error("Error adding user:", error);
  })
});


app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
