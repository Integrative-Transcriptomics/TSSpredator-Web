import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Error from "./Main/Error";
import ScrollableTextComponent from "./Result/ScrollableText";
import Header from "./Main/Header";

function StatusSite() {
  const { id } = useParams(); // Grab the ID from URL parameters
  const [data, setData] = useState({ state: "Connecting API" }); // Initial state
  const [update, setUpdate] = useState(true);
  const [ePopup, setEPopup] = useState(false);
  const eHeader = "ERROR";





  // Use Effect hook to fetch data on component mount and id change
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`/api/checkStatus/${id}`);
      // If response is 404, set state to "NOT_FOUND"
      if (response.status === 404) {
        setData({ state: "NOT_FOUND" });
        setUpdate(false);
      }
      const json = await response.json();
      console.log(json);

      setData(json);

      if (json["state"] !== "RUNNING" && json["state"] !== "STARTED" && json["state"] !== "PROCESSING_RESULTS") {
        setUpdate(false);
        if (json["state"] === "INTERNAL_ERROR") {
          setEPopup(true);
        }
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

  useEffect(() => {
    console.log(data)
  }, [data]);
  return (
    <>
      <Header />


      <div className='result-container' style={{
        display: 'flex',
        flexDirection: 'column', // Stack children vertically
        alignItems: 'center',    // Center children horizontally
        height: "100%",
      }}>



        <div className='result-header' style={{
          display: 'flex',
          flexDirection: 'row', // Elements side by side
          justifyContent: 'space-around', // Evenly distribute horizontal space
          alignItems: 'center',  // Center children vertically in the row
          width: '60%', // Take the full width of the parent
        }}>
          <div className='result-header-left' style={{ display: "flex", flexDirection: "row", alignItems: "flex-end" }}>
            <p className='header status' style={{ margin: 0, marginRight: "0.5em" }}>Project name:</p>
            <span className='row'>{data['projectName']}</span>
          </div>
          <div className='result-header-left' style={{ display: "flex", flexDirection: "row", alignItems: "flex-end" }}>
            <p className='header status' style={{ margin: 0, marginRight: "0.5em" }}>ID:</p>
            <span className='row'>{id}</span>
          </div>
          <div className='result-header-left' style={{ display: "flex", flexDirection: "row", alignItems: "flex-end" }}>

            <p className='header' style={{ margin: 0, marginRight: "0.5em" }} >Status:</p>
            <span className='row'>{data["state"]}</span>
          </div>
        </div>
        {data["state"] !== "NOT_FOUND" ?
          <>
            Please, save this URL to check the status of your prediction: <a href={`/status/${id}`}>{`/status/${id}`}</a>
          </> :
          <>
            <p>Sorry, the ID you are looking for does not exist</p>
            <p>You can always go back to the <a href="/">homepage</a>.</p>
          </>
        }
        {data["state"] === "SUCCESS" &&
          <>

            <a className='button open-results no-margin'
              href={`/result/${data["result"]["filePath"]}`}>Show results</a>
            <ScrollableTextComponent title="Command Output:" text={data["result"]["stdout"].trim()} />
          </>

        }
        {data["state"] === "INTERNAL_ERROR" &&
          <>
            <ScrollableTextComponent title="Error Output:" type="Error" text={data["result"]["stderr"].trim()} />
            <ScrollableTextComponent title="Command Output:" text={data["result"]["stdout"].trim()} />
          </>

        }

      </div>
      {ePopup && (
        // TODO: Correct for weird popup behaviour
        <Error
          error={data["result"]["stderr"]}
          header={eHeader}
          onCancel={() => setEPopup(!ePopup)}
        />
      )}


    </>)
}

export default StatusSite;
