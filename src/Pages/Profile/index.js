import React, { useState, useEffect } from 'react';
import Logout from '../../components/Logout';
import { Link, useParams } from "react-router-dom";



import axios from "axios";

import "./index.css";

const Profile = () => {

    const { userId } = useParams();
    console.log(userId)
    const [profile, setProfile] = useState({
        userName: 'Your Name',
        description: 'Please provide your bio data.',
        avatarImage: null,
        isEditing: false,
    });




    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // Fetch initial profile data from the server
                const response = await axios.get(`/api/auth/profile/${userId}`);
                const { userName, description, avatarImage, } = response.data;
                setProfile({ userName, description, avatarImage });
            } catch (error) {
                console.error("Error fetching profile data:", error);
                // Handle error (display error message to the user, etc.)
            }
        };

        // Call the fetchProfileData function when the component mounts
        fetchProfileData();
    }, [profile])

    const handleNameChange = (event) => {
        setProfile({ ...profile, userName: event.target.value });
    };

    const handleDescriptionChange = (event) => {
        setProfile({ ...profile, description: event.target.value });
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onloadend = () => {
                setProfile({ ...profile, avatarImage: reader.result });
            };

            reader.readAsDataURL(file);
        }
    };

    const handleEditClick = () => {
        setProfile({ ...profile, isEditing: true });
    };

    const handleSaveClick = async () => {
        try {
            // Send only the required fields to the server for updating the profile
            const { userName, description, avatarImage } = profile;
            const response = await axios.put(`/api/auth/updateprofile/${userId}`, { userName, description, avatarImage });
            console.log(response.data); // Log response from the server
            setProfile({ ...profile, isEditing: false });
        } catch (error) {
            console.error("Error updating profile:", error);
            // Handle error (display error message to the user, etc.)
        }
    };


    const { userName, description, avatarImage, isEditing } = profile;

    return (
        <div className='profile-container'>
            <div className='back-container'><Link to="/"><button>Back</button></Link></div>
            <div className='profile-image-container'>
                <img className='profile-pic' src={avatarImage} alt='Profile' />
                <h1 className='profile-name'>{userName}</h1>
                <p className='profile-description'>{description}</p>
                {isEditing ? (
                    <>
                        <p className='edit-profile' onClick={handleSaveClick}>
                            Save Profile
                        </p>
                        <input
                            className='profile-edit'
                            type='file'
                            accept='image/*'
                            onChange={handleImageChange}
                        />
                    </>
                ) : (
                    <p className='edit-profile' onClick={handleEditClick}>
                        Edit Profile
                    </p>
                )}
            </div>
            <div className='profile-form-container'>
                {isEditing && (
                    <>
                        <label>
                            <input
                                type='text'
                                value={userName}
                                onChange={handleNameChange}
                                className=''
                            />
                        </label>
                        <label>
                            <textarea
                                value={description}
                                onChange={handleDescriptionChange}
                                className=''
                            />
                        </label>
                    </>
                )}
            </div>
            <Logout />
        </div>
    );
};

export default Profile;
