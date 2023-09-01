import React, {useEffect, useState} from 'react';
import {Link, useParams} from "react-router-dom";
import axios from "axios";

function Read() {
    const {id} = useParams();
    const [student,setStudent] = useState([])
    useEffect(() => {
        axios.get('http://localhost:8000/student/read/'+id)
            .then(res => {
                setStudent(res.data)
            })
            .catch(err => console.log(err))
    }, []);

    const [values,setValues] = useState({
        name : '',
        age: ''
    })

    return (
        <div className='d-flex vh-100 bg-primary justify-content-center align-items-center'>
            <div className='w-50 bg-white rounded p-3'>
                <h2>Student Details</h2><hr/>
                <h2> ID: {student[0]?.id}</h2>
                <h2> NAME: {student[0]?.name}</h2>
                <h2> AGE: {student[0]?.age}</h2><hr/>
                <Link to='/student' className='btn btn-primary me-2'>Back</Link>
                <Link to={`/edit/${student[0]?.id}`} className='btn btn-info'>Edit</Link>
            </div>
        </div>
    );
}

export default Read;