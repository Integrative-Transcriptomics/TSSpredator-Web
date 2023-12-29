import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Error from "./Main/Error";
import ScrollableTextComponent from "./Result/ScrollableText";

function StatusSite() {
    const { id } = useParams(); // Grab the ID from URL parameters
    const [data, setData] = useState({ state: "Connecting API" }); // Initial state
    const [update, setUpdate] = useState(true);
    const [ePopup, setEPopup] = useState(false);
    const eHeader ="ERROR";




   
    // Use Effect hook to fetch data on component mount and id change
    useEffect(() => {
        const fetchData = async () => {
        const response = await fetch(`/api/checkStatus/${id}`);
          const json = await response.json();
          setData(json);
            if (json["state"] !== "PENDING" && json["state"] !== "STARTED") {
                setUpdate(false);
                if (json["state"] === "INTERNAL_ERROR") {
                    console.log(data)
                    setEPopup(true);
                }
            }
            console.log(data)
        };
       
    
        if (update) {
            fetchData(); // Fetch data initially
            const intervalId = setInterval(() => {
                fetchData(); // Fetch data every 2 minutes
              }, 30000);
          
              return () => clearInterval(intervalId);
        }
        
      }, [id, update]); // Dependency array: Fetch status when `id` changes

      useEffect(() => {
        console.log(data)
    }, [data]);
    return (
     <>
      <header>
        <h1>TSSpredator</h1>
      </header>
      <div className='result-container' style={{height: "100%"}}>
        {data["state"] === "SUCCESS" && 
             <>
                <a href={`/result/${data["result"]["filePath"]}`}>Download</a> 
                <span style={{whiteSpace: "pre-line"}}>{data["result"]["stdout"]}</span>
             </>
            
        }
        {data["state"] === "INTERNAL_ERROR" &&
            <>
                <ScrollableTextComponent text={data["result"]["stderr"]}/>
                <ScrollableTextComponent text={data["result"]["stdout"]}/>
            </>
             
        }
        {ePopup && (
        <Error
          error={data["result"]["stderr"]}
          header={eHeader}
          onCancel={() => setEPopup(!ePopup)}
        />
      )}
        {id}: {data["state"]} 
        </div>
        </>)
}

export default StatusSite;
