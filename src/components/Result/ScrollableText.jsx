import React, { useRef, useEffect } from "react";

// CSS styles to mimic Java program output
const styles = {
    container: {
        maxHeight: '20vh', // Adjust height as needed
        overflowY: 'scroll', // Add vertical scroll
        backgroundColor: '#f0f0f0', // Light grey background similar to console
        border: '1px solid #ccc', // Border to mimic console edges
        fontFamily: 'monospace', // Monospaced font similar to console output
        fontSize: '16px', // Adjust size as needed
        color: 'black', // Text color
        padding: '10px', // Padding inside the container
        whiteSpace: 'pre-line', // Keep line breaks

    }
};

// React component
const ScrollableTextComponent = ({ text, type, title }) => {
    const div = useRef(null)
    useEffect(() => div.current.scrollTo(0, div.current.scrollHeight), [])

    return (
        <div style={{
            width: '60%', 
        }}>
            <p className='header status' style={{ marginBottom: "0.5em", marginRight: "0.5em" }}>{title}</p>
            <div style={{ ...styles.container, color: type ? "darkred" : "black" }} ref={div}>
                {text}
            </div>
        </div>

    );
};

export default ScrollableTextComponent;