import React, {useEffect, useState} from 'react';
import axios from "axios";
import {useNavigate, useParams} from "react-router-dom";

function Update() {

    const {id} = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:8000/student/read/'+id)
            .then(res => {
                setValues({...values, name: res.data[0]?.name,age: res.data[0]?.age})
            })
            .catch(err => console.log(err))
    }, []);

    const [values,setValues] = useState({
        name : '',
        age: ''
    })

    const handleUpdate = (event) => {
        event.preventDefault();
        axios.put('http://localhost:8000/student/update/'+id,values)
            .then(res => {
                navigate('/student')
            })
            .catch(err =>{
                console.log(err)
            })
    }

    return (
        <div className='d-flex vh-100 bg-primary justify-content-center align-items-center'>
            <div className='w-50 bg-white rounded p-3'>
                <form onSubmit={handleUpdate}>
                    <h2>Update Student</h2>
                    <div className='mb-2'>
                        <label htmlFor="">Name</label>
                        <input type="name" placeholder="Enter Name" className='form-control' value={values.name}
                               onChange={e => setValues({...values, name: e.target.value})}/>
                    </div>
                    <div className='mb-2'>
                        <label htmlFor="">Age</label>
                        <input type="age" placeholder="Enter Age" className='form-control' value={values.age}
                               onChange={e => setValues({...values, age: e.target.value})}/>
                    </div>
                    <button className='btn btn-success'>Update</button>
                </form>
            </div>
        </div>
    );

}

export default Update;