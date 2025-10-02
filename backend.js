const express = require('express')
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const PORT=process.env.PORT || 3001;

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
    empNo: { type: Number, required: true, unique: true },
    empName: { type: String, required: true },
    empSal: { type: Number, required: true },
}, {
    timestamps: false,
    versionKey: false,
});

const Employee = mongoose.model('Employee', employeeschema)

app.post('/api/employees', async (req, res) => {
    try {
        const employee = new Employee(req.body);
        const result = await employee.save();
        res.status(201).json({ message: 'Employee created successfully', data: result });
    }
    catch (err) {
        res.status(400).send({ message: err.message });
    }
});

app.get('/', (req, res) => {
    res.send('Welcome to my first page');
});

app.get('/api/employees', async (req, res) => {
    try {
        const employees = await Employee.find();
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' + error });
    }
});

app.get('/api/employees/:empNo', async (req, res) => {
    try {
        const empNo = parseInt(req.params.empNo);
        const employee = await Employee.findOne({ empNo });
        if (!employee)
            return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- YAHAN BADLAV KIYA GAYA HAI ---
app.delete('/api/employees/:empNo', async (req, res) => {
    try {
        const empNo = parseInt(req.params.empNo);
        // deleteOne() ke result ko check karein
        const result = await Employee.deleteOne({ empNo });
        
        // Agar deletedCount 0 hai, matlab employee nahi mila
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        // Agar delete ho gaya hai
        res.json({ message: 'Employee deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});


app.put('/api/employees/:empNo', async (req, res) => {
    try {
        const empNo = parseInt(req.params.empNo);
        const updatedemployees = await Employee.findOneAndUpdate(
            { empNo: empNo },
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

app.listen(PORT, () => {
    console.log(`Server is ready on http://localhost:${PORT}`);
});
