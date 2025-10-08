const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const PORT=process.env.PORT || 3001;
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

app.use(cors());
app.use(express.json());

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('MongoDB Atlas connected');
    }
    catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
}

connectDB();


const employeeschema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    empNo: { type: Number, required: true },
    empName: { type: String, required: true },
    empSal: { type: Number, required: true },
}, {
    timestamps: false,
    versionKey: false,
});

const Employee = mongoose.model('Employee', employeeschema);


const userSchema=new mongoose.Schema({
    userName:{type: String,required:true,unique:true},
    password: {type: String,required:true}
});
userSchema.pre("save",async function(next){
    if(this.isModified("password")){
        this.password=await bcrypt.hash(this.password, 10);
    }
    next();
});
const User = mongoose.model("User",userSchema);


const auth = (req, res, next) => {
  const token = req.headers["authorization"];
  if(!token) return res.status(401).json({ error: "Access denied" });

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch(err) {
    res.status(400).json({ error: "Invalid token" });
  }
};


app.post("/register", async (req, res) => {
  try {
    const { userName, password } = req.body;
    const user = new User({ userName, password });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ error: "Username already exists" });
  }
});


app.post("/login", async (req, res) => {
  try {
     
    console.log("JWT Secret being used by server:", process.env.JWT_SECRET);

    const { userName, password } = req.body;
    const user = await User.findOne({ userName });
    if(!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) return res.status(400).json({ error: "Incorrect password" });

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch(err) {
    res.status(500).json({ error: "Server error" });
  }
});


app.post('/api/employees', auth, async (req, res) => {
    try {
        const employee = new Employee({ ...req.body, userId: req.user.id });
        const result = await employee.save();
        res.status(201).json({ message: 'Employee created successfully', data: result });
    }
    catch (err) {
        res.status(400).send({ message: err.message });
    }
});

app.get('/api/employees', auth, async (req, res) => {
    try {
        const employees = await Employee.find({ userId: req.user.id });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' + error });
    }
});

app.get('/api/employees/:empNo', auth, async (req, res) => {
    try {
        const empNo = parseInt(req.params.empNo);
        const employee = await Employee.findOne({ empNo, userId: req.user.id });
        if (!employee)
            return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

app.delete('/api/employees/:empNo', auth, async (req, res) => {
    try {
        const empNo = parseInt(req.params.empNo);
        const result = await Employee.deleteOne({ empNo, userId: req.user.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

app.put('/api/employees/:empNo', auth, async (req, res) => {
    try {
        const empNo = parseInt(req.params.empNo);
        const updatedemployees = await Employee.findOneAndUpdate(
            { empNo, userId: req.user.id },
            req.body, {
            new: true,
            runValidators: true
        });
        if (!updatedemployees)
            return res.status(404).json({ message: 'Employee not found' });
        res.status(200).json({ message: 'Employee updated Successfully', data: updatedemployees });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('Welcome to my first page');
});

app.listen(PORT, () => {
    console.log(`Server is ready on http://localhost:${PORT}`);
});
