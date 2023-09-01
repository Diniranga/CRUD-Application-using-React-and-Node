import React, {useState} from 'react';
import axios from "axios";
import {useNavigate} from "react-router-dom";

function Create(){
    const [values,setValues] = useState({
        name : '',
        age: ''
    })

    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('http://localhost:8000/student/add',values)
            .then(res=> {
                navigate('/student');

            })
            .catch(err => console.log(err))
    }
    return (
        <div className='d-flex vh-100 bg-primary justify-content-center align-items-center'>
            <div className='w-50 bg-white rounded p-3'>
                <form onSubmit={handleSubmit}>
                    <h2>Add Student</h2>
                    <div className='mb-2'>
                        <label htmlFor="">Name</label>
                        <input type="name" placeholder="Enter Name" className='form-control'
                        onChange={e => setValues({...values, name: e.target.value})}/>
                    </div>
                    <div className='mb-2'>
                        <label htmlFor="">Age</label>
                        <input type="age" placeholder="Enter Age" className='form-control'
                               onChange={e => setValues({...values, age: e.target.value})}/>
                    </div>
                    <button className='btn btn-success'>Add</button>
                </form>
            </div>
        </div>
    );
}
export default Create;