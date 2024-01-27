const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;
const { MongoClient } = require('mongodb');
const multer = require('multer');
const path = require('path')


const uri = "mongodb+srv://safeerlineage:oPD77sVdAzYRSRIp@travelappiu.9hyscl1.mongodb.net/?retryWrites=true&w=majority";
let db,users;


const client = new MongoClient(uri);
const dbConnect = async()=>{
    try{
        await client.connect();
        console.log("DB Connected Successfully");
        db = client.db('TravelDiariesIU')
         users = db.collection("users")

    }
    catch(error){
        console.log(error)
    }
}
dbConnect()
app.use(bodyParser.json());


app.post('/login',async(req,res)=>{
    const { email, password } = req.body;

    // Fetch user from the database based on the email
    const user = await db.collection('users').findOne({ mail: email });

    // If user not found or password doesn't match, return an error
    if (!user || !bcrypt.compareSync(password, user.pass)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // You can include additional checks or create a JWT token for authentication

    res.json({ message: 'Login successful' });
  });

app.post('/signup',async (req,res)=>{
    const {firstname,lastname,email,password}=req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const userCheck = await users.findOne({mail:email})
    var nullvalue;
    if(userCheck){
        return res.status(401).json({message:'User already Exists'})
    }

     await users.insertMany([
    {fname:firstname,lname:lastname,mail:email,pass:hashedPassword,username:'',image:'',caption:'',location:'',postImage:'',latitude:'',longitude:''  }
])
        

    res.json({ message: 'Registration successful'});
  });


  const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const originalname = file.originalname;
      cb(null, originalname);
    },
  });
  const upload = multer({ storage });

  // app.post('/profile', upload.single('profilePicture'), async (req, res) => {
  //   try {
     

  //     const profilePicture=req.file
  //     const { username, email} = req.body;
  //     // Update user profile information
  //     await users.updateOne({ mail:email }, { $set: { username:username,image:profilePicture} });

  //     res.status(200).json({ message: 'Profile setup complete' });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ error: 'Internal Server Error' });
  //   }
  // });
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Your existing profile update API endpoint
app.post('/profile', upload.single('profilePicture'), async (req, res) => {
  try {
    const profilePicture = req.file;
    const { username, email } = req.body;

    // Update user profile information
    await users.updateOne({ mail: email }, { $set: { username: username, image: profilePicture } });

    res.status(200).json({ message: 'Profile setup complete' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

  app.post('/journal',upload.single('postImage'),async (req,res)=>{
    try{
      const postImage=req.file

    const {caption,location,email}=req.body;
     const {latitude,longitude}=req.body;
      const floatedLatitude=parseFloat(latitude)
      const floatedLongitude=parseFloat(longitude)
    await users.updateOne({mail:email},{$set:{postImage:postImage,caption:caption,location:location,latitude:floatedLatitude,longitude:floatedLongitude}})
      res.status(200).json({message: 'Journal Added'});
  } catch(error){
    console.error(error);
    res.status(500).json({error:'Internal Server Error'})
  }}
  ) 

  app.get('/api/users', async (req, res) => {
    const usersFromDB = await db.collection('users').find().toArray();
    res.json({ users: usersFromDB });
  });


  const userRouter = express.Router();
  userRouter.get('/:email', async (req, res) => {
    try {
      const userEmail = req.params.email;
      console.log(userEmail)
      if (!userEmail) {
        return res.status(400).json({ error: 'Email parameter is required' });
      }

      const userFromDB = await users.findOne({ mail: userEmail });

      if (!userFromDB) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user: userFromDB });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Use the userRouter for requests to the /api/users/:email endpoint
  app.use('/api/users', userRouter);




app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
