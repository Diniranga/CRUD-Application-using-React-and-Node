import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = 7000;

app.use(cors());
app.use(express.json());

// MongoDB connection URL
const mongoURL = 'mongodb://127.0.0.1:27017/Users';

mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define a Mongoose schema for your 'user' collection
const userSchema = new mongoose.Schema({
    userID: String,
    name: String,
    address: String,
    phoneNumber: String,
});

const User = mongoose.model('User', userSchema);

// Routes for the 'user' resource

app.get('/users/read', (req, res) => {
    User.find({})
        .then((result) => {
            if (result.length === 0) {
                return res.status(404).json({ message: 'No users found' });
            }
            return res.json(result);
        })
        .catch((err) => {
            return res.status(500).json({ message: 'Server error' });
        });
});

app.get('/users/check/:userID', (req, res) => {
    const { userID } = req.params;

    User.findOne({ userID: userID })
        .then((result) => {
            if (!result) {
                return res.json(false); // User with the specified ID does not exist
            }
            return res.json(true); // User with the specified ID exists
        })
        .catch((err) => {
            return res.status(500).json({ message: 'Server error' });
        });
});


// Add a new user
app.post('/users/add', async (req, res) => {
    const { name, address, phoneNumber } = req.body;

    try {
        // Find the last user in the database to determine the next user ID
        const lastUser = await User.findOne({}, {}, { sort: { 'userID': -1 } });

        let nextUserID = 'U1';
        if (lastUser && lastUser.userID) {
            const lastUserID = lastUser.userID;
            const numericPart = parseInt(lastUserID.substring(1));
            nextUserID = 'U' + (numericPart + 1);
        }

        // Create a new User instance with the generated user ID
        const newUser = new User({
            userID: nextUserID,
            name,
            address,
            phoneNumber,
        });

        // Save the new user to the database
        const savedUser = await newUser.save();

        return res.status(201).json(savedUser);
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
});

app.put('/users/update/:userID', async (req, res) => {
    const { userID } = req.params;
    const { name, address, phoneNumber } = req.body;

    try {
        // Find the user with the given userID
        const existingUser = await User.findOne({ userID });

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found with id: '+ userID });
        }

        // Update the user's information
        existingUser.name = name;
        existingUser.address = address;
        existingUser.phoneNumber = phoneNumber;

        // Save the updated user to the database
        const updatedUser = await existingUser.save();

        return res.status(200).json(updatedUser);
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
});


app.delete('/users/delete/:userID', async (req, res) => {
    const userID = req.params.userID;

    try {
        // Find and delete the user with the specified ID
        const deletedUser = await User.findOneAndDelete({ userID: userID });

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found'});
        }

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
});
app.listen(PORT, () => {
    console.log(`User Server is listening on port ${PORT}`);
});
