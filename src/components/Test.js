import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

function Test() {
    const { id } = useParams(); // Grab the ID from URL parameters
    const [data, setData] = useState({ state: "Connecting API" }); // Initial state

    async function fetchStatus() {
        try {
            const response = await fetch(`/api/checkStatus/${id}`);
            const data = await response.json();
            setData(data); // Update the state with fetched data

        }
        catch (error) {
            console.error(error);
            setData({ state: "Failed to fetch data." }); // Set error state
        }
    }

    // Use Effect hook to fetch data on component mount and id change
    useEffect(() => {
        
        fetchStatus();
        
    }, [id]); // Dependency array: Fetch status when `id` changes

    return <div>
        {data["state"] === "SUCCESS" && 
            <div> 
                <a href={`/result/${data["result"]["filePath"]}`}>Download</a> 
                <p>{data["result"]["stdout"]}</p>
                <p>{data["result"]["err"]}</p>
            </div> 
        }
        {id}: {data["state"]} 
        </div>;
}

export default Test;
