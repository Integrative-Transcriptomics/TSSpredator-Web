import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

function Test() {
    const { id } = useParams(); // Grab the ID from URL parameters
    const [data, setData] = useState({ state: "Connecting API" }); // Initial state
    const [update, setUpdate] = useState(true);

   
    // Use Effect hook to fetch data on component mount and id change
    useEffect(() => {
        const fetchData = async () => {
        const response = await fetch(`/api/checkStatus/${id}`);
          const json = await response.json();
          setData(json);
            if (json["state"] === "SUCCESS") {
                setUpdate(false);
            }
        };
    
        if (update) {
            fetchData(); // Fetch data initially
            const intervalId = setInterval(() => {
                fetchData(); // Fetch data every 2 minutes
              }, 30000);
          
              return () => clearInterval(intervalId);
        }
        
      }, [id, update]); // Dependency array: Fetch status when `id` changes

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
