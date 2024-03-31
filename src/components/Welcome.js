import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Loader from "./Loader";

export default function Welcome() {
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
        if (userData && userData.username) {
          setUserName(userData.username);
        } else {
          throw new Error("User data not found in localStorage");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Handle the error, e.g., show an error message to the user
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <Container>
      {loading ? (
        <Loader />
      ) : (
        <>
          <h1>
            Welcome, <span>{userName}!</span>
          </h1>
          <h3>Please select a chat to start messaging.</h3>
        </>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  flex-direction: column;

  span {
    color: #4e0eff;
  }
`;